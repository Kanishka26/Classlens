const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { db } = require('../config/firebase');

// GET /student/:studentId/report
router.get('/:studentId/report', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get all engagement records for this student
    const engSnap = await db.collection('engagement')
      .where('studentId', '==', studentId)
      .orderBy('timestamp', 'asc').get();
    
    const records = engSnap.docs.map(d => d.data());
    
    if (records.length === 0) {
      return res.json({
        studentId,
        studentName: 'Unknown',
        totalSessions: 0,
        avgScore: 0,
        peakScore: 0,
        lowScore: 0,
        totalParticipationCount: 0,
        perSession: [],
        timeline: [],
        trend: 'stable',
        performanceRanking: { rank: 'N/A', totalStudents: 0, percentile: 0 },
        recommendations: ['No session data available yet.']
      });
    }
    
    // Group records by session
    const sessionMap = {};
    let studentName = records[0]?.studentName || 'Unknown';
    
    records.forEach(r => {
      if (!sessionMap[r.sessionId]) {
        sessionMap[r.sessionId] = {
          sessionId: r.sessionId,
          scores: [],
          timestamp: r.timestamp
        };
      }
      sessionMap[r.sessionId].scores.push(r.score);
    });
    
    // Fetch session names and calculate per-session metrics
    const perSession = await Promise.all(
      Object.entries(sessionMap).map(async ([sessionId, data]) => {
        let sessionName = 'Meeting';
        try {
          const sessionDoc = await db.collection('sessions').doc(sessionId).get();
          if (sessionDoc.exists) sessionName = sessionDoc.data().name;
        } catch (e) {}
        
        const scores = data.scores;
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        return {
          sessionId,
          sessionName,
          date: data.timestamp,
          avgScore,
          maxScore: Math.max(...scores),
          minScore: Math.min(...scores),
          participationCount: scores.length
        };
      })
    );
    
    perSession.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Overall metrics
    const allScores = records.map(r => r.score);
    const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const peakScore = Math.max(...allScores);
    const lowScore = Math.min(...allScores);
    const totalParticipationCount = allScores.length;
    
    // Timeline analysis - group by time intervals (5 min buckets)
    const timeline = {};
    records.forEach(r => {
      const time = new Date(r.timestamp);
      const bucket = Math.floor(time.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
      const bucketKey = new Date(bucket).toISOString();
      if (!timeline[bucketKey]) timeline[bucketKey] = [];
      timeline[bucketKey].push(r.score);
    });
    
    const timelineData = Object.entries(timeline)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([time, scores]) => ({
        time,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        maxScore: Math.max(...scores),
        recordCount: scores.length
      }));
    
    // Trend analysis - compare first half vs second half
    const midpoint = Math.floor(allScores.length / 2);
    const firstHalf = allScores.slice(0, midpoint);
    const secondHalf = allScores.slice(midpoint);
    
    const firstAvg = firstHalf.length ? Math.round(firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length) : 0;
    const secondAvg = secondHalf.length ? Math.round(secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length) : 0;
    
    let trend = 'stable';
    if (secondAvg > firstAvg + 5) trend = 'improving';
    else if (secondAvg < firstAvg - 5) trend = 'declining';
    
    // Performance ranking - compare with peers
    let performanceRanking = { rank: 'N/A', totalStudents: 0, percentile: 0 };
    
    // Get all students' average scores from all sessions this student attended
    const sessionIds = Object.keys(sessionMap);
    if (sessionIds.length > 0) {
      const allStudentEngSnap = await db.collection('engagement')
        .where('sessionId', 'in', sessionIds.slice(0, 10)) // Firestore 'in' query limit
        .get();
      
      const studentScores = {};
      allStudentEngSnap.docs.forEach(doc => {
        const data = doc.data();
        if (!studentScores[data.studentId]) {
          studentScores[data.studentId] = [];
        }
        studentScores[data.studentId].push(data.score);
      });
      
      const studentAvgs = Object.entries(studentScores)
        .map(([id, scores]) => ({
          studentId: id,
          avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }))
        .sort((a, b) => b.avgScore - a.avgScore);
      
      const rank = studentAvgs.findIndex(s => s.studentId === studentId) + 1;
      const totalStudents = studentAvgs.length;
      const percentile = totalStudents > 0 ? Math.round(((totalStudents - rank + 1) / totalStudents) * 100) : 0;
      
      performanceRanking = { rank, totalStudents, percentile };
    }
    
    // Generate recommendations
    const recommendations = [];
    
    if (avgScore < 50) {
      recommendations.push('Consider additional support - engagement is below 50%');
    } else if (avgScore < 70) {
      recommendations.push('Room for improvement - aim to increase engagement to 70%+');
    } else {
      recommendations.push('Good engagement level - maintain consistent participation');
    }
    
    if (trend === 'declining') {
      recommendations.push('Engagement is declining - check for challenges or distractions');
    } else if (trend === 'improving') {
      recommendations.push('Great progress - engagement is improving!');
    }
    
    if (performanceRanking.percentile && performanceRanking.percentile < 25) {
      recommendations.push('Consider 1-on-1 intervention to identify and address struggles');
    } else if (performanceRanking.percentile && performanceRanking.percentile > 75) {
      recommendations.push('Top performer - celebrate achievements and share feedback with family');
    }
    
    if (perSession.length > 0 && perSession[0].avgScore < avgScore - 10) {
      recommendations.push('Recent session below average - may need follow-up discussion');
    }
    
    res.json({
      studentId,
      studentName,
      totalSessions: perSession.length,
      avgScore,
      peakScore,
      lowScore,
      totalParticipationCount,
      perSession,
      timeline: timelineData,
      trend,
      performanceRanking,
      recommendations
    });
  } catch (err) {
    console.error('❌ [STUDENT] Error generating report:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
