const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, admin } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth.middleware');

// Middleware: Verify token for all routes
router.use(verifyToken);

// GET /user/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const { password, ...userWithoutPassword } = userData;
    
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('❌ [USER] Get profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /user/profile - Update profile (name, email, profilePicture)
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, email, profilePicture } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (profilePicture) updateData.profilePicture = profilePicture;
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection('users').doc(userId).update(updateData);
    
    // Return updated user data
    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedData = updatedDoc.data();
    const { password, ...userWithoutPassword } = updatedData;
    
    console.log(`✅ [USER] Profile updated for: ${email || name}`);
    res.json({ message: 'Profile updated successfully', user: userWithoutPassword });
  } catch (err) {
    console.error('❌ [USER] Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /user/change-password - Change password
router.post('/change-password', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Get user from database
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Check if user has a password set
    if (!userData.password) {
      return res.status(400).json({ error: 'This account does not have a password set. Please reset your password first.' });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await db.collection('users').doc(userId).update({
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ [USER] Password changed for: ${userData.email}`);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ [USER] Change password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /user/notifications - Update notification preferences
router.put('/notifications', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { engagementAlerts, classroomUpdates, reportNotifications, emailNotifications } = req.body;
    
    const notificationPreferences = {
      engagementAlerts: engagementAlerts ?? true,
      classroomUpdates: classroomUpdates ?? true,
      reportNotifications: reportNotifications ?? true,
      emailNotifications: emailNotifications ?? true,
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('users').doc(userId).update({
      notificationPreferences,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ [USER] Notification preferences updated for: ${userId}`);
    res.json({ message: 'Notification preferences updated successfully', preferences: notificationPreferences });
  } catch (err) {
    console.error('❌ [USER] Update notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /user/account - Delete user account
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }
    
    // Get user from database
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Check if user has a password set
    if (!userData.password) {
      return res.status(400).json({ error: 'Cannot delete account: password not found. Please contact support.' });
    }
    
    // Verify password for security
    const isValid = await bcrypt.compare(password, userData.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }
    
    // Get user email before deletion for logging
    const userEmail = userData.email;
    
    // Delete profile picture from Firebase Storage if exists
    if (userData.profilePicture) {
      try {
        const bucket = admin.storage().bucket();
        const fileName = userData.profilePicture.split('/').pop().split('?')[0];
        await bucket.file(`profile-pictures/${fileName}`).delete();
      } catch (storageErr) {
        console.warn(`⚠️ [USER] Could not delete profile picture from storage:`, storageErr.message);
        // Continue with account deletion even if picture deletion fails
      }
    }
    
    // Delete all user's classrooms where they are the only teacher
    const classroomsSnap = await db.collection('classrooms')
      .where('createdBy', '==', userId)
      .get();
    
    for (const classDoc of classroomsSnap.docs) {
      await db.collection('classrooms').doc(classDoc.id).delete();
    }
    
    // Delete all user sessions
    const sessionsSnap = await db.collection('sessions')
      .where('userId', '==', userId)
      .get();
    
    for (const sessionDoc of sessionsSnap.docs) {
      await db.collection('sessions').doc(sessionDoc.id).delete();
    }
    
    // Delete user document
    await db.collection('users').doc(userId).delete();
    
    console.log(`✅ [USER] Account deleted for: ${userEmail}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('❌ [USER] Delete account error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
