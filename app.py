# app.py

from flask import Flask, render_template, request, jsonify, url_for
import psycopg2
import os
from dotenv import load_dotenv
from flask_livereload import LiveReload # Pacote para recarga automática no navegador

# -----------------------------------------------------------------
# 1. Configuração do Ambiente
# -----------------------------------------------------------------
# Carrega variáveis do arquivo .env (apenas localmente)
load_dotenv()

# Obtém variáveis do ambiente (ou do .env se local). 
# A senha de admin será 'admin' se configurada no .env ou no Render.
DATABASE_URL = os.environ.get('DATABASE_URL')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'senha_super_secreta_default') 

app = Flask(__name__)

# Configurações essenciais para desenvolvimento
app.config['SECRET_KEY'] = os.urandom(24) # Recomendado para Flask
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 # Desativa cache de arquivos estáticos (CSS/JS)

# -----------------------------------------------------------------
# 2. Inicializa o LiveReload
# -----------------------------------------------------------------
# O LiveReload só é ativo no modo de desenvolvimento (debug=True)
if app.config.get("DEBUG"):
    try:
        LiveReload(app)
        print("✅ LiveReload ATIVO.")
    except Exception as e:
        print(f"⚠️ Erro ao ativar LiveReload. Instale o pacote: {e}")


# --- Funções do Banco de Dados PostgreSQL ---

def get_db_connection():
    """Cria e retorna a conexão com o banco de dados PostgreSQL."""
    if not DATABASE_URL:
        # Se falhar aqui, verifique se a DATABASE_URL está no seu .env
        raise EnvironmentError("DATABASE_URL não configurada. Verifique as variáveis de ambiente.")
        
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """Inicializa o banco de dados e cria a tabela RSVP, se não existir."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Cria a tabela rsvps com colunas nome, participação e ID serial
        cur.execute("""
            CREATE TABLE IF NOT EXISTS rsvps (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                participacao VARCHAR(3) NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        cur.close()
        print("✅ Tabela rsvps verificada/criada no PostgreSQL.")
    except Exception as e:
        print(f"❌ ERRO CRÍTICO ao inicializar o BD: {e}")
        raise e
    finally:
        if conn:
            conn.close()

# GARANTE A CRIAÇÃO DA TABELA NA INICIALIZAÇÃO DO SERVIDOR (Para Gunicorn e Local)
init_db()


# --- 3. Rotas da Aplicação ---

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

        # Verifica se o convidado já existe
        cur.execute("SELECT id FROM rsvps WHERE nome = %s", (nome,))
        existente = cur.fetchone()
        
        if existente:
            # Atualiza
            cur.execute("UPDATE rsvps SET participacao = %s, timestamp = CURRENT_TIMESTAMP WHERE id = %s",
                         (participacao, existente[0]))
            message = "Confirmação atualizada com sucesso!"
        else:
            # Insere
            cur.execute("INSERT INTO rsvps (nome, participacao) VALUES (%s, %s)", 
                         (nome, participacao))
            message = "Confirmação enviada com sucesso!"
            
        conn.commit()
        cur.close()
        return jsonify({'message': message}), 200
    except Exception as e:
        if conn:
            conn.rollback() 
        return jsonify({'message': f'Erro no banco de dados: {e}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/confirmados', methods=['GET'])
def listar_confirmados():
    """API para listar os convidados que confirmaram 'SIM' (visível no convite)."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT nome FROM rsvps WHERE participacao = 'SIM' ORDER BY nome ASC")
        confirmados = [row[0] for row in cur.fetchall()] 
        
        cur.close()
        return jsonify(confirmados), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao buscar lista: {e}'}), 500
    finally:
        if conn:
            conn.close()

# -----------------------------------------------------------------
# 🔒 Rotas de Administração
# -----------------------------------------------------------------

@app.route('/admin', methods=['GET'])
def admin_dashboard():
    """Dashboard para visualizar todas as confirmações."""
    # O token deve ser 'admin' se configurado no ambiente
    token_fornecido = request.args.get('token')
    if token_fornecido != ADMIN_TOKEN:
        return "Acesso Negado: Token de administrador inválido.", 403

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, nome, participacao, timestamp FROM rsvps ORDER BY timestamp DESC")
        
        rsvps = [
            {'id': row[0], 'nome': row[1], 'participacao': row[2], 'data': row[3].strftime("%d/%m %H:%M")}
            for row in cur.fetchall()
        ]

        cur.close()
        # Passa o token de volta para o JavaScript do admin.html usar na exclusão
        return render_template('admin.html', rsvps=rsvps, admin_token=ADMIN_TOKEN)
    except Exception as e:
        return f"Erro ao carregar dashboard: {e}", 500
    finally:
        if conn:
            conn.close()

@app.route('/api/excluir/<int:rsvp_id>', methods=['POST'])
def excluir_rsvp(rsvp_id):
    """API para excluir um registro de RSVP."""
    token_fornecido = request.json.get('token')
    if token_fornecido != ADMIN_TOKEN:
        return jsonify({'success': False, 'message': 'Token de administrador inválido.'}), 403

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM rsvps WHERE id = %s", (rsvp_id,))
        conn.commit()
        cur.close()
        return jsonify({'success': True, 'message': f'RSVP ID {rsvp_id} excluído.'}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir: {e}'}), 500
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    # 💥 DEBUG=TRUE ATIVADO PARA O LIVERELOAD FUNCIONAR!
    app.run(host='0.0.0.0', port=5000, debug=True)