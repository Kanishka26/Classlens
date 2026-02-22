const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const sessionRoutes = require('./routes/session.routes');
const engagementRoutes = require('./routes/engagement.routes');
const classroomsRoutes = require('./routes/classrooms.routes');
const { initEngagementSocket } = require('./sockets/engagement.socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: '10mb' }));

app.use('/auth', authRoutes);
app.use('/session', sessionRoutes);
app.use('/engagement', engagementRoutes);
app.use('/classrooms', classroomsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ClassLens Backend' }));

initEngagementSocket(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`ClassLens backend running on port ${PORT}`));
