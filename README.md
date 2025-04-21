# Battle UP

## Overview

**Battle UP** is a web application designed to connect users through **real-time push-up battles**, transforming fitness into a competitive and social experience.

- 🚀 **Frontend**: Built with **Next.js** and **TypeScript** for a fast and responsive user interface.
- 🧠 **Backend**: Powered by **Python Flask**, running an AI model (RNN/LSTM) to detect and count completed push-ups accurately.
- 💪 **Core Feature**: Enables users to challenge friends or strangers in live push-up competitions, with real-time tracking and feedback.

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

3. **Navigate to the `client` folder**

```bash
cd client
```

4. **Install client dependencies**

```bash
npm install
```

5. **Run the client**

```bash
npm run dev
```

### Server Setup

6. **Navigate to the `server` folder**

```bash
cd server
```

7. **Set up python virtual environment (ensure you have python installed)**

```bash
python -m venv venv
```

8. **Activate the virtual environment**

- On macOS/Linux:

  ```bash
  source venv/bin/activate
  ```

- On Windows:

  ```bash
  venv\Scripts\activate
  ```

9. **Install server dependencies**

```bash
pip install -r requirements.txt
```

10. **Run the server**

```bash
python app.py
```
