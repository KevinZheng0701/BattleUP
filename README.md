# Battle UP

## Overview

**Battle UP** is a full-stack web application that gamifies fitness by enabling users to engage in **real-time push-up battles** using live video and AI-based motion tracking. Whether you're challenging a friend or testing your limits against a stranger, Battle UP transforms workouts into a competitive and social experience.

## Problem Statement

Staying motivated during solo workouts can be difficult. Traditional fitness apps often fail to engage users in a meaningful or social way, leading to decreased consistency and motivation.

**Battle UP** addresses this challenge by introducing real-time competition into home fitness. By combining live video streaming with AI-powered motion tracking, the app transforms push-up workouts into exciting, interactive battles — encouraging users to push their limits while having fun with friends or strangers.

## Key Features

- 1v1 Real-Time Battles: Users enter a virtual arena to compete head-to-head doing push-ups.

- AI-Based Push-Up Counter: A Python-powered model processes webcam input to detect and count push-ups.

- Live Video Streaming: Peer-to-peer video communication (via WebRTC) ensures low-latency, real-time feedback.

- Responsive UI: Built with Next.js and TypeScript, ensuring a fast and user-friendly experience.

- Matchmaking & Room System: Flask-SocketIO backend handles matchmaking and communication between users.

# Tech Stack

- 🚀 Frontend: Developed using **Next.js** and **TypeScript**, styled with **Tailwind CSS** to deliver a responsive, modern, and user-friendly user experience.

- 🧠 Backend: Built with **Python Flask** and **Flask-SocketIO** to handle real-time communication and matchmaking between users.

- 🎥 Video Streaming: Utilizes **WebRTC** for low-latency, peer-to-peer video connections between players.

## Getting Started

1. **Clone the Repository**

```bash
git clone https://github.com/KevinZheng0701/BattleUP.git
```

2. **Navigate to the Project Directory**

```bash
cd BattleUP
```

## Installation

### Client Setup

3. **Navigate to the `frontend` folder**

```bash
cd frontend
```

4. **Install client dependencies**

```bash
npm install
```

5. **Set up client environment variables**

```bash
cp .env.example .env
```

Open .env and fill in the required values.

6. **(Optional) Set up TURN servers**

If you plan to use TURN servers for WebRTC connectivity, head over to Xirsys and generate a key. Insert the relevant credentials into your .env file.

7. **Run the client**

```bash
npm run dev
```

### Server Setup

8. **Navigate to the `backend` folder**

```bash
cd backend
```

9. **Set up server environment variables**

```bash
cp .env.example .env
```

Open .env and fill in the required values.

10. **Set up python virtual environment**

```bash
python -m venv venv
```

11. **Activate the virtual environment**

- On macOS/Linux:

  ```bash
  source venv/bin/activate
  ```

- On Windows:

  ```bash
  venv\Scripts\activate
  ```

12. **Install server dependencies**

```bash
pip install -r requirements-dev.txt
```

13. **Run the server**

```bash
python server.py
```
