import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { BookOpen, Users, Video, TrendingUp, Plus, Play, BarChart2, FileText, Radio, Clock, Award } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const mockSessions = [
  { id: '1', name: 'Physics - Class 12B', students: 15, date: 'Feb 19, 5:37 PM', color: 'bg-purple-600' },
  { id: '2', name: 'Computer Science - Class 12', students: 10, date: 'Feb 20, 5:37 PM', color: 'bg-blue-600' },
  { id: '3', name: 'Mathematics - Class 11A', students: 18, date: 'Feb 21, 3:00 PM', color: 'bg-green-600' },
]

// Mock live sessions (would come from backend in real app)
const mockLiveSessions = [
  { id: '1', name: 'Physics - Class 12B', color: 'bg-purple-600', participants: 12, engagement: 78, status: 'live' },
  { id: '2', name: 'Computer Science - Class 12', color: 'bg-blue-600', participants: 8, engagement: 85, status: 'live' },
]

// Mock student enrolled classes (will be replaced by real data)
const mockStudentClasses = [
  { id: '1', name: 'Physics - Class 12B', teacher: 'Mr. Johnson', color: 'bg-purple-600', status: 'live', engagement: 78 },
  { id: '2', name: 'Computer Science - Class 12', teacher: 'Ms. Sarah', color: 'bg-blue-600', status: 'upcoming', nextClass: 'Feb 23, 5:00 PM' },
  { id: '3', name: 'Mathematics - Class 11A', teacher: 'Mr. Kumar', color: 'bg-green-600', status: 'completed', engagement: 82 },
]

const quickActions = [
  { label: 'Create New Class', icon: <Plus size={16} /> },
  { label: 'Start Instant Meeting', icon: <Video size={16} /> },
  { label: 'View Analytics', icon: <BarChart2 size={16} /> },
  { label: 'Generate Reports', icon: <FileText size={16} /> },
]

export default function DashboardPage() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [sessions] = useState(mockSessions)
  const [liveSessions] = useState(mockLiveSessions)
  const [enrolledClassrooms, setEnrolledClassrooms] = useState(mockStudentClasses)

  // Fetch enrolled classrooms for students
  useEffect(() => {
    if (user?.role === 'student') {
      fetchEnrolledClassrooms()
    }
  }, [user])

  const fetchEnrolledClassrooms = async () => {
    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${BACKEND_URL}/classrooms/enrolled/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const { data } = await response.json()
        // Convert to dashboard format
        const formattedClasses = data.map(cls => ({
          id: cls.id,
          name: cls.name,
          teacher: cls.teacherName,
          color: cls.color,
          status: 'upcoming', // This would be determined by session data
          engagement: Math.floor(Math.random() * 30 + 70),
          nextClass: 'TBD'
        }))
        setEnrolledClassrooms(formattedClasses)
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

  // Student Dashboard Component
  const StudentDashboard = () => (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome, <span className="text-indigo-400">{user?.name?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="text-slate-400 mt-1">Your classes and learning progress.</p>
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
                  <button onClick={() => navigate(`/meet/${cls.id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors text-sm font-medium mt-auto">
                    <Play size={14} /> Join Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Classes */}
        <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6 mb-8">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-indigo-400" /> My Classes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                <button onClick={() => navigate(`/meet/${cls.id}`)} className="w-full text-indigo-400 hover:text-indigo-300 text-sm font-medium py-2 rounded-lg hover:bg-[#1a1d35] transition-colors">
                  {cls.status === 'live' ? 'Join Class' : cls.status === 'upcoming' ? 'Mark as Interested' : 'View Details'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Classes Enrolled</p>
                <p className="text-3xl font-bold text-white">{enrolledClassrooms.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center">
                <BookOpen size={22} />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg Engagement</p>
                <p className="text-3xl font-bold text-white">80%</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 text-green-400 rounded-xl flex items-center justify-center">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Classes Attended</p>
                <p className="text-3xl font-bold text-white">12</p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center">
                <Video size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Teacher Dashboard Component
  const TeacherDashboard = () => (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="text-indigo-400">{user?.name?.split(' ')[0] || 'Teacher'}</span>
            </h1>
            <p className="text-slate-400 mt-1">Here's what's happening with your classes today.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/classrooms')} className="flex items-center gap-2 border border-[#2d3155] text-slate-300 hover:text-white hover:border-indigo-500 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Plus size={16} /> New Class
            </button>
            <button onClick={() => navigate('/classrooms')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Video size={16} /> Start Meeting
            </button>
          </div>
        </div>

        {/* Live Class Status */}
        {liveSessions.length > 0 && (
          <div className="mb-8 bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Radio size={18} className="text-red-500 animate-pulse" /> Live Classes
              </h2>
              <span className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-full font-medium">
                {liveSessions.length} Active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveSessions.map(session => (
                <div key={session.id} className="bg-[#0f1123] rounded-lg border border-red-600/20 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${session.color} rounded-lg flex items-center justify-center text-white font-bold text-sm relative`}>
                        {session.name[0]}
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{session.name}</p>
                        <p className="text-red-400 text-xs font-medium flex items-center gap-1">
                          <Radio size={10} className="animate-pulse" /> LIVE NOW
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1a1d35] rounded-lg p-3 text-center">
                      <p className="text-slate-500 text-xs mb-1">Participants</p>
                      <p className="text-white font-bold text-lg flex items-center justify-center gap-1">
                        <Users size={14} /> {session.participants}
                      </p>
                    </div>
                    <div className={`${getEngagementBg(session.engagement)} rounded-lg p-3 text-center`}>
                      <p className="text-slate-400 text-xs mb-1">Avg Engagement</p>
                      <p className={`font-bold text-lg ${getEngagementColor(session.engagement)}`}>
                        {session.engagement}%
                      </p>
                    </div>
                  </div>

                  <button onClick={() => navigate(`/meet/${session.id}`)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                    <Play size={14} /> Join Live Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Classes', value: sessions.length, icon: <BookOpen size={22} />, color: 'bg-indigo-600/20 text-indigo-400' },
            { label: 'Total Students', value: sessions.reduce((a, s) => a + s.students, 0), icon: <Users size={22} />, color: 'bg-purple-600/20 text-purple-400' },
            { label: 'Sessions Held', value: 21, icon: <Video size={22} />, color: 'bg-blue-600/20 text-blue-400' },
            { label: 'Avg Engagement', value: '77%', icon: <TrendingUp size={22} />, color: 'bg-green-600/20 text-green-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Upcoming Classes */}
          <div className="col-span-2 bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-400" /> Upcoming Classes
              </h2>
              <button className="text-indigo-400 text-sm hover:underline">View All →</button>
            </div>
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between bg-[#0f1123] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${session.color} rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                      {session.name[0]}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{session.name}</p>
                      <p className="text-slate-500 text-xs">{session.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-full">
                      {session.students} students
                    </span>
                    <button onClick={() => navigate(`/meet/${session.id}`)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                      <Play size={12} /> Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                ⚡ Quick Actions
              </h2>
              <div className="space-y-1">
                {quickActions.map((action, i) => (
                  <button key={i} className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-[#0f1123] px-3 py-2.5 rounded-lg text-sm transition-colors text-left">
                    <span className="text-indigo-400">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                📊 Recent Sessions
              </h2>
              <div className="space-y-2">
                {sessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs truncate w-40">{session.name}</p>
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
                      {Math.floor(Math.random() * 30 + 70)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render based on user role
  return user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />
}