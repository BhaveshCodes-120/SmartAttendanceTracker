const video = document.getElementById('video');
const canvas = document.getElementById('overlayCanvas');
const captureBtn = document.getElementById('captureBtn');
let currentDescriptor = null;

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

// 1. Load Models
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(startVideo).catch(err => {
    console.error(err);
    showToast('Failed to load AI models. Make sure you downloaded them to frontend/models/', 'error');
});

// 2. Start Video
function startVideo() {
    document.getElementById('overlay').style.display = 'none'; // Hide loader
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Webcam error:", err);
            showToast('Failed to access webcam.', 'error');
        });
}

// 3. Detect Faces when video plays
video.addEventListener('play', () => {
    // Match canvas to video size
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        // Detect single face with highest confidence
        const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

        // Clear previous drawings
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
            // Draw box
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetection);
            
            // Save descriptor and enable button
            currentDescriptor = Array.from(detection.descriptor); // Convert Float32Array to standard array for JSON
            captureBtn.disabled = false;
        } else {
            currentDescriptor = null;
            captureBtn.disabled = true;
        }
    }, 200); // Check every 200ms
});

// 4. Handle Registration
captureBtn.addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const rollNo = document.getElementById('rollNo').value.trim();
    const division = document.getElementById('division').value.trim();

    if (!name || !rollNo || !division) {
        showToast('Please fill all fields', 'error');
        return;
    }

    if (!currentDescriptor) {
        showToast('No face detected. Please face the camera.', 'error');
        return;
    }

    captureBtn.disabled = true;
    captureBtn.innerText = 'Registering...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                rollNo,
                division,
                descriptor: currentDescriptor
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('User Registered Successfully!', 'success');
            // Clear form
            document.getElementById('name').value = '';
            document.getElementById('rollNo').value = '';
            document.getElementById('division').value = '';
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to connect to server', 'error');
    } finally {
        captureBtn.innerText = 'Capture & Register';
    }
});
