const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { db } = require('../config/firebase');

// POST /engagement
router.post('/', verifyToken, async (req, res) => {
  const { sessionId, score, agoraUid, details } = req.body;
  if (!sessionId || score === undefined)
    return res.status(400).json({ error: 'sessionId and score required' });
  try {
    const record = {
      sessionId, score,
      studentId: req.user.uid,
      studentName: req.user.name,
      agoraUid: agoraUid || null,
      details: details || {},
      timestamp: new Date().toISOString()
    };
    await db.collection('engagement').add(record);

    // Broadcast to teacher with agoraUid so teacher can match to video tile
    const io = req.app.get('io');
    console.log(`📡 [BACKEND] Broadcasting to room: session:${sessionId}`, { agoraUid, studentName: req.user.name, score })
    io.to(`session:${sessionId}`).emit('engagement_update', {
      studentId: req.user.uid,
      agoraUid: agoraUid,
      studentName: req.user.name,
      score,
      timestamp: record.timestamp
    });
    console.log(`✅ [BACKEND] Engagement recorded and broadcast`)
    res.json({ success: true });
  } catch (err) { 
    console.error(`❌ [BACKEND] Error posting engagement:`, err)
    res.status(500).json({ error: err.message }); 
  }
});

// GET /engagement/:sessionId
router.get('/:sessionId', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('engagement')
      .where('sessionId', '==', req.params.sessionId)
      .orderBy('timestamp', 'asc').get();
    res.json({ data: snap.docs.map(d => d.data()) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;