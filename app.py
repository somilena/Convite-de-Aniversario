from flask import Flask, render_template, request, jsonify, url_for
import psycopg2
import os

app = Flask(__name__)

# O Render fornecerá a DATABASE_URL como uma variável de ambiente
# Ex: postgres://user:pass@host:port/dbname
DATABASE_URL = os.environ.get('DATABASE_URL')

# --- Funções do Banco de Dados PostgreSQL ---

def get_db_connection():
    """Cria e retorna a conexão com o banco de dados PostgreSQL."""
    if not DATABASE_URL:
        # Isso deve falhar o deploy no Render se a variável não for configurada.
        raise EnvironmentError("DATABASE_URL não configurada. Verifique as variáveis de ambiente.")
        
    # Conecta-se usando a URL de conexão fornecida pelo Render
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """Inicializa o banco de dados e cria a tabela RSVP, se não existir."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # PostgreSQL syntax para criar a tabela
        cur.execute("""
            CREATE TABLE IF NOT EXISTS rsvps (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                participacao VARCHAR(3) NOT NULL, -- 'SIM' ou 'NAO'
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        cur.close()
        print("Tabela rsvps verificada/criada no PostgreSQL.")
    except Exception as e:
        print(f"ERRO CRÍTICO ao inicializar o BD: {e}")
        # Levantar o erro para que o Gunicorn/Render saiba que falhou.
        raise e
    finally:
        if conn:
            conn.close()

# GARANTE A CRIAÇÃO DA TABELA NA INICIALIZAÇÃO DO SERVIDOR (GUNICORN)
init_db()


# --- Roteamento da Aplicação ---

@app.route('/')
def index():
    """Rota principal: Renderiza o convite HTML."""
    return render_template('index.html')

@app.route('/api/confirmar', methods=['POST'])
def confirmar_presenca():
    """API para receber a confirmação de presença (RSVP)."""
    data = request.json
    nome = data.get('nome', '').strip()
    participacao = data.get('participacao', '').upper()
    
    if not nome or participacao not in ['SIM', 'NAO']:
        return jsonify({'message': 'Dados inválidos.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 1. Tenta encontrar um registro existente
        # Usamos %s como placeholder no psycopg2
        cur.execute("SELECT id FROM rsvps WHERE nome = %s", (nome,))
        existente = cur.fetchone()
        
        if existente:
            # 2. Atualiza se já existe
            cur.execute("UPDATE rsvps SET participacao = %s, timestamp = CURRENT_TIMESTAMP WHERE id = %s",
                         (participacao, existente[0]))
            message = "Confirmação atualizada com sucesso!"
        else:
            # 3. Insere novo registro
            cur.execute("INSERT INTO rsvps (nome, participacao) VALUES (%s, %s)", 
                         (nome, participacao))
            message = "Confirmação enviada com sucesso!"
            
        conn.commit()
        cur.close()
        return jsonify({'message': message}), 200
    except Exception as e:
        if conn:
            conn.rollback() # Desfaz a operação em caso de erro
        return jsonify({'message': f'Erro no banco de dados: {e}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/confirmados', methods=['GET'])
def listar_confirmados():
    """API para listar os convidados que confirmaram 'SIM'."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT nome FROM rsvps WHERE participacao = 'SIM' ORDER BY nome ASC")
        # Pega apenas o primeiro elemento de cada tupla (o nome)
        confirmados = [row[0] for row in cur.fetchall()] 
        
        cur.close()
        return jsonify(confirmados), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar lista: {e}'}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    # Apenas para testes locais (sem Gunicorn)
    app.run(host='0.0.0.0', port=5000)
    
    # Configurações de segurança: o Render irá fornecer este valor.
ADMIN_TOKEN = os.environ.get('admin', 'admin') 
# ^ Se estiver no Render, ele usa o valor da variável de ambiente. 
# Se localmente, ele usa o default.
# Quando for para o Render, você DEVE trocar o 'senha_super_secreta_default' por algo forte.

@app.route('/admin', methods=['GET'])
def admin_dashboard():
    # Verifica se o token na URL corresponde ao token secreto
    token_fornecido = request.args.get('token')
    if token_fornecido != ADMIN_TOKEN:
        # Retorna 403 Proibido se o token for inválido
        return "Acesso Negado: Token de administrador inválido.", 403

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Busca TODOS os RSVPs (SIM e NÃO), ordenados por data
        cur.execute("SELECT id, nome, participacao, timestamp FROM rsvps ORDER BY timestamp DESC")

        # Formata os dados para o template
        rsvps = [
            {'id': row[0], 'nome': row[1], 'participacao': row[2], 'data': row[3].strftime("%d/%m %H:%M")}
            for row in cur.fetchall()
        ]

        cur.close()
        return render_template('admin.html', rsvps=rsvps)
    except Exception as e:
        return f"Erro ao carregar dashboard: {e}", 500
    finally:
        if conn:
            conn.close()
            
@app.route('/api/excluir/<int:rsvp_id>', methods=['POST'])
def excluir_rsvp(rsvp_id):
    # Proteção: A exclusão deve ser feita APENAS com o token correto
    # O JavaScript (admin.html) envia o token que estava na URL
    token_fornecido = request.json.get('token')
    if token_fornecido != ADMIN_TOKEN:
        # Se o token não bater com o que está configurado, o acesso é negado.
        return jsonify({'success': False, 'message': 'Token de administrador inválido.'}), 403

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # O comando SQL: Deleta a linha da tabela 'rsvps' onde o 'id' corresponde ao ID recebido.
        cur.execute("DELETE FROM rsvps WHERE id = %s", (rsvp_id,))
        
        conn.commit() # Confirma a exclusão no banco de dados.
        cur.close()
        return jsonify({'success': True, 'message': f'RSVP ID {rsvp_id} excluído.'}), 200
    except Exception as e:
        # Em caso de erro (ex: BD offline), desfaz a operação.
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir: {e}'}), 500
    finally:
        if conn:
            conn.close()