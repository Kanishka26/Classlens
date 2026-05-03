const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { db } = require('../config/firebase');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role)
    return res.status(400).json({ error: 'All fields required' });
  try {
    // Check if user already exists
    const existingUser = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const userRef = db.collection('users').doc();
    const user = { id: userRef.id, email, name, role, authProvider: 'email', createdAt: new Date().toISOString() };
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
    
    // Only allow email/password login for email-authenticated users
    if (userData.authProvider !== 'email') {
      return res.status(401).json({ error: `Please sign in with ${userData.authProvider}` });
    }
    
    const valid = await bcrypt.compare(password, userData.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const user = { id: userData.id, email: userData.email, name: userData.name, role: userData.role };
    const token = jwt.sign({ uid: user.id, ...user }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/oauth-callback - Handle OAuth token exchange
router.post('/oauth-callback', async (req, res) => {
  const { code, provider, redirectUri } = req.body;

  try {
    if (!code || !provider) {
      return res.status(400).json({ error: 'Missing code or provider' });
    }

    let oauthUser = null;

    // Exchange code for token and get user info
    if (provider === 'google') {
      oauthUser = await exchangeGoogleCode(code, redirectUri);
    } else if (provider === 'microsoft') {
      oauthUser = await exchangeMicrosoftCode(code, redirectUri);
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    if (!oauthUser) {
      return res.status(401).json({ error: 'Failed to authenticate with provider' });
    }

    // Check if user exists
    let snapshot = await db.collection('users').where('email', '==', oauthUser.email).limit(1).get();
    let userData, isNewUser = false;

    if (snapshot.empty) {
      // Create new user
      const userRef = db.collection('users').doc();
      isNewUser = true;
      userData = {
        id: userRef.id,
        email: oauthUser.email,
        name: oauthUser.name,
        role: 'student', // Default role for OAuth users
        authProvider: provider,
        oauthId: oauthUser.id,
        photoUrl: oauthUser.photoUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await userRef.set(userData);
    } else {
      userData = snapshot.docs[0].data();
      
      // Update OAuth info if not already set
      if (!userData.oauthId) {
        await db.collection('users').doc(userData.id).update({
          authProvider: provider,
          oauthId: oauthUser.id,
          photoUrl: oauthUser.photoUrl || null,
          updatedAt: new Date().toISOString()
        });
      }
    }

    const user = { id: userData.id, email: userData.email, name: userData.name, role: userData.role };
    const token = jwt.sign({ uid: user.id, ...user }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user, isNewUser });
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Exchange Google auth code for user info
async function exchangeGoogleCode(code, redirectUri) {
  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      id: userResponse.data.id,
      email: userResponse.data.email,
      name: userResponse.data.name,
      photoUrl: userResponse.data.picture
    };
  } catch (err) {
    console.error('Google OAuth error:', err);
    return null;
  }
}

// Helper: Exchange Microsoft auth code for user info
async function exchangeMicrosoftCode(code, redirectUri) {
  try {
    const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: 'openid email profile'
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      id: userResponse.data.id,
      email: userResponse.data.userPrincipalName,
      name: userResponse.data.displayName,
      photoUrl: null
    };
  } catch (err) {
    console.error('Microsoft OAuth error:', err);
    return null;
  }
}

module.exports = router;