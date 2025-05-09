import os
import random
import string
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit, leave_room
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

# Flask setup
app = Flask(__name__)

# Setup CORS to allow frontend access
allowed_origins = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000").split(",")
CORS(app, origins=allowed_origins)

# SocketIO setup with gevent
socketio = SocketIO(app, cors_allowed_origins=allowed_origins, async_mode="gevent")

active_rooms = {}
room_lock = threading.Lock()

# Handle join message from the client
@socketio.on('join')
def on_join(data):
    # Get the room id and the user id that is joining
    room = data['room']
    player_id = data['userId']
    join_room(room)

    with room_lock:
        if room not in active_rooms:
            print("[Server] Error: Room not found!")
            return

        # Create the mapping of the player id to the connection
        if 'sid_map' not in active_rooms[room]:
            active_rooms[room]['sid_map'] = {}
        active_rooms[room]['sid_map'][player_id] = request.sid

        room_players = len(active_rooms[room]['sid_map'])
        # Send role status back to the clients
        if room_players == 2:
            players = list(active_rooms[room]['sid_map'].keys())
            offerer_id = players[0]
            answerer_id = players[1]

            offerer_sid = active_rooms[room]['sid_map'][offerer_id]
            answerer_sid = active_rooms[room]['sid_map'][answerer_id]
            emit('ready', 'offerer', room=offerer_sid)
            emit('ready', 'answerer', room=answerer_sid)

# Handle signal messages from the client
@socketio.on('signal')
def on_signal(data):
    room = data['room']
    emit('signal', data, room=room, include_self=False) # Send the message to the other client

# Handle pushup message from the client
@socketio.on('push_up')
def on_push_up(data):
    room = data['room']
    emit('push_up', room=room, include_self=False) # Send the message to the other client

# Handle rematch request message from the client
@socketio.on('rematch')
def on_rematch(data):
    room = data['room']
    with room_lock:
        if room not in active_rooms:
            print("[Server] Error: Room not found!")
            return
        
        status = active_rooms[room]['status']
        if status != "disconnected":
            # Second player also requested rematch
            if status == "rematch":
                active_rooms[room]['status'] = "playing"
                emit('rematch_approved', room=room)
            else:
                # First player initiates rematch
                active_rooms[room]['status'] = "rematch"
                emit('rematch_request', data, room=room, include_self=False)

# Handle client disconnection
@socketio.on('disconnect')
def on_disconnect():
    process_leave_room(request.sid)

# Handle leave room request from the client
@socketio.on('leave_room')
def on_leave(data):
    room = data['room']
    leave_room(room)
    process_leave_room(request.sid)

# Handle game ended message from the client
@socketio.on('game_ended')
def on_end(data):
    room = data['room']
    with room_lock:
        active_rooms[room]['status'] = "ended"

@app.route("/")
def health_check():
    return "Server is running!", 200

@app.route('/api/find-room', methods=['POST'])
def find_room():
    """Find a random empty room and if zero are available then create one"""
    # Get request data
    data = request.get_json()
    player = data.get('userId')
    duration = data.get('duration')

    # If no id is given then return 400 response
    if not player:
        return jsonify({'message': 'Player ID is required'}), 400
    
    with room_lock:
        # Ensure the player is not in another room by redirecting the client
        for room_id, info in active_rooms.items():
            sid_map = info.get('sid_map', {})
            if player in sid_map:
                # If the game didn't end the player will be redirected to the room
                if info['status'] != "ended" and info['status'] != "rematch" and info['status'] != "disconnected":
                    return jsonify({'message': "You're already in a session."}), 403

        # Search for an open room with the same duration
        open_active_rooms = [room_id for room_id, info in active_rooms.items() if len(info.get('sid_map', {})) == 1 and info['duration'] == duration and info['status'] == "waiting"]
        
        # Join a random open room
        if open_active_rooms:
            selected_room = random.choice(open_active_rooms)
            active_rooms[selected_room]['status'] = 'playing' # Update the status to be playing
            return jsonify({'roomId': selected_room, 'status': 'playing'})
        else:
            # Create a new open room if no active rooms are found
            new_room_id = generate_room_id()
            while new_room_id in active_rooms:
                new_room_id = generate_room_id()
            active_rooms[new_room_id] = {'status': 'waiting', 'duration': duration}
            return jsonify({'roomId': new_room_id, 'status': 'waiting', 'duration': duration})

@app.route('/api/check-room', methods=['POST'])
def check_room():
    """Check if a room exist"""
    # Get the room id
    data = request.get_json()
    room = data.get('room')

    with room_lock:
        if room in active_rooms:
            return jsonify({'exists': True, 'status': active_rooms[room]['status'], 'duration': active_rooms[room]['duration']}), 200
        else:
            return jsonify({'exists': False}), 404

def generate_room_id(length=6):
    """Generate a random room id using letters and numbers"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def delete_room(room_id):
    """Function to delete a room"""
    if room_id in active_rooms and len(active_rooms[room_id].get('sid_map', {})) == 0:
        del active_rooms[room_id] # Delete the room if there are no more players in the room after the grace period

def process_leave_room(connection_sid):
    """Process the player leaving"""
    with room_lock:
        for room_id, info in list(active_rooms.items()):
            sid_map = info.get('sid_map', {})
            for player_id, sid in list(sid_map.items()):
                if sid == connection_sid:
                    del sid_map[player_id] # Remove player from the room
                    if len(sid_map) == 1:
                        emit('opponent_left', room=room_id, include_self=False) # Send disconnection status to the other client in the room
                        info['status'] = "disconnected"
                    elif len(sid_map) == 0:
                        delete_room(room_id)
                    return

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    try:
        socketio.run(app, host="0.0.0.0", port=5001)
    except KeyboardInterrupt:
        print("\n[Server] Shutting down gracefully...")