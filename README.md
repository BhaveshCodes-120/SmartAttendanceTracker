# Smart Attendance System Prototype

This is a complete prototype of a Smart Attendance System using Face Recognition.
It features a Node.js backend (using JSON files as a database for easy setup) and a vanilla HTML/JS/CSS frontend built with `face-api.js` for face recognition.

## Features
- **Modern UI**: Smooth gradients, glassmorphism design, responsive layouts.
- **Admin Registration**: Fast mapping of faces to user profiles using a webcam.
- **Live Attendance**: Real-time bounding boxes showing matches and logging attendance automatically.
- **Offline Face Recognition**: Models for face-api are stored locally without needing third-party API calls.
- **No Database Config**: Uses local `users.json` and `attendance.json` inside the backend.

## Structure
- `backend/`: Node.js + Express API server and data storage.
- `frontend/`: HTML, CSS (style.css), JS (logic and face-api lib), and model weights.

## How to Run locally

### 1. Start the Backend
Open a terminal in the folder where this project is located, then:
```bash
cd backend
npm install
node server.js
```
The server will start on `http://localhost:3000`.

### 2. Start the Frontend
Because the frontend requires access to your webcam (which browsers restrict on `file://` protocols) and needs to fetch models, you must serve the `frontend/` folder via a local web server.

Open a **new** terminal:
```bash
cd frontend
npx http-server -p 8080 -c-1
```
*(If prompted to install `http-server`, press 'y').*

Alternatively, you can use the Live Server extension in VS Code.

### 3. Use the System
1. Open your browser and go to `http://localhost:8080` (or whichever port your server uses).
2. Click **Admin Registration**.
3. When prompted for a PIN, enter `admin`.
4. Allow webcam access. Enter a test student name, roll number, and division.
5. Wait for the blue bounding box to appear on your face, then click **Capture & Register**.
6. Go back to Home and open **Mark Attendance**.
7. Look at the camera. The app will detect your face, show a green box with your name, and log your attendance on the right!

> **Note:** For privacy and security on some browsers, webcam API strictly requires `localhost` or `https`. Ensure you access it via `http://localhost:<port>`.
