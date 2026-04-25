import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { BookOpen, Users, Video, TrendingUp, Plus, Play, BarChart2, FileText, Radio, Clock, Award,X } from 'lucide-react'


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className={`w-full mb-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
        copied
          ? 'bg-green-600/20 border-green-500 text-green-400'
          : 'border-[#2d3155] hover:border-indigo-500 text-slate-300 hover:text-white'
      }`}>
      {copied ? '✓ Copied!' : 'Copy Code'}
    </button>
  )
}
export default function DashboardPage() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [enrolledClassrooms, setEnrolledClassrooms] = useState([])
  const [teacherClassrooms, setTeacherClassrooms] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [meetingCode, setMeetingCode] = useState(null)
  const [pendingMeetingId, setPendingMeetingId] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joiningClass, setJoiningClass] = useState(null)

  // Calculate average engagement from classrooms
  const calculateAvgEngagement = (classrooms) => {
    if (classrooms.length === 0) return 0
    const total = classrooms.reduce((sum, cls) => sum + cls.engagement, 0)
    return Math.round(total / classrooms.length)
  }

  // Calculate classes attended (completed sessions)
  const calculateClassesAttended = (classrooms) => {
    return classrooms.filter(cls => cls.status === 'completed').length
  }

  // Fetch all sessions for stats (teacher only)
  const fetchSessionsForStats = async () => {
    try {
      const token = localStorage.getItem('classlens_token')
      const res = await fetch(`${BACKEND_URL}/session/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAllSessions(data.data || [])
      }
    } catch (err) {
      console.error('❌ Error fetching sessions for stats:', err)
    }
  }

  // Calculate sessions held (completed sessions)
  const calculateSessionsHeld = () => {
    return allSessions.filter(session => {
      const endTime = new Date(session.endedAt)
      return session.endedAt && !isNaN(endTime.getTime())
    }).length
  }

  // Fetch classroom enrollment data to get total student count
  const fetchTotalStudents = async () => {
    try {
      const token = localStorage.getItem('classlens_token')
      const res = await fetch(`${BACKEND_URL}/classrooms/students/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTotalStudents(data.totalStudents || 0)
      }
    } catch (err) {
      // Fallback: try to estimate from classroom data if endpoint doesn't exist
      console.warn('⚠️ Could not fetch total students count:', err.message)
      setTotalStudents(0)
    }
  }

  // Fetch classrooms based on user role
  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchTeacherClassrooms()
      fetchSessionsForStats()
      fetchTotalStudents()
    } else if (user?.role === 'student') {
      fetchEnrolledClassrooms()
      // Poll for classroom status updates every 30 seconds (reduced to save Firestore quota)
      const pollInterval = setInterval(() => {
        fetchEnrolledClassrooms()
      }, 30000)
      return () => clearInterval(pollInterval)
    }
  }, [user])

  const fetchTeacherClassrooms = async () => {
    try {
      const token = localStorage.getItem('classlens_token')
      const res = await fetch(`${BACKEND_URL}/classrooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        const { data: classrooms } = data
        console.log('📚 Teacher classrooms:', classrooms)
        
        const formattedClasses = classrooms.map(cls => ({
          id: cls.id,
          sessionId: null,
          name: cls.name,
          teacher: user?.name,
          color: cls.color || 'bg-indigo-600',
          status: 'upcoming',
          engagement: Math.floor(Math.random() * 30 + 70)
        }))
        
        setTeacherClassrooms(formattedClasses)
      } else {
        console.error('❌ Failed to fetch teacher classrooms:', res.status)
      }
    } catch (err) {
      console.error('❌ Error fetching teacher classrooms:', err)
    }
  }

  const fetchEnrolledClassrooms = async () => {
    try {
      const token = localStorage.getItem('classlens_token')
      
      // Fetch both classrooms and sessions in parallel
      const [classroomsRes, sessionsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/classrooms/enrolled/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_URL}/session/active/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      console.log('📊 Classrooms response:', classroomsRes.status, classroomsRes.ok)
      console.log('📊 Sessions response:', sessionsRes.status, sessionsRes.ok)

      if (classroomsRes.ok && sessionsRes.ok) {
        const classroomsData = await classroomsRes.json()
        const sessionsData = await sessionsRes.json()
        
        const { data: classrooms } = classroomsData
        const { data: sessions } = sessionsData
        
        console.log('📚 Enrolled classrooms:', classrooms)
        console.log('🎬 Active sessions:', sessions)
        
        // Create a map of classroom ID to active session for quick lookup
        const activeSessionsByClassroom = {}
        sessions.forEach(session => {
          const classroomId = session.classroomId
          // Only count sessions created in the last 2 hours as "active"
          const createdTime = new Date(session.createdAt).getTime()
          const now = new Date().getTime()
          if (now - createdTime < 2 * 60 * 60 * 1000) {
            if (!activeSessionsByClassroom[classroomId]) {
              activeSessionsByClassroom[classroomId] = session
              console.log(`✅ Active session for classroom ${classroomId}:`, session.id)
            } else {
              console.warn(`⚠️ Multiple active sessions for classroom ${classroomId}, keeping first one`)
            }
          }
        })
        
        console.log('🔍 Active sessions by classroom:', activeSessionsByClassroom)
        
        // Convert to dashboard format
        const formattedClasses = classrooms.map(cls => {
          // Check if this classroom has an active session
          const activeSession = activeSessionsByClassroom[cls.id] || null
          const hasActiveSession = activeSession !== null
          
          return {
            id: cls.id,
            sessionId: activeSession?.id || null, // Session ID for joining
            name: cls.name,
            teacher: cls.teacherName,
            color: cls.color,
            status: hasActiveSession ? 'live' : 'upcoming',
            engagement: Math.floor(Math.random() * 30 + 70),
            nextClass: 'TBD'
          }
        })
        
        console.log('✅ Formatted classrooms:', formattedClasses)
        setEnrolledClassrooms(formattedClasses)
      } else {
        console.error('❌ Failed to fetch:', {
          classrooms: classroomsRes.status,
          sessions: sessionsRes.status
        })
        // Still try to show classrooms even if sessions fetch fails
        if (classroomsRes.ok) {
          const classroomsData = await classroomsRes.json()
          const { data: classrooms } = classroomsData
          const formattedClasses = classrooms.map(cls => ({
            id: cls.id,
            sessionId: null,
            name: cls.name,
            teacher: cls.teacherName,
            color: cls.color,
            status: 'upcoming',
            engagement: Math.floor(Math.random() * 30 + 70),
            nextClass: 'TBD'
          }))
          setEnrolledClassrooms(formattedClasses)
        }
      }
    } catch (err) {
      console.error('❌ Error fetching enrolled classrooms:', err)
    }
  }

  const getEngagementColor = (score) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getEngagementBg = (score) => {
    if (score >= 75) return 'bg-green-600/20'
    if (score >= 50) return 'bg-yellow-600/20'
    return 'bg-red-600/20'
  }

  const handleStartInstantMeeting = async () => {
    try {
      const token = localStorage.getItem('classlens_token')
      console.log('🚀 Starting instant meeting...')
      const res = await fetch(`${BACKEND_URL}/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${user?.name}'s Instant Meeting`
        })
      })
      
      if (!res.ok) {
        console.error('❌ Failed to create instant meeting:', res.status, res.statusText)
        alert('Failed to create meeting: ' + res.status + ' ' + res.statusText)
        return
      }
      
      const data = await res.json()
      console.log('✅ Instant meeting created:', data)
      
      if (data.id) {
        setMeetingCode(data.channelName)
        setPendingMeetingId(data.id)
      } else {
        console.error('❌ No session ID in response:', data)
        alert('Failed to create meeting. No ID returned.')
      }
    } catch (err) {
      console.error('Failed to start meeting:', err)
      alert('Error starting meeting: ' + err.message)
    }
  }

const handleJoinMeeting = async () => {
  if (!joinCode.trim()) return
  try {
    const token = localStorage.getItem('classlens_token')
    console.log('🔗 Joining meeting with code:', joinCode.trim().toUpperCase())
    const res = await fetch(`${BACKEND_URL}/session/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code: joinCode.trim().toUpperCase() })
    })
    const data = await res.json()
    console.log('📦 Join response:', data)
    if (data.id) {
      setShowJoinModal(false)
      navigate(`/meet/${data.id}`)
    } else {
      alert('Meeting not found! Check the code and try again.')
    }
  } catch (err) {
    console.error('Failed to join meeting:', err)
    alert('Error joining meeting: ' + err.message)
  }
}

const handleJoinClass = async (cls) => {
  if (cls.status === 'completed') return
  
  setJoiningClass(cls.id)
  try {
    const token = localStorage.getItem('classlens_token')
    
    // Teachers can create new sessions
    if (user?.role === 'teacher') {
      console.log('📝 Creating new session for:', cls.name)
      const res = await fetch(`${BACKEND_URL}/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: cls.name, classroomId: cls.id })
      })
      
      if (!res.ok) {
        console.error('❌ Failed to create session:', res.status, res.statusText)
        alert('Failed to create session: ' + res.status + ' ' + res.statusText)
        setJoiningClass(null)
        return
      }
      
      const data = await res.json()
      console.log('✅ Session created:', data)
      
      if (data.id) {
        console.log('🚀 Navigating to meeting:', data.id)
        navigate(`/meet/${data.id}`)
      } else {
        console.error('❌ No session ID in response:', data)
        alert('Failed to create session. No ID returned.')
        setJoiningClass(null)
      }
    } else {
      // Students: join existing session, or find/create one
      if (cls.sessionId) {
        console.log('✅ Joining existing session:', cls.sessionId)
        navigate(`/meet/${cls.sessionId}`)
      } else {
        // Fresh real-time check for an active session (polling may be stale)
        console.log('🔍 Checking for active session for classroom:', cls.id)
        try {
          const checkRes = await fetch(`${BACKEND_URL}/session/active/classroom/${cls.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (checkRes.ok) {
            const checkData = await checkRes.json()
            if (checkData.found && checkData.session?.id) {
              console.log('✅ Found active session via fresh check:', checkData.session.id)
              navigate(`/meet/${checkData.session.id}`)
              return
            }
          }
        } catch (e) {
          console.warn('⚠️ Fresh session check failed, will create new:', e.message)
        }

        // No active session found — create one (backend will also double-check)
        console.log('📝 No active session found — creating one...')
        const res = await fetch(`${BACKEND_URL}/session/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: cls.name, classroomId: cls.id })
        })
        
        if (!res.ok) {
          console.error('❌ Failed to create session:', res.status, res.statusText)
          alert('Failed to start session: ' + res.status + ' ' + res.statusText)
          setJoiningClass(null)
          return
        }
        
        const data = await res.json()
        console.log('✅ Session found/created:', data)
        
        if (data.id) {
          navigate(`/meet/${data.id}`)
        } else {
          alert('Failed to create session. No ID returned.')
          setJoiningClass(null)
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to join class:', err)
    alert('Error joining class: ' + err.message)
    setJoiningClass(null)
  }
}
  // Student Dashboard Component
  const StudentDashboard = () => (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between mb-6 md:mb-8 gap-4">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold text-white">
      Welcome, <span className="text-indigo-400">{user?.name?.split(' ')[0] || 'Student'}</span>
    </h1>
    <p className="text-slate-400 mt-1 text-xs sm:text-sm">Your classes and learning progress.</p>
  </div>
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
  <button onClick={() => setShowJoinModal(true)}
    className="flex items-center justify-center gap-1 sm:gap-2 border border-[#2d3155] hover:border-indigo-500 text-slate-300 hover:text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors">
    <Play size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Join</span> Meeting
  </button>
  <button onClick={handleStartInstantMeeting}
    className="flex items-center justify-center gap-1 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors">
    <Video size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Start</span> Meeting
  </button>
</div>
</div>

        {/* Live Classes Available */}
        {enrolledClassrooms.some(c => c.status === 'live') && (
          <div className="mb-8 bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Radio size={18} className="text-red-500 animate-pulse" /> Live Classes Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledClassrooms.filter(c => c.status === 'live').map(cls => (
                <div key={cls.id} className="bg-[#0f1123] rounded-lg border border-red-600/20 p-4 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cls.color} rounded-lg flex items-center justify-center text-white font-bold text-sm relative`}>
                        {cls.name[0]}
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{cls.name}</p>
                        <p className="text-red-400 text-xs font-medium">LIVE NOW</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mb-3">Taught by <span className="text-white font-medium">{cls.teacher}</span></p>
                  <div className={`${getEngagementBg(cls.engagement)} rounded-lg p-3 mb-3 text-center`}>
                    <p className="text-slate-400 text-xs mb-1">Your Engagement</p>
                    <p className={`font-bold text-lg ${getEngagementColor(cls.engagement)}`}>
                      {cls.engagement}%
                    </p>
                  </div>
                  <button 
                    onClick={() => handleJoinClass(cls)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-medium mt-auto bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                    <Play size={14} /> Join Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Classes */}
        <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4 text-base sm:text-lg">
            <BookOpen size={18} className="text-indigo-400" /> My Classes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {enrolledClassrooms.map(cls => (
              <div key={cls.id} className="bg-[#0f1123] rounded-lg border border-[#2d3155] p-4 hover:border-indigo-500/50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 ${cls.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                    {cls.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{cls.name}</p>
                    <p className="text-slate-400 text-xs">{cls.teacher}</p>
                  </div>
                </div>

                {cls.status === 'live' && (
                  <div className="bg-red-600/20 text-red-400 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                    🔴 Live Now
                  </div>
                )}

                {cls.status === 'upcoming' && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
                    <Clock size={12} /> Next: {cls.nextClass}
                  </div>
                )}

                {cls.status === 'completed' && (
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={12} className="text-green-400" />
                    <span className={`text-xs font-medium ${getEngagementColor(cls.engagement)}`}>
                      Engagement: {cls.engagement}%
                    </span>
                  </div>
                )}

                <button 
                  onClick={() => handleJoinClass(cls)} 
                  disabled={cls.status === 'completed' || joiningClass === cls.id} 
                  className={`w-full text-sm font-medium py-2 rounded-lg transition-colors ${
                    cls.status !== 'completed'
                      ? 'text-indigo-400 hover:text-indigo-300 hover:bg-[#1a1d35] cursor-pointer' 
                      : 'text-slate-500 cursor-not-allowed opacity-60'
                  }`}>
                  {joiningClass === cls.id ? 'Joining...' : cls.status === 'completed' ? 'Class Completed' : 'Join Class'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Classes Enrolled</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{enrolledClassrooms.length}</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-600/20 text-indigo-400 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Avg Engagement</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{calculateAvgEngagement(enrolledClassrooms)}%</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-600/20 text-green-400 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Classes Attended</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{calculateClassesAttended(enrolledClassrooms)}</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-600/20 text-purple-400 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Video size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Teacher Dashboard Component
  const TeacherDashboard = () => (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back, <span style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block'
              }}>{user?.name?.split(' ')[0] || 'Teacher'}</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">Here's what's happening with your classes today.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button onClick={() => navigate('/classrooms')} className="flex items-center justify-center gap-2 border border-[#2d3155] text-slate-300 hover:text-white hover:border-indigo-500 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors">
              <Plus size={16} /> <span className="hidden sm:inline">New Class</span>
            </button>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => setShowJoinModal(true)} className="flex items-center justify-center gap-2 border border-[#2d3155] text-slate-300 hover:text-white hover:border-indigo-500 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors">
                <Play size={16} /> <span className="hidden sm:inline">Join Meeting</span>
              </button>
              <button onClick={handleStartInstantMeeting} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors">
                <Video size={16} /> <span className="hidden sm:inline">Start Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Class Status */}
        {/* Removed: Using real classroom data instead of mock liveSessions */}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 md:mb-8">
          {[
            { label: 'Total Classes', value: teacherClassrooms.length, icon: <BookOpen size={22} />, color: 'bg-indigo-600/20 text-indigo-400' },
            { label: 'Total Students', value: totalStudents, icon: <Users size={22} />, color: 'bg-purple-600/20 text-purple-400' },
            { label: 'Sessions Held', value: calculateSessionsHeld(), icon: <Video size={22} />, color: 'bg-blue-600/20 text-blue-400' },
            { label: 'Avg Engagement', value: calculateAvgEngagement(teacherClassrooms) + '%', icon: <TrendingUp size={22} />, color: 'bg-green-600/20 text-green-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">{stat.label}</p>
                <p className="text-xl sm:text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Upcoming Classes */}
          <div className="lg:col-span-2 bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                <BookOpen size={18} className="text-indigo-400" /> My Classes
              </h2>
              <button onClick={() => navigate('/classrooms')} className="text-indigo-400 text-xs sm:text-sm hover:underline whitespace-nowrap">Create New →</button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {teacherClassrooms.map(classroom => (
                <div key={classroom.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 bg-[#0f1123] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                    <div className={`w-9 h-9 ${classroom.color} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {classroom.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{classroom.name}</p>
                      <p className="text-slate-500 text-xs">Ready to teach</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoinClass(classroom)}
                    disabled={joiningClass === classroom.id}
                    className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-medium">
                    <Play size={14} /> {joiningClass === classroom.id ? 'Starting...' : 'Start Session'}
                  </button>
                </div>
              ))}
              {teacherClassrooms.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-4">No classrooms yet. <span onClick={() => navigate('/classrooms')} className="text-indigo-400 hover:underline cursor-pointer">Create one</span>.</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                ⚡ Quick Actions
              </h2>
              <div className="space-y-1">
                <button onClick={() => navigate('/classrooms')} className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-[#0f1123] px-3 py-2.5 rounded-lg text-xs sm:text-sm transition-colors text-left">
                  <span className="text-indigo-400 flex-shrink-0"><Plus size={16} /></span>
                  <span className="truncate">Create New Class</span>
                </button>
                <button onClick={handleStartInstantMeeting} className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-[#0f1123] px-3 py-2.5 rounded-lg text-xs sm:text-sm transition-colors text-left">
                  <span className="text-indigo-400 flex-shrink-0"><Video size={16} /></span>
                  <span className="truncate">Start Instant Meeting</span>
                </button>
                <button onClick={() => setShowJoinModal(true)} className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-[#0f1123] px-3 py-2.5 rounded-lg text-xs sm:text-sm transition-colors text-left">
                  <span className="text-indigo-400 flex-shrink-0"><Play size={16} /></span>
                  <span className="truncate">Join Classroom</span>
                </button>
                <button onClick={() => navigate('/analytics')} className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-[#0f1123] px-3 py-2.5 rounded-lg text-xs sm:text-sm transition-colors text-left">
                  <span className="text-indigo-400 flex-shrink-0"><BarChart2 size={16} /></span>
                  <span className="truncate">View Analytics</span>
                </button>
                <button onClick={() => navigate('/reports')} className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-[#0f1123] px-3 py-2.5 rounded-lg text-xs sm:text-sm transition-colors text-left">
                  <span className="text-indigo-400 flex-shrink-0"><FileText size={16} /></span>
                  <span className="truncate">Generate Reports</span>
                </button>
              </div>
            </div>

            {/* Class Statistics */}
            <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                📚 Classroom Status
              </h2>
              <div className="space-y-2">
                {teacherClassrooms.length > 0 ? (
                  teacherClassrooms.slice(0, 5).map(cls => (
                    <div key={cls.id} className="flex items-center justify-between">
                      <p className="text-slate-400 text-xs truncate">{cls.name}</p>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0">
                        Ready
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs text-center py-2">No classrooms created yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render based on user role
return (
  <>
    {user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}

    {/* Meeting Code Modal */}
    {meetingCode && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-0">
    <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl p-6 sm:p-8 w-full max-w-md text-center relative">
      <button onClick={() => { setMeetingCode(null); setPendingMeetingId(null) }}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
        <X size={20} />
      </button>
      <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Video size={28} className="text-indigo-400" />
      </div>
      <h2 className="text-white font-bold text-xl sm:text-2xl mb-2">Meeting Created!</h2>
      <p className="text-slate-400 text-sm mb-6">Share this code with others to join your meeting</p>
      <div className="bg-[#0f1123] rounded-xl p-4 mb-6">
        <p className="text-slate-400 text-xs mb-2">Meeting Code</p>
        <p className="text-3xl sm:text-4xl font-bold text-indigo-400 tracking-widest">{meetingCode}</p>
      </div>
      <CopyButton code={meetingCode} />
      <button onClick={() => { setMeetingCode(null); navigate(`/meet/${pendingMeetingId}`) }}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
        Start Meeting →
      </button>
    </div>
  </div>
)}

    {/* Join Meeting Modal */}
    {showJoinModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-0">
    <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl p-6 sm:p-8 w-full max-w-md text-center relative">
      <button onClick={() => { setShowJoinModal(false); setJoinCode('') }}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
        <X size={20} />
      </button>
      <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Play size={28} className="text-indigo-400" />
      </div>
      <h2 className="text-white font-bold text-xl sm:text-2xl mb-2">Join a Meeting</h2>
      <p className="text-slate-400 text-sm mb-6">Enter the meeting code shared with you</p>
      <input
        type="text"
        value={joinCode}
        onChange={e => setJoinCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleJoinMeeting()}
        placeholder="e.g. UUG3AP"
        maxLength={6}
        className="w-full bg-[#0f1123] border border-[#2d3155] focus:border-indigo-500 text-white text-center text-xl sm:text-2xl font-bold tracking-widest rounded-xl px-4 py-3 sm:py-4 mb-6 outline-none uppercase"
      />
      <button onClick={handleJoinMeeting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
        Join Meeting →
      </button>
    </div>
  </div>
)}
  </>
)
}