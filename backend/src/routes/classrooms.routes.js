const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { db } = require('../config/firebase');

// GET /classrooms - Get classrooms based on user role
// Teachers: Get their own classrooms
// Students: Get all available classrooms to join
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log(`🔍 [CLASSROOM] Fetching classrooms for ${req.user.role}:`, req.user.uid);
    let snap;
    
    if (req.user.role === 'teacher') {
      // Teachers see only their own classrooms
      try {
        snap = await db.collection('classrooms')
          .where('teacherId', '==', req.user.uid)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (indexErr) {
        console.log('⚠️ [CLASSROOM] Index missing, fetching without order:', indexErr.message);
        snap = await db.collection('classrooms')
          .where('teacherId', '==', req.user.uid)
          .get();
      }
    } else {
      // Students see all available classrooms
      try {
        snap = await db.collection('classrooms')
          .orderBy('createdAt', 'desc')
          .get();
      } catch (indexErr) {
        console.log('⚠️ [CLASSROOM] Index missing, fetching all classrooms without order:', indexErr.message);
        snap = await db.collection('classrooms').get();
      }
    }
    
    const classrooms = snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📦 [CLASSROOM] Found ${classrooms.length} classrooms for ${req.user.role}`);
    res.json({ success: true, data: classrooms });
  } catch (err) {
    console.error('❌ [CLASSROOM] Error fetching classrooms:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /classrooms - Create new classroom (TEACHERS ONLY)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create classrooms' });
    }

    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Classroom name is required' });
    }

    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-pink-600', 'bg-indigo-600'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const classroom = {
      name: name.trim(),
      description: description?.trim() || '',
      teacherId: req.user.uid,
      teacherName: req.user.name,
      students: [],
      sessions: 0,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('📝 [CLASSROOM] Saving to Firebase:', classroom);
    const docRef = await db.collection('classrooms').add(classroom);
    
    const responseData = { id: docRef.id, ...classroom };
    console.log(`✅ [CLASSROOM] Created classroom: ${name} (${docRef.id})`);
    console.log('📦 [CLASSROOM] Sending response:', responseData);
    
    res.json({ 
      success: true, 
      data: responseData
    });
  } catch (err) {
    console.error('❌ Error creating classroom:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /classrooms/enrolled/all - Get classrooms the student is enrolled in (STUDENTS ONLY)
// IMPORTANT: This must come BEFORE the generic /:id route!
router.get('/enrolled/all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can view enrolled classrooms' });
    }

    console.log(`🔍 [CLASSROOM] Fetching enrolled classrooms for student:`, req.user.uid);
    
    let snap;
    try {
      snap = await db.collection('classrooms')
        .where('students', 'array-contains', req.user.uid)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexErr) {
      console.log('⚠️ [CLASSROOM] Index missing, fetching without order:', indexErr.message);
      snap = await db.collection('classrooms')
        .where('students', 'array-contains', req.user.uid)
        .get();
    }

    const classrooms = snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`📦 [CLASSROOM] Found ${classrooms.length} enrolled classrooms`);
    res.json({ success: true, data: classrooms });
  } catch (err) {
    console.error('❌ [CLASSROOM] Error fetching enrolled classrooms:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /classrooms/:id/join - Join a classroom with invite code (STUDENTS ONLY)
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can join classrooms' });
    }

    const { inviteCode } = req.body;
    const classroomId = req.params.id;

    const doc = await db.collection('classrooms').doc(classroomId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const classroom = doc.data();

    // Verify invite code (simple: just the classroom ID)
    if (inviteCode !== classroomId) {
      return res.status(403).json({ error: 'Invalid invite code' });
    }

    // Check if already enrolled
    if (classroom.students?.includes(req.user.uid)) {
      return res.status(400).json({ error: 'Already enrolled in this classroom' });
    }

    // Add student to classroom
    const updatedStudents = [...(classroom.students || []), req.user.uid];
    
    await db.collection('classrooms').doc(classroomId).update({
      students: updatedStudents,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ [CLASSROOM] Student ${req.user.uid} joined classroom: ${classroomId}`);
    
    res.json({ 
      success: true, 
      message: 'Successfully joined classroom',
      data: { 
        id: classroomId, 
        ...classroom, 
        students: updatedStudents 
      }
    });
  } catch (err) {
    console.error('❌ [CLASSROOM] Error joining classroom:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /classrooms/:id/leave - Leave a classroom (STUDENTS ONLY)
router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can leave classrooms' });
    }

    const classroomId = req.params.id;
    const doc = await db.collection('classrooms').doc(classroomId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const classroom = doc.data();

    // Check if enrolled
    if (!classroom.students?.includes(req.user.uid)) {
      return res.status(400).json({ error: 'Not enrolled in this classroom' });
    }

    // Remove student from classroom
    const updatedStudents = classroom.students.filter(id => id !== req.user.uid);
    
    await db.collection('classrooms').doc(classroomId).update({
      students: updatedStudents,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ [CLASSROOM] Student ${req.user.uid} left classroom: ${classroomId}`);
    
    res.json({ 
      success: true, 
      message: 'Successfully left classroom'
    });
  } catch (err) {
    console.error('❌ [CLASSROOM] Error leaving classroom:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /classrooms/:id - Get single classroom (GENERIC - must come after specific routes)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('classrooms').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const classroom = doc.data();

    // Verify ownership
    if (classroom.teacherId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to view this classroom' });
    }

    res.json({ success: true, data: { id: doc.id, ...classroom } });
  } catch (err) {
    console.error('❌ Error fetching classroom:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /classrooms/:id - Update classroom (TEACHER ONLY)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update classrooms' });
    }

    const { name, description } = req.body;
    const doc = await db.collection('classrooms').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const classroom = doc.data();

    // Verify ownership
    if (classroom.teacherId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this classroom' });
    }

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    await db.collection('classrooms').doc(req.params.id).update(updates);
    
    console.log(`✅ Updated classroom: ${req.params.id}`);
    res.json({ success: true, data: { id: req.params.id, ...classroom, ...updates } });
  } catch (err) {
    console.error('❌ Error updating classroom:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /classrooms/:id - Delete classroom (TEACHER ONLY)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete classrooms' });
    }

    const doc = await db.collection('classrooms').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const classroom = doc.data();

    // Verify ownership
    if (classroom.teacherId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this classroom' });
    }

    await db.collection('classrooms').doc(req.params.id).delete();
    
    console.log(`✅ Deleted classroom: ${req.params.id}`);
    res.json({ success: true, message: 'Classroom deleted' });
  } catch (err) {
    console.error('❌ Error deleting classroom:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
