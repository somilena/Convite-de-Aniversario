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