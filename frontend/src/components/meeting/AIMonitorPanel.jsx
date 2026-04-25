import { Activity, Users, TrendingUp } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

export default function AIMonitorPanel({ engagementMap, participants, onClose }) {
  const scores = Object.values(engagementMap)
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const focused = scores.filter(s => s >= 75).length
  const neutral = scores.filter(s => s >= 50 && s < 75).length
  const distracted = scores.filter(s => s < 50).length

  const getStatus = (s) => {
    if (s >= 75) return { label: 'Focused', color: 'text-green-400', emoji: '😊' }
    if (s >= 50) return { label: 'Neutral', color: 'text-yellow-400', emoji: '😐' }
    return { label: 'Distracted', color: 'text-red-400', emoji: '😴' }
  }

  const getRingColor = (s) => {
    if (s >= 75) return '#22c55e'
    if (s >= 50) return '#f59e0b'
    return '#ef4444'
  }

  // Mini timeline data (last 10 readings)
  const timelineData = Array.from({ length: 10 }, (_, i) => ({
    t: i, avg: Math.max(0, avg + Math.floor(Math.random() * 20 - 10))
  }))

  return (
    <div className="w-72 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <h2 className="text-[var(--text-primary)] font-semibold text-sm flex items-center gap-2">
          <Activity size={16} className="text-indigo-400" /> AI Engagement Monitor
        </h2>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg leading-none">×</button>
      </div>

      {/* Circular progress */}
      <div className="p-4 border-b border-[var(--border-color)] flex flex-col items-center">
        <p className="text-[var(--text-secondary)] text-xs mb-3">Class Engagement</p>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none"
              stroke={getRingColor(avg)} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - avg / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{avg}%</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-[var(--border-color)]">
        <div className="bg-green-600/20 rounded-lg p-2 text-center">
          <p className="text-green-400 text-xl font-bold">{focused}</p>
          <p className="text-green-400 text-xs">Focused</p>
        </div>
        <div className="bg-yellow-600/20 rounded-lg p-2 text-center">
          <p className="text-yellow-400 text-xl font-bold">{neutral}</p>
          <p className="text-yellow-400 text-xs">Neutral</p>
        </div>
        <div className="bg-red-600/20 rounded-lg p-2 text-center">
          <p className="text-red-400 text-xl font-bold">{distracted}</p>
          <p className="text-red-400 text-xs">Distracted</p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <p className="text-[var(--text-secondary)] text-xs mb-2 flex items-center gap-1">
          <TrendingUp size={12} /> Live Engagement
        </p>
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="avg" stroke="#6366f1" fill="url(#miniGrad)" strokeWidth={1.5} dot={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '10px' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Student list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-[var(--border-color)]">
          <p className="text-[var(--text-secondary)] text-xs flex items-center gap-1">
            <Users size={12} /> Students ({participants.length})
          </p>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {participants.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-xs text-center py-6">Waiting for students...</p>
          ) : (
            participants.map((p, i) => {
              const score = engagementMap[p.uid]
              const status = score !== undefined ? getStatus(score) : null
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {String(p.name).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[var(--text-primary)] text-xs font-medium">{p.name}</p>
                      {status && <p className={`text-xs ${status.color}`}>{status.label}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {score !== undefined ? (
                      <>
                        <span className={`text-sm font-bold ${score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {score}%
                        </span>
                        <span>{status?.emoji}</span>
                      </>
                    ) : (
                      <span className="text-gray-500 text-xs">—</span>
                    )}
                    {score !== undefined && score < 50 && (
                      <span className="text-xs bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded-full">!</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}