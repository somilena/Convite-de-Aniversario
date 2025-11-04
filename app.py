from flask import Flask, render_template, request, jsonify, url_for
import psycopg2
import os
from dotenv import load_dotenv

# 1. Configuração do Ambiente
load_dotenv() # Carrega o .env

DATABASE_URL = os.environ.get('DATABASE_URL')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'admin') # Default 'admin' se não estiver no .env

app = Flask(__name__)

# Configurações para desenvolvimento
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 


# --- Funções do Banco de Dados ---
def get_db_connection():
    if not DATABASE_URL:
        raise EnvironmentError("DATABASE_URL não configurada.")
    return psycopg2.connect(DATABASE_URL)

def init_db():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
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
        print("✅ Tabela rsvps verificada.")
    except Exception as e:
        print(f"❌ ERRO CRÍTICO ao inicializar o BD: {e}")
        raise e
    finally:
        if conn:
            conn.close()

init_db() # Roda a verificação do BD ao iniciar

# --- Rotas da Aplicação ---

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
        return jsonify({'message': 'Você não tem escolha!'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM rsvps WHERE nome = %s", (nome,))
        existente = cur.fetchone()
        
        if existente:
            cur.execute("UPDATE rsvps SET participacao = %s, timestamp = CURRENT_TIMESTAMP WHERE id = %s",
                         (participacao, existente[0]))
            message = "Confirmação atualizada com sucesso!"
        else:
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
    """API para listar os convidados que confirmaram 'SIM' (para o modal)."""
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

# --- Rotas de Administração ---
@app.route('/admin', methods=['GET'])
def admin_dashboard():
    """Dashboard para visualizar todas as confirmações."""
    token_fornecido = request.args.get('token')
    if token_fornecido != ADMIN_TOKEN:
        return "Acesso Negado.", 403

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
        return jsonify({'success': False, 'message': 'Token inválido.'}), 403
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM rsvps WHERE id = %s", (rsvp_id,))
        conn.commit()
        cur.close()
        return jsonify({'success': True}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'Erro: {e}'}), 500
    finally:
        if conn:
            conn.close()

# --- Ponto de Entrada ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)