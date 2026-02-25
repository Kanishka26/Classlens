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
router.get('/history', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('engagement')
      .where('studentId', '==', req.user.uid).get()

    const records = snap.docs.map(d => d.data())

    // Group by sessionId
    const sessionMap = {}
    records.forEach(r => {
      if (!sessionMap[r.sessionId]) {
        sessionMap[r.sessionId] = {
          sessionId: r.sessionId,
          date: r.timestamp,
          scores: []
        }
      }
      sessionMap[r.sessionId].scores.push(r.score)
      if (r.timestamp < sessionMap[r.sessionId].date) {
        sessionMap[r.sessionId].date = r.timestamp
      }
    })

    // Fetch session names
    const history = await Promise.all(Object.values(sessionMap).map(async (s) => {
      let sessionName = 'Meeting'
      try {
        const sessionDoc = await db.collection('sessions').doc(s.sessionId).get()
        if (sessionDoc.exists) sessionName = sessionDoc.data().name
      } catch (e) {}

      return {
        sessionId: s.sessionId,
        sessionName,
        date: s.date,
        avgScore: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
        peakScore: Math.max(...s.scores),
      }
    }))

    history.sort((a, b) => new Date(b.date) - new Date(a.date))
    res.json({ history })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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