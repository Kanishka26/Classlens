const initEngagementSocket = (io) => {
  // Store participants per session: { [sessionId]: { [socketId]: { agoraUid, name, role } } }
  const sessionParticipants = {};
  
  // Store waiting room participants: { [sessionId]: { [socketId]: { userId, name, role, isMicOn, isCameraOn } } }
  const waitingParticipants = {};

  io.on('connection', (socket) => {
    console.log('🔗 Socket connected:', socket.id);

    // Request to join session - adds participant to waiting room
    socket.on('request_join_session', ({ sessionId, userId, role, name, isMicOn, isCameraOn }) => {
      socket.join(`session:${sessionId}`);
      console.log(`⏳ [WAITING ROOM] ${name} (${role}) requested to join session:${sessionId}`);
      
      // Initialize waiting room if it doesn't exist
      if (!waitingParticipants[sessionId]) {
        waitingParticipants[sessionId] = {};
      }
      
      // Add to waiting room
      waitingParticipants[sessionId][socket.id] = {
        userId,
        name,
        role,
        isMicOn,
        isCameraOn,
        socketId: socket.id,
        timestamp: Date.now()
      };
      
      // Store socketId temporarily for later reference
      socket.sessionId = sessionId;
      socket.userId = userId;
      
      // Notify all teachers in this session about waiting participants
      const waitingList = Object.values(waitingParticipants[sessionId] || {});
      io.to(`session:${sessionId}`).emit('waiting_participants_update', { 
        waitingParticipants: waitingList 
      });
      console.log(`📢 Notified teachers of ${waitingList.length} waiting participant(s) in session:${sessionId}`);
    });

    // Teacher admits a participant from waiting room
    socket.on('admit_participant', ({ sessionId, socketId }) => {
      console.log(`✅ [ADMIT] Teacher admitted participant (socketId: ${socketId}) to session:${sessionId}`);
      
      if (waitingParticipants[sessionId]?.[socketId]) {
        const participant = waitingParticipants[sessionId][socketId];
        
        // Remove from waiting room
        delete waitingParticipants[sessionId][socketId];
        
        // Initialize session participants if needed
        if (!sessionParticipants[sessionId]) {
          sessionParticipants[sessionId] = {};
        }
        
        // Add to active participants
        sessionParticipants[sessionId][socketId] = {
          userId: participant.userId,
          name: participant.name,
          role: participant.role,
          agoraUid: null
        };
        
        // Notify the admitted participant
        io.to(`session:${sessionId}`).emit('participant_admitted', {
          socketId,
          name: participant.name
        });
        
        // Update waiting list for remaining teachers
        const remainingWaiting = Object.values(waitingParticipants[sessionId] || {});
        io.to(`session:${sessionId}`).emit('waiting_participants_update', { 
          waitingParticipants: remainingWaiting 
        });
        console.log(`📢 Updated waiting list: ${remainingWaiting.length} participant(s) waiting`);
      }
    });

    // Teacher denies a participant from waiting room
    socket.on('deny_participant', ({ sessionId, socketId }) => {
      console.log(`❌ [DENY] Teacher denied participant (socketId: ${socketId}) from session:${sessionId}`);
      
      if (waitingParticipants[sessionId]?.[socketId]) {
        const participant = waitingParticipants[sessionId][socketId];
        
        // Remove from waiting room
        delete waitingParticipants[sessionId][socketId];
        
        // Notify the denied participant
        io.to(socketId).emit('participant_denied', {
          reason: 'You were not admitted to this meeting'
        });
        
        // Update waiting list for teachers
        const remainingWaiting = Object.values(waitingParticipants[sessionId] || {});
        io.to(`session:${sessionId}`).emit('waiting_participants_update', { 
          waitingParticipants: remainingWaiting 
        });
        console.log(`📢 Updated waiting list: ${remainingWaiting.length} participant(s) waiting`);
      }
    });

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
      
      // If this is a teacher, send them the current waiting participants list
      if (role === 'teacher') {
        const waitingList = Object.values(waitingParticipants[sessionId] || {});
        socket.emit('waiting_participants_update', { 
          waitingParticipants: waitingList 
        });
        console.log(`📤 Sent ${waitingList.length} waiting participant(s) to teacher in session:${sessionId}`);
      }
      
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

    socket.on('screen_share_started', ({ sessionId, agoraUid }) => {
      console.log(`📺 [SCREEN SHARE STARTED] sessionId: ${sessionId}, agoraUid: ${agoraUid}`);
      
      if (!sessionId || !agoraUid) {
        console.error('❌ [SCREEN SHARE] Missing sessionId or agoraUid');
        return;
      }
      
      // Broadcast to all participants in the session
      console.log(`📢 [SCREEN SHARE] Broadcasting to session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('screen_share_started', {
        agoraUid
      });
      
      console.log(`✅ [SCREEN SHARE] Started notification emitted to session:${sessionId}`);
    });

    socket.on('screen_share_stopped', ({ sessionId, agoraUid }) => {
      console.log(`📺 [SCREEN SHARE STOPPED] sessionId: ${sessionId}, agoraUid: ${agoraUid}`);
      
      if (!sessionId || !agoraUid) {
        console.error('❌ [SCREEN SHARE] Missing sessionId or agoraUid');
        return;
      }
      
      // Broadcast to all participants in the session
      console.log(`📢 [SCREEN SHARE] Broadcasting to session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('screen_share_stopped', {
        agoraUid
      });
      
      console.log(`✅ [SCREEN SHARE] Stopped notification emitted to session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnecting:', socket.id);
      
      // Clean up from waiting room if present
      if (socket.sessionId && waitingParticipants[socket.sessionId]?.[socket.id]) {
        delete waitingParticipants[socket.sessionId][socket.id];
        console.log(`🗑️ Removed ${socket.id} from waiting room of session:${socket.sessionId}`);
        
        // Update waiting list
        const remainingWaiting = Object.values(waitingParticipants[socket.sessionId] || {});
        io.to(`session:${socket.sessionId}`).emit('waiting_participants_update', { 
          waitingParticipants: remainingWaiting 
        });
      }
      
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