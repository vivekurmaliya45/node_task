const express = require('express');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const server = require('http').createServer(app);
const io = socketIO(server);

const authenticateJWT = require("./helpers/auth");
const users = require("./models/user");


app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cors());
app.options('*', cors());


// Register a new user
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if the username is already taken
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ message: 'Username is already taken' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = { username, password: hashedPassword };
    users.push(newUser);

    res.status(201).json({ message: 'User registered successfully' });
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(user => user.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });

    res.json({ token });
});

// Request chat with another user
app.post('/chat/request', authenticateJWT, (req, res) => {
    const { username } = req.user;
    const { recipient } = req.body;

    // Check if the recipient exists
    const recipientUser = users.find(user => user.username === recipient);

    if (!recipientUser) {
        return res.status(404).json({ message: 'Recipient not found' });
    }

    // Emit chat request event to the recipient
    io.to(recipientUser.socketId).emit('chat:request', { sender: username });

    res.json({ message: 'Chat request sent' });
});

// Accept chat request
app.post('/chat/accept', authenticateJWT, (req, res) => {
    const { username } = req.user;
    const { sender } = req.body;

    // Check if the sender exists
    const senderUser = users.find(user => user.username === sender);

    if (!senderUser) {
        return res.status(404).json({ message: 'Sender not found' });
    }

    // Emit chat acceptance event to the sender
    io.to(senderUser.socketId).emit('chat:accept', { recipient: username });

    res.json({ message: 'Chat request accepted' });
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Save user's socket ID
    socket.on('authenticate', (token) => {
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                socket.disconnect();
                return;
            }

            const { username } = user;
            const userIndex = users.findIndex(user => user.username === username);

            if (userIndex !== -1) {
                users[userIndex].socketId = socket.id;
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Remove the socket ID from the users array
        const userIndex = users.findIndex(user => user.socketId === socket.id);

        if (userIndex !== -1) {
            users[userIndex].socketId = null;
        }
    });
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
