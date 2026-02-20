import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Award, Calendar, AlertTriangle } from 'lucide-react'

const engagementData = [
  { date: 'Feb 6', avg: 62 }, { date: 'Feb 7', avg: 68 },
  { date: 'Feb 8', avg: 85 }, { date: 'Feb 9', avg: 78 },
  { date: 'Feb 10', avg: 72 }, { date: 'Feb 11', avg: 65 },
  { date: 'Feb 12', avg: 70 },
]

const timeOfDayData = [
  { time: '9 AM', engagement: 82 }, { time: '10 AM', engagement: 78 },
  { time: '11 AM', engagement: 71 }, { time: '12 PM', engagement: 65 },
  { time: '1 PM', engagement: 58 }, { time: '2 PM', engagement: 62 },
  { time: '3 PM', engagement: 75 }, { time: '4 PM', engagement: 68 },
]

const studentStatusData = [
  { name: 'Focused', value: 10, color: '#22c55e' },
  { name: 'Neutral', value: 3, color: '#f59e0b' },
  { name: 'Distracted', value: 2, color: '#ef4444' },
]

const topPerformers = [
  { name: 'Aditya Verma', avg: 89 },
  { name: 'Diya Nair', avg: 88 },
  { name: 'Kabir Mehta', avg: 88 },
  { name: 'Navya Menon', avg: 87 },
  { name: 'Arjun Singh', avg: 87 },
]

const needAttention = [
  { name: 'Aisha Khan', avg: 23 },
  { name: 'Tara Kapoor', avg: 31 },
  { name: 'Rohan Bhat', avg: 38 },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={28} className="text-indigo-400" /> Analytics
            </h1>
            <p className="text-slate-400 mt-1">Track engagement trends and student performance.</p>
          </div>
          <div className="flex gap-3">
            <select className="bg-[#1a1d35] border border-[#2d3155] text-slate-300 text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500">
              <option>All Classrooms</option>
              <option>Physics - Class 12B</option>
              <option>Computer Science - Class 12</option>
            </select>
            <select className="bg-[#1a1d35] border border-[#2d3155] text-slate-300 text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Avg Engagement', value: '78%', sub: '+5% from last week', icon: <TrendingUp size={22} />, color: 'bg-green-600/20 text-green-400', subColor: 'text-green-400' },
            { label: 'Peak Engagement', value: '100%', sub: 'Best session score', icon: <Award size={22} />, color: 'bg-yellow-600/20 text-yellow-400', subColor: 'text-slate-500' },
            { label: 'Total Sessions', value: '22', sub: 'Classes conducted', icon: <Calendar size={22} />, color: 'bg-blue-600/20 text-blue-400', subColor: 'text-slate-500' },
            { label: 'At-Risk Students', value: '5', sub: 'Need attention', icon: <AlertTriangle size={22} />, color: 'bg-red-600/20 text-red-400', subColor: 'text-red-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.subColor}`}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Area Chart */}
          <div className="col-span-2 bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Engagement Over Time</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d35', border: '1px solid #2d3155', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="avg" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart */}
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Student Status</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={studentStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {studentStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1d35', border: '1px solid #2d3155', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {studentStatusData.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-slate-400">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Engagement by Time of Day</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3155" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d35', border: '1px solid #2d3155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="engagement" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2 text-center">
              💡 Students are most engaged in the morning (9-10 AM)
            </p>
          </div>

          {/* Top Performers + Need Attention */}
          <div className="space-y-4">
            <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                🏆 Top Performers
              </h2>
              <div className="space-y-2">
                {topPerformers.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">#{i + 1} {s.name}</span>
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full font-medium">{s.avg}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                ⚠️ Need Attention
              </h2>
              <div className="space-y-2">
                {needAttention.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">#{i + 1} {s.name}</span>
                    <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-medium">{s.avg}%</span>
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