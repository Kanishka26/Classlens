const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// POST /session/create
router.post('/create', verifyToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Session name required' });
  try {
    const session = {
      id: uuidv4(), name,
      channelName: generateRoomCode(),
      teacherId: req.user.uid,
      createdAt: new Date().toISOString(),
      status: 'created'
    };
    await db.collection('sessions').doc(session.id).set(session);
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /session
router.get('/', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('sessions')
      .where('teacherId', '==', req.user.uid)
      .orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => d.data()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /session/join
router.post('/join', verifyToken, async (req, res) => {
  const { code } = req.body;
  try {
    const snap = await db.collection('sessions')
      .where('channelName', '==', code.toUpperCase()).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Session not found' });
    res.json(snap.docs[0].data());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /session/:id/report
router.get('/:id/report', verifyToken, async (req, res) => {
  try {
    const sessionDoc = await db.collection('sessions').doc(req.params.id).get();
    if (!sessionDoc.exists) return res.status(404).json({ error: 'Not found' });
    const session = sessionDoc.data();
    const engSnap = await db.collection('engagement')
      .where('sessionId', '==', req.params.id)
      .orderBy('timestamp', 'asc').get();
    const records = engSnap.docs.map(d => d.data());
    const allScores = records.map(r => r.score);
    const avg = s => Math.round(s.reduce((a, b) => a + b, 0) / s.length);
    res.json({
      sessionName: session.name,
      avgScore: allScores.length ? avg(allScores) : 0,
      peakScore: allScores.length ? Math.max(...allScores) : 0,
      totalRecords: records.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;