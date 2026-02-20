import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { BookOpen, Users, Video, TrendingUp, Plus, Play, BarChart2, FileText } from 'lucide-react'

const mockSessions = [
  { id: '1', name: 'Physics - Class 12B', students: 15, date: 'Feb 19, 5:37 PM', color: 'bg-purple-600' },
  { id: '2', name: 'Computer Science - Class 12', students: 10, date: 'Feb 20, 5:37 PM', color: 'bg-blue-600' },
  { id: '3', name: 'Mathematics - Class 11A', students: 18, date: 'Feb 21, 3:00 PM', color: 'bg-green-600' },
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

  return (
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
            <button className="flex items-center gap-2 border border-[#2d3155] text-slate-300 hover:text-white hover:border-indigo-500 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Plus size={16} /> New Class
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Video size={16} /> Start Meeting
            </button>
          </div>
        </div>

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
}