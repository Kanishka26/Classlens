const initEngagementSocket = (io) => {
  // Store participants per session: { [sessionId]: { [socketId]: { agoraUid, name, role } } }
  const sessionParticipants = {};

  io.on('connection', (socket) => {
    console.log('🔗 Socket connected:', socket.id);

    socket.on('join_session', ({ sessionId, role, name }) => {
      socket.join(`session:${sessionId}`);
      console.log(`✅ [${role?.toUpperCase()}] joined room: session:${sessionId} (socket: ${socket.id}), name: ${name}`);
      
      // Initialize session if it doesn't exist
      if (!sessionParticipants[sessionId]) {
        sessionParticipants[sessionId] = {};
      }
      
      // Store initial participant info
      sessionParticipants[sessionId][socket.id] = { name, role, agoraUid: null };
      
      // Send existing participants to the new joiner
      const existingParticipants = Object.values(sessionParticipants[sessionId])
        .filter(p => p.agoraUid) // Only send those who have sent their agoraUid
        .map(p => ({ agoraUid: p.agoraUid, name: p.name, role: p.role }));
      
      console.log(`📤 Sending ${existingParticipants.length} existing participants to new joiner`);
      socket.emit('existing_participants', { participants: existingParticipants });
    });

    socket.on('send_agora_uid', ({ sessionId, agoraUid, name, role }) => {
      console.log(`📤 Received agoraUid from [${role}]:`, { agoraUid, name, socketId: socket.id });
      
      // Update participant with agoraUid
      if (sessionParticipants[sessionId] && sessionParticipants[sessionId][socket.id]) {
        sessionParticipants[sessionId][socket.id].agoraUid = agoraUid;
      }
      
      // Broadcast this participant's agoraUid to ALL in the room (including the sender)
      io.to(`session:${sessionId}`).emit('participant_agora_uid', {
        agoraUid,
        name,
        role
      });
      console.log(`📢 Broadcasting participant agoraUid to all in session:${sessionId}`);
    });

    socket.on('leave_session', ({ sessionId }) => {
      socket.leave(`session:${sessionId}`);
      // Remove from participants
      if (sessionParticipants[sessionId]) {
        delete sessionParticipants[sessionId][socket.id];
        if (Object.keys(sessionParticipants[sessionId]).length === 0) {
          delete sessionParticipants[sessionId];
        }
      }
      console.log(`🚪 Left room: session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      // Clean up all sessions this socket was in
      Object.keys(sessionParticipants).forEach(sessionId => {
        if (sessionParticipants[sessionId][socket.id]) {
          delete sessionParticipants[sessionId][socket.id];
        }
      });
      console.log('❌ Socket disconnected:', socket.id);
    });
  });
};

module.exports = { initEngagementSocket };