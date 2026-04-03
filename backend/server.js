const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
// Parse incoming requests with JSON payloads (we might have large descriptor arrays)
app.use(bodyParser.json({ limit: '50mb' }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Paths to our JSON 'databases'
const usersFile = path.join(__dirname, 'data', 'users.json');
const attendanceFile = path.join(__dirname, 'data', 'attendance.json');

// Helper to read data
const readData = (file) => {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper to write data
const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
};

// --- API ENDPOINTS --- //

// Register a new user
app.post('/api/register', (req, res) => {
    const { name, rollNo, division, descriptor } = req.body;

    if (!name || !rollNo || !division || !descriptor) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = readData(usersFile);
    
    // Check if user already exists
    if (users.find(u => u.rollNo === rollNo)) {
        return res.status(400).json({ error: 'User with this Roll No already exists' });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        rollNo,
        division,
        descriptor // 128-dimensional array
    };

    users.push(newUser);
    writeData(usersFile, users);

    res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// Get all registered users (for matching on the frontend)
app.get('/api/users', (req, res) => {
    const users = readData(usersFile);
    res.json(users);
});

// Mark attendance
app.post('/api/attendance', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const users = readData(usersFile);
    const user = users.find(u => u.id === userId || u.rollNo === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const attendance = readData(attendanceFile);
    
    // Check if already marked today
    const today = new Date().toDateString();
    const alreadyMarked = attendance.find(a => a.userId === user.id && new Date(a.timestamp).toDateString() === today);

    if (alreadyMarked) {
        return res.status(200).json({ message: 'Attendance already marked for today', log: alreadyMarked, alreadyMarked: true });
    }

    const log = {
        id: Date.now().toString(),
        userId: user.id,
        name: user.name,
        rollNo: user.rollNo,
        division: user.division,
        timestamp: new Date().toISOString()
    };

    attendance.push(log);
    writeData(attendanceFile, attendance);

    res.status(201).json({ message: `Attendance marked successfully for ${user.name}`, log });
});

// Get daily attendance logs (e.g. for today)
app.get('/api/attendance', (req, res) => {
    const attendance = readData(attendanceFile);
    
    // For a prototype, simply returning all or sort by newest
    const sorted = attendance.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(sorted);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
