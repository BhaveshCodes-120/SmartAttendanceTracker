const video = document.getElementById('video');
const canvas = document.getElementById('overlayCanvas');
const logsTableBody = document.getElementById('logsTableBody');
const loadingText = document.getElementById('loadingText');

let faceMatcher = null;
const cooldowns = {}; // To prevent spamming API requests for the same user

// Utility for Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        if(container.contains(toast)) container.removeChild(toast);
    }, 3500);
}

// Format Time
function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 1. Fetch Users & Initialize FaceMatcher
async function loadUserData() {
    loadingText.innerText = 'Loading User Data...';
    try {
        const response = await fetch("https://smartattendancetracker-1.onrender.com/api/users");
        const users = await response.json();

        if (users.length === 0) {
            showToast('No registered users found in system.', 'error');
            return null;
        }

        const labeledDescriptors = users.map(user => {
            // Convert standard array back to Float32Array for face-api
            const floatArray = new Float32Array(user.descriptor);
            // Label is the user ID and Name stringified so we can parse it later
            const labelStr = JSON.stringify({ id: user.id, name: user.name });
            return new faceapi.LabeledFaceDescriptors(labelStr, [floatArray]);
        });

        return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is max descriptor distance
    } catch (err) {
        console.error(err);
        showToast('Could not fetch user data from server.', 'error');
        return null;
    }
}

// 2. Fetch and Render Attendance Logs
async function fetchLogs() {
    try {
        const response = await fetch("https://smartattendancetracker-1.onrender.com/api/attendance");
        const logs = await response.json();
        
        // Filter logs to just show today's if preferred, but for prototype we show all available from API
        logsTableBody.innerHTML = '';
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.name}</td>
                <td>${log.rollNo}</td>
                <td>${formatTime(log.timestamp)}</td>
            `;
            logsTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to fetch logs', err);
    }
}

// 3. Mark Attendance API Call
async function markAttendance(userData) {
    // Check cooldown to avoid spamming the endpoint 10 times a second
    if (cooldowns[userData.id] && (Date.now() - cooldowns[userData.id] < 5000)) {
        return; // Ignore if marked in the last 5 seconds
    }
    cooldowns[userData.id] = Date.now();

    try {
        const response = await fetch("https://smartattendancetracker-1.onrender.com/api/attendance", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData.id })
        });
        
        const data = await response.json();
        
        if (response.ok && !data.alreadyMarked) {
            showToast(`Attendance Marked: ${userData.name}`, 'success');
            fetchLogs(); // Refresh logs immediately
        } else if (response.ok && data.alreadyMarked) {
            // We can optionally show a toast or do nothing
            // showToast(`Already marked today: ${userData.name}`, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// Initialize System
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(async () => {
    faceMatcher = await loadUserData();
    fetchLogs(); // Load initial logs
    startVideo();
}).catch(err => {
    console.error(err);
    showToast('Failed to start system.', 'error');
});

// Start Video
function startVideo() {
    document.getElementById('overlay').style.display = 'none';
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { video.srcObject = stream; })
        .catch(err => showToast('Webcam access error', 'error'));
}

// Continuous Detection
video.addEventListener('play', () => {
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        if (!faceMatcher) return; // If no users, just skip detect

        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach(detection => {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            
            let label = "Unknown";
            let boxColor = 'red';

            if (match.label !== 'unknown' && match.distance < 0.6) {
                const userData = JSON.parse(match.label);
                label = `${userData.name} (${Math.round((1 - match.distance) * 100)}%)`;
                boxColor = 'green';
                
                // Attempt to mark attendance
                markAttendance(userData);
            }

            // Draw custom box and label
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { label, boxColor });
            drawBox.draw(canvas);
        });

    }, 200); // 5 FPS
});
