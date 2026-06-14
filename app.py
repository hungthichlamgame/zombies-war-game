try:
    from gevent import monkey
    monkey.patch_all()
except ImportError:
    pass

import string
import random
import sqlite3
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, request, session, jsonify, g
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

DATABASE = 'game.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                dollars INTEGER DEFAULT 0,
                high_score INTEGER DEFAULT 0,
                unlocked_characters TEXT DEFAULT '["soldier"]',
                auto_skip INTEGER DEFAULT 1
            )
        ''')
        db.commit()

init_db()

rooms = {} # room_code -> {'players': {sid: player_number}, 'host': sid}

def generate_room_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if code not in rooms:
            return code

@app.route('/')
def index():
    return render_template('index.html')

# --- API Routes ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Vui lòng nhập tài khoản và mật khẩu'}), 400
    
    db = get_db()
    try:
        db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', 
                   (username, generate_password_hash(password)))
        db.commit()
        return jsonify({'success': True, 'msg': 'Đăng ký thành công'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Tài khoản đã tồn tại'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        return jsonify({
            'success': True,
            'user': {
                'username': user['username'],
                'dollars': user['dollars'],
                'high_score': user['high_score'],
                'unlocked_characters': json.loads(user['unlocked_characters']),
                'auto_skip': user['auto_skip']
            }
        })
    return jsonify({'error': 'Tài khoản hoặc mật khẩu không đúng'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return jsonify({'success': True})

@app.route('/api/me', methods=['GET'])
def get_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'logged_in': False})
    
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if user:
        return jsonify({
            'logged_in': True,
            'user': {
                'username': user['username'],
                'dollars': user['dollars'],
                'high_score': user['high_score'],
                'unlocked_characters': json.loads(user['unlocked_characters']),
                'auto_skip': user['auto_skip']
            }
        })
    return jsonify({'logged_in': False})

@app.route('/api/save', methods=['POST'])
def save_data():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.json
    db = get_db()
    fields = []
    values = []
    if 'dollars' in data:
        fields.append('dollars = ?')
        values.append(data['dollars'])
    if 'high_score' in data:
        fields.append('high_score = ?')
        values.append(data['high_score'])
    if 'unlocked_characters' in data:
        fields.append('unlocked_characters = ?')
        values.append(json.dumps(data['unlocked_characters']))
    if 'auto_skip' in data:
        fields.append('auto_skip = ?')
        values.append(data['auto_skip'])
        
    if fields:
        values.append(user_id)
        query = 'UPDATE users SET ' + ', '.join(fields) + ' WHERE id = ?'
        db.execute(query, values)
        db.commit()
        return jsonify({'success': True})
    return jsonify({'success': False, 'msg': 'No data to save'})

@socketio.on('create_room')
def handle_create_room():
    room_code = generate_room_code()
    rooms[room_code] = {'players': {request.sid: 1}, 'host': request.sid}
    join_room(room_code)
    emit('room_created', {'room_code': room_code, 'player_id': 1})
    print(f"Room created: {room_code} by {request.sid}")

@socketio.on('join_room')
def handle_join_room(data):
    room_code = data.get('room_code', '').upper()
    if room_code in rooms:
        room_data = rooms[room_code]
        if len(room_data['players']) >= 4:
            emit('error', {'msg': 'Phòng đã đầy!'})
            return
            
        # Tìm ID trống từ 1 đến 4
        used_ids = set(room_data['players'].values())
        player_id = 1
        for i in range(1, 5):
            if i not in used_ids:
                player_id = i
                break
                
        room_data['players'][request.sid] = player_id
        join_room(room_code)
        
        emit('room_joined', {'room_code': room_code, 'player_id': player_id})
        # Thông báo cho host có người mới vào
        emit('player_joined', {'sid': request.sid, 'player_id': player_id}, room=room_data['host'])
        print(f"Player {player_id} joined room {room_code}")
    else:
        emit('error', {'msg': 'Không tìm thấy phòng!'})

@socketio.on('player_input')
def handle_player_input(data):
    room_code = data.get('room_code')
    if room_code in rooms:
        host_sid = rooms[room_code]['host']
        # Gửi phím bấm đến host
        emit('remote_input', data, room=host_sid)

@socketio.on('game_state')
def handle_game_state(data):
    room_code = data.get('room_code')
    if room_code in rooms:
        # Gửi toàn bộ trạng thái game (từ host) tới các guest
        emit('game_state', data['state'], room=room_code, include_self=False)

@socketio.on('start_game')
def handle_start_game(data):
    room_code = data.get('room_code')
    if room_code in rooms:
        emit('game_started', room=room_code)

@socketio.on('disconnect')
def handle_disconnect():
    for room_code, room_data in list(rooms.items()):
        if request.sid in room_data['players']:
            player_id = room_data['players'].pop(request.sid)
            if request.sid == room_data['host']:
                # Nếu host thoát, hủy phòng
                emit('host_left', room=room_code)
                del rooms[room_code]
            else:
                emit('player_left', {'player_id': player_id}, room=room_data['host'])

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
