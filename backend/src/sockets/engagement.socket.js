const initEngagementSocket = (io) => {
  // Store participants per session: { [sessionId]: { [socketId]: { agoraUid, name, role } } }
  const sessionParticipants = {};

  io.on('connection', (socket) => {
    console.log('🔗 Socket connected:', socket.id);

    socket.on('join_session', ({ sessionId, userId, role, name }) => {
      socket.join(`session:${sessionId}`);
      console.log(`✅ [${role?.toUpperCase()}] joined room: session:${sessionId} (socket: ${socket.id}, userId: ${userId}), name: ${name}`);
      
      // Initialize session if it doesn't exist
      if (!sessionParticipants[sessionId]) {
        sessionParticipants[sessionId] = {};
      }
      
      // DEDUPLICATION: Remove any existing entries with the same userId (handles page reloads with new socket/agoraUid)
      Object.keys(sessionParticipants[sessionId]).forEach(existingSocketId => {
        const existingParticipant = sessionParticipants[sessionId][existingSocketId];
        if (existingParticipant.userId === userId && existingSocketId !== socket.id) {
          console.log(`🗑️ Removing stale connection for userId: ${userId} (${name}) - old socket: ${existingSocketId}, new socket: ${socket.id}`);
          delete sessionParticipants[sessionId][existingSocketId];
        }
      });
      
      // Store initial participant info with userId
      sessionParticipants[sessionId][socket.id] = { userId, name, role, agoraUid: null };
      
      // Send existing participants to the new joiner
      const existingParticipants = Object.values(sessionParticipants[sessionId])
        .filter(p => p.agoraUid) // Only send those who have sent their agoraUid
        .map(p => ({ agoraUid: p.agoraUid, name: p.name, role: p.role }));
      
      console.log(`📤 Sending ${existingParticipants.length} existing participants to new joiner`);
      socket.emit('existing_participants', { participants: existingParticipants });
    });

    socket.on('send_agora_uid', ({ sessionId, agoraUid, name, role, userId }) => {
      console.log(`📤 Received agoraUid from [${role}]:`, { agoraUid, userId, name, socketId: socket.id });
      
      // Remove any stale entries with the same userId (handles reload with new agoraUid)
      if (sessionParticipants[sessionId]) {
        Object.keys(sessionParticipants[sessionId]).forEach(socketId => {
          const participant = sessionParticipants[sessionId][socketId];
          if (participant.userId === userId && socketId !== socket.id) {
            console.log(`🗑️ Removing stale entry for userId ${userId} (old socket: ${socketId}, new socket: ${socket.id})`);
            delete sessionParticipants[sessionId][socketId];
          }
        });
      }
      
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
      // Get participant info before deleting (so we can notify others)
      const participant = sessionParticipants[sessionId]?.[socket.id];
      const agoraUid = participant?.agoraUid;
      const name = participant?.name;
      const role = participant?.role;
      
      console.log(`🚪 User leaving session:${sessionId}`, { name, role, agoraUid, socketId: socket.id });
      
      socket.leave(`session:${sessionId}`);
      
      // Remove from participants
      if (sessionParticipants[sessionId]) {
        delete sessionParticipants[sessionId][socket.id];
        if (Object.keys(sessionParticipants[sessionId]).length === 0) {
          delete sessionParticipants[sessionId];
        }
      }
      
      // Notify others that this participant left (only if they had agoraUid)
      if (agoraUid) {
        io.to(`session:${sessionId}`).emit('participant_left', { agoraUid, name });
        console.log(`📢 Broadcast participant_left: ${name} (agoraUid: ${agoraUid}) left session:${sessionId}`);
      } else {
        console.log(`⚠️ No agoraUid for leaving user ${name} - likely left before video started`);
      }
    });

    socket.on('send_chat', ({ sessionId, senderName, message, timestamp }) => {
      console.log(`💬 [CHAT RECEIVED] sessionId: ${sessionId}, sender: ${senderName}, message: "${message}"`);
      
      if (!sessionId) {
        console.error('❌ [CHAT] Missing sessionId');
        return;
      }
      
      // Broadcast message to all participants in the session
      console.log(`📢 [CHAT BROADCAST] Broadcasting to session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('chat_message', {
        senderName,
        message,
        timestamp
      });
      
      console.log(`✅ [CHAT] Message emitted to session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnecting:', socket.id);
      
      // Clean up all sessions this socket was in and notify others
      Object.keys(sessionParticipants).forEach(sessionId => {
        const participant = sessionParticipants[sessionId]?.[socket.id];
        if (participant) {
          const agoraUid = participant.agoraUid;
          const name = participant.name;
          const role = participant.role;
          
          console.log(`🚪 Cleaning up on disconnect: ${name} (${role}) from session:${sessionId}`);
          
          delete sessionParticipants[sessionId][socket.id];
          
          // Notify remaining participants that this user disconnected (only if they had agoraUid)
          if (agoraUid) {
            io.to(`session:${sessionId}`).emit('participant_left', { agoraUid, name });
            console.log(`📢 Broadcast participant_left on disconnect: ${name} (agoraUid: ${agoraUid}) from session:${sessionId}`);
          }
        }
      });
      console.log('❌ Socket disconnected:', socket.id);
    });
  });
};

module.exports = { initEngagementSocket };