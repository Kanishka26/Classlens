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
// GET /session/students/report
router.get('/students/report', verifyToken, async (req, res) => {
  try {
    const studentsSnap = await db.collection('users')
      .where('role', '==', 'student').get()

    const students = studentsSnap.docs.map(d => d.data())

    const reports = await Promise.all(students.map(async (student) => {
      const engSnap = await db.collection('engagement')
        .where('studentId', '==', student.id).get()

      const records = engSnap.docs.map(d => d.data())
      const scores = records.map(r => r.score)
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const peak = scores.length ? Math.max(...scores) : 0

      // Get unique session IDs
      const sessionIds = [...new Set(records.map(r => r.sessionId))]

      // Fetch session names
      const sessionDocs = await Promise.all(
        sessionIds.map(id => db.collection('sessions').doc(id).get())
      )
      const sessionNames = sessionDocs
        .filter(d => d.exists)
        .map(d => d.data().name)

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        avgScore: avg,
        peakScore: peak,
        totalSessions: sessionIds.length,
        sessions: sessionNames,
        status: avg >= 75 ? 'Focused' : avg >= 50 ? 'Neutral' : 'At Risk'
      }
    }))

    res.json({ students: reports })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// GET /session/report/sessions
router.get('/report/sessions', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('sessions')
      .where('teacherId', '==', req.user.uid).get()
    
    const sessions = await Promise.all(snap.docs.map(async (doc) => {
      const session = doc.data()
      const engSnap = await db.collection('engagement')
        .where('sessionId', '==', session.id).get()
      
      const records = engSnap.docs.map(d => d.data())
      const scores = records.map(r => r.score)
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const peak = scores.length ? Math.max(...scores) : 0
      const students = [...new Set(records.map(r => r.studentId))].length

      return {
        id: session.id,
        name: session.name,
        channelName: session.channelName,
        createdAt: session.createdAt,
        avgScore: avg,
        peakScore: peak,
        totalStudents: students,
        totalRecords: records.length,
        status: avg >= 75 ? 'High' : avg >= 50 ? 'Medium' : records.length === 0 ? 'No Data' : 'Low'
      }
    }))

    res.json({ sessions })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /session/report/weekly
router.get('/report/weekly', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('sessions')
      .where('teacherId', '==', req.user.uid).get()
    
    const sessions = snap.docs.map(d => d.data())
    
    // Group sessions by week
    const weekMap = {}
    await Promise.all(sessions.map(async (session) => {
      const engSnap = await db.collection('engagement')
        .where('sessionId', '==', session.id).get()
      
      const records = engSnap.docs.map(d => d.data())
      const scores = records.map(r => r.score)
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

      const date = new Date(session.createdAt)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { weekKey, weekLabel, sessions: 0, totalScore: 0, students: new Set() }
      }
      weekMap[weekKey].sessions++
      weekMap[weekKey].totalScore += avg
      records.forEach(r => weekMap[weekKey].students.add(r.studentId))
    }))

    const weeks = Object.values(weekMap)
      .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
      .map(w => ({
        weekLabel: w.weekLabel,
        sessions: w.sessions,
        avgScore: w.sessions ? Math.round(w.totalScore / w.sessions) : 0,
        totalStudents: w.students.size
      }))

    res.json({ weeks })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

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