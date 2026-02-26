import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { AuthContext } from '../context/AuthContext'
import { Clock, TrendingUp, Video, Calendar, Award, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const mockHistory = [
  {
    sessionId: 'mock1',
    sessionName: 'Physics - Class 12B',
    date: '2026-02-20T10:00:00Z',
    avgScore: 82,
    peakScore: 95,
    duration: 45,
    status: 'Focused'
  },
  {
    sessionId: 'mock2',
    sessionName: "Aryan's Instant Meeting",
    date: '2026-02-19T15:00:00Z',
    avgScore: 74,
    peakScore: 88,
    duration: 30,
    status: 'Focused'
  },
  {
    sessionId: 'mock3',
    sessionName: 'Mathematics - Class 11A',
    date: '2026-02-18T09:00:00Z',
    avgScore: 45,
    peakScore: 61,
    duration: 60,
    status: 'At Risk'
  },
  {
    sessionId: 'mock4',
    sessionName: 'Computer Science - Class 12',
    date: '2026-02-15T14:00:00Z',
    avgScore: 91,
    peakScore: 100,
    duration: 50,
    status: 'Focused'
  },
  {
    sessionId: 'mock5',
    sessionName: 'Physics - Class 12B',
    date: '2026-02-12T10:00:00Z',
    avgScore: 58,
    peakScore: 72,
    duration: 45,
    status: 'Neutral'
  },
]

const getStatusColor = (status) => {
  if (status === 'Focused') return 'text-green-400 bg-green-600/20'
  if (status === 'Neutral') return 'text-yellow-400 bg-yellow-600/20'
  return 'text-red-400 bg-red-600/20'
}

const getScoreColor = (score) => {
  if (score >= 75) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

const getEngagementStatus = (score) => {
  if (score >= 75) return 'Focused'
  if (score >= 50) return 'Neutral'
  return 'At Risk'
}

export default function HistoryPage() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('classlens_token')
      const res = await fetch(`${BACKEND_URL}/engagement/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      const real = (json.history || []).map(h => ({
        ...h,
        status: getEngagementStatus(h.avgScore)
      }))
      setHistory([...mockHistory, ...real])
    } catch (err) {
      console.error(err)
      setHistory(mockHistory)
    } finally {
      setLoading(false)
    }
  }

  const avgEngagement = history.length
    ? Math.round(history.reduce((a, h) => a + h.avgScore, 0) / history.length)
    : 0

  const bestSession = history.length
    ? history.reduce((a, b) => a.avgScore > b.avgScore ? a : b)
    : null

  const needsAttention = history.filter(h => h.avgScore < 50).length

  return (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Clock size={24} className="sm:w-7 sm:h-7 text-indigo-400" /> My Meeting History
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">Your personal engagement across all meetings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Avg Engagement</p>
                <p className={`text-2xl sm:text-3xl font-bold ${getScoreColor(avgEngagement)}`}>{avgEngagement}%</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="sm:w-6 sm:h-6 text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Meetings Attended</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{history.length}</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Video size={20} className="sm:w-6 sm:h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Best Session</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">{bestSession?.peakScore || 0}%</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Award size={20} className="sm:w-6 sm:h-6 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Attention Banner */}
        {needsAttention > 0 && (
          <div className="mb-5 sm:mb-6 bg-red-600/10 border border-red-600/30 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs sm:text-sm">
              You had low engagement in <span className="font-bold text-red-400">{needsAttention} session{needsAttention > 1 ? 's' : ''}</span>. Consider reviewing those topics!
            </p>
          </div>
        )}

        {/* History List */}
        <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#2d3155]">
            <h2 className="text-white font-semibold text-sm sm:text-base flex items-center gap-2">
              <Calendar size={16} className="sm:w-5 sm:h-5 text-indigo-400" /> All Sessions
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Video size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm sm:text-base">No meetings attended yet</p>
              <button onClick={() => navigate('/dashboard')}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-xs sm:text-sm">
                Go to Dashboard →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#2d3155]">
              {history.map((session, i) => (
                <div key={i}>
                  <div
                    className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#0f1123] transition-colors cursor-pointer gap-3"
                    onClick={() => setExpanded(expanded === i ? null : i)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 bg-indigo-600/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Video size={16} className="sm:w-5 sm:h-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs sm:text-sm font-medium truncate">{session.sessionName}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(session.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      <div className="text-right hidden sm:block">
                        <p className={`text-lg font-bold ${getScoreColor(session.avgScore)}`}>{session.avgScore}%</p>
                        <p className="text-slate-500 text-xs">avg engagement</p>
                      </div>
                      {expanded === i
                        ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
                        : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded === i && (
                    <div className="px-3 sm:px-6 pb-4 sm:pb-6 bg-[#0f1123]">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div className="bg-[#1a1d35] rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                          <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(session.avgScore)}`}>{session.avgScore}%</p>
                          <p className="text-slate-400 text-xs mt-1">Avg Engagement</p>
                        </div>
                        <div className="bg-[#1a1d35] rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                          <p className="text-xl sm:text-2xl font-bold text-green-400">{session.peakScore}%</p>
                          <p className="text-slate-400 text-xs mt-1">Peak Score</p>
                        </div>
                        <div className="bg-[#1a1d35] rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                          <p className="text-xl sm:text-2xl font-bold text-white">{session.duration || '—'}</p>
                          <p className="text-slate-400 text-xs mt-1">Minutes</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-2">Engagement Level</p>
                        <div className="w-full bg-[#2d3155] rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all duration-700 ${
                            session.avgScore >= 75 ? 'bg-green-500' :
                            session.avgScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} style={{ width: `${session.avgScore}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}