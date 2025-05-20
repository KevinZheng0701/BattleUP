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
        players_map = active_rooms[room]['players']
        players_map[player_id]['sid'] = request.sid

        players = list(players_map.keys())
        # Send role status back to the clients
        if len(players) == 2 and all(players_map[player]['sid'] for player in players):
            offerer_sid = players_map[players[0]]['sid']
            answerer_sid = players_map[players[1]]['sid']
            emit('ready', 'offerer', room=offerer_sid)
            emit('ready', 'answerer', room=answerer_sid)

# Handle signal messages from the client
@socketio.on('signal')
def on_signal(data):
    room = data['room']
    emit('signal', data, room=room, include_self=False) # Send the message to the other client

# Handle ready messages from the client
@socketio.on('ready')
def on_ready(data):
    room = data['room']
    player_id = data['userId']
    with room_lock:
        if room not in active_rooms:
            print("[Server] Error: Room not found!")
            return
        
        # Update the state of the player
        active_rooms[room]['players'][player_id]['status'] = "ready"
        if all(player['status'] == "ready" for player in active_rooms[room]['players'].values()):
            active_rooms[room]['status'] = "playing"
            emit('start', data, room=room) # Send the start signal for starting the game

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
    player_id = data.get('userId')
    duration = data.get('duration')

    # If no id is given then return 400 response
    if not player_id:
        return jsonify({'message': 'Player ID is required'}), 400
    
    with room_lock:
        # Ensure the player is not in another room
        for room_id, info in active_rooms.items():
            players = info['players']
            if player_id in players:
                # If the game didn't end yet, the player will be notified
                if info['status'] not in {"ended", "rematch", "disconnected"}:
                    return jsonify({'message': "You're already in a session."}), 403

        # Search for an open room with the same duration
        open_active_rooms = [room_id for room_id, info in active_rooms.items() if len(info['players']) == 1 and info['duration'] == duration and info['status'] == "waiting"]
        
        # Join a random open room
        if open_active_rooms:
            selected_room = random.choice(open_active_rooms)
            active_rooms[selected_room]['status'] = 'setting' # Update the status to be setting
            active_rooms[selected_room]['players'][player_id] = {'status': 'waiting', 'sid': None}
            return jsonify({'roomId': selected_room, 'status': 'setting'})
        else:
            # Create a new open room if no active rooms are found
            new_room_id = generate_room_id()
            while new_room_id in active_rooms:
                new_room_id = generate_room_id()
            player_details = {player_id: {'status': 'waiting', 'sid': None}}
            active_rooms[new_room_id] = {'status': 'waiting', 'duration': duration, 'players': player_details}
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
    if room_id in active_rooms and len(active_rooms[room_id]['players']) == 0:
        del active_rooms[room_id] # Delete the room if there are no more players in the room

def process_leave_room(connection_sid):
    """Process the player leaving"""
    with room_lock:
        for room_id, info in list(active_rooms.items()):
            players = info['players']
            for player_id, value in list(players.items()):
                if value['sid'] == connection_sid:
                    del players[player_id] # Remove player from the room
                    if len(players) == 1:
                        emit('opponent_left', room=room_id, include_self=False) # Send disconnection status to the other client in the room
                        info['status'] = "disconnected"
                    elif len(players) == 0:
                        delete_room(room_id)
                    return

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    try:
        socketio.run(app, host="0.0.0.0", port=5001)
    except KeyboardInterrupt:
        print("\n[Server] Shutting down gracefully...")