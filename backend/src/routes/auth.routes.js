const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const userRef = db.collection('users').doc();
    const user = { id: userRef.id, email, name, role, createdAt: new Date().toISOString() };
    await userRef.set({ ...user, password: hashed });
    const token = jwt.sign({ uid: user.id, email, name, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return res.status(401).json({ error: 'Invalid credentials' });
    const userData = snapshot.docs[0].data();
    const valid = await bcrypt.compare(password, userData.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const user = { id: userData.id, email: userData.email, name: userData.name, role: userData.role };
    const token = jwt.sign({ uid: user.id, ...user }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;