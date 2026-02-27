import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { Calendar, Users, TrendingUp, FileText, Download, Eye, Filter, X } from 'lucide-react'
import jsPDF from 'jspdf'

const typeBadge = (type) => {
  const styles = {
    weekly: 'bg-teal-600/20 text-teal-400',
    session: 'bg-indigo-600/20 text-indigo-400',
    student: 'bg-purple-600/20 text-purple-400',
  }
  return styles[type] || 'bg-gray-600/20 text-gray-400'
}

const getStatusColor = (status) => {
  if (status === 'Focused' || status === 'High') return 'text-green-400 bg-green-600/20'
  if (status === 'Neutral' || status === 'Medium') return 'text-yellow-400 bg-yellow-600/20'
  if (status === 'No Data') return 'text-gray-400 bg-gray-600/20'
  return 'text-red-400 bg-red-600/20'
}

export default function ReportsPage() {
  const [modal, setModal] = useState(null) // 'student' | 'session' | 'weekly'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const closeModal = () => { setModal(null); setSelected(null); setData([]) }

  const fetchData = async (type) => {
    setLoading(true)
    setModal(type)
    setSelected(null)
    try {
      const endpoints = {
        student: '/session/students/report',
        session: '/session/report/sessions',
        weekly: '/session/report/weekly'
      }
      const token = localStorage.getItem('classlens_token')
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${endpoints[type]}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      const mockSessions = [
  { id: 'mock1', name: 'Physics - Class 12B', channelName: 'DEMO01', createdAt: '2026-02-12T10:00:00Z', avgScore: 71, peakScore: 94, totalStudents: 15, status: 'Medium' },
  { id: 'mock2', name: 'Computer Science - Class 12', channelName: 'DEMO02', createdAt: '2026-02-11T10:00:00Z', avgScore: 77, peakScore: 98, totalStudents: 10, status: 'High' },
  { id: 'mock3', name: 'Mathematics - Class 11A', channelName: 'DEMO03', createdAt: '2026-02-10T10:00:00Z', avgScore: 85, peakScore: 100, totalStudents: 18, status: 'High' },
]

const mockStudents = [
  { id: 'ms1', name: 'Aisha Khan', email: 'aisha@school.com', avgScore: 82, peakScore: 95, totalSessions: 8, status: 'Focused' },
  { id: 'ms2', name: 'Aryan Pillai', email: 'aryan@school.com', avgScore: 74, peakScore: 91, totalSessions: 7, status: 'Focused' },
  { id: 'ms3', name: 'Tara Kapoor', email: 'tara@school.com', avgScore: 45, peakScore: 67, totalSessions: 6, status: 'At Risk' },
  { id: 'ms4', name: 'Rohan Bhat', email: 'rohan@school.com', avgScore: 61, peakScore: 78, totalSessions: 8, status: 'Neutral' },
]

const mockWeeks = [
  { weekLabel: 'Week of Feb 10', sessions: 3, avgScore: 77, totalStudents: 18 },
  { weekLabel: 'Week of Feb 3', sessions: 4, avgScore: 72, totalStudents: 21 },
  { weekLabel: 'Week of Jan 27', sessions: 3, avgScore: 68, totalStudents: 19 },
]

if (type === 'student') setData([...mockStudents, ...(json.students || [])])
else if (type === 'session') setData([...mockSessions, ...(json.sessions || [])])
else if (type === 'weekly') setData([...mockWeeks, ...(json.weeks || [])])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadStudentPDF = (student) => {
    const doc = new jsPDF()
    doc.setFillColor(26, 29, 53)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('ClassLens', 20, 18)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Student Engagement Report', 20, 30)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(student.name, 20, 60)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(student.email, 20, 70)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 80)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 88, 190, 88)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Engagement Summary', 20, 100)
    const stats = [
      ['Average Engagement Score', `${student.avgScore}%`],
      ['Peak Engagement Score', `${student.peakScore}%`],
      ['Total Sessions Attended', `${student.totalSessions}`],
      ['Engagement Status', student.status],
    ]
    doc.setFontSize(11)
    stats.forEach(([label, value], i) => {
      const y = 115 + i * 15
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(label, 20, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(value, 150, y)
    })
    doc.setFillColor(99, 102, 241)
    doc.rect(20, 185, (student.avgScore / 100) * 170, 8, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.rect(20, 185, 170, 8, 'S')
    doc.setFillColor(26, 29, 53)
    doc.rect(0, 275, 210, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('Generated by ClassLens — AI-Powered Student Engagement Monitor', 20, 287)
    doc.save(`${student.name}_engagement_report.pdf`)
  }

  const downloadSessionPDF = (session) => {
    const doc = new jsPDF()
    doc.setFillColor(26, 29, 53)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('ClassLens', 20, 18)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Session Engagement Report', 20, 30)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(session.name, 20, 60)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Session Code: ${session.channelName}`, 20, 70)
    doc.text(`Date: ${new Date(session.createdAt).toLocaleDateString()}`, 20, 80)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 90)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 98, 190, 98)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Session Summary', 20, 110)
    const stats = [
      ['Average Engagement Score', `${session.avgScore}%`],
      ['Peak Engagement Score', `${session.peakScore}%`],
      ['Total Students', `${session.totalStudents}`],
      ['Engagement Level', session.status],
    ]
    doc.setFontSize(11)
    stats.forEach(([label, value], i) => {
      const y = 125 + i * 15
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(label, 20, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(value, 150, y)
    })
    doc.setFillColor(99, 102, 241)
    doc.rect(20, 195, (session.avgScore / 100) * 170, 8, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.rect(20, 195, 170, 8, 'S')
    doc.setFillColor(26, 29, 53)
    doc.rect(0, 275, 210, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('Generated by ClassLens — AI-Powered Student Engagement Monitor', 20, 287)
    doc.save(`${session.name}_session_report.pdf`)
  }

  const downloadWeeklyPDF = (weeks) => {
    const doc = new jsPDF()
    doc.setFillColor(26, 29, 53)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('ClassLens', 20, 18)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Weekly Engagement Summary', 20, 30)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Weekly Breakdown', 20, 55)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 72, 190, 72)
    // Table headers
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Week', 20, 82)
    doc.text('Sessions', 90, 82)
    doc.text('Students', 130, 82)
    doc.text('Avg Score', 165, 82)
    doc.line(20, 85, 190, 85)
    // Table rows
    doc.setFont('helvetica', 'normal')
    weeks.forEach((week, i) => {
      const y = 95 + i * 12
      doc.text(week.weekLabel, 20, y)
      doc.text(`${week.sessions}`, 90, y)
      doc.text(`${week.totalStudents}`, 130, y)
      doc.text(`${week.avgScore}%`, 165, y)
    })
    doc.setFillColor(26, 29, 53)
    doc.rect(0, 275, 210, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('Generated by ClassLens — AI-Powered Student Engagement Monitor', 20, 287)
    doc.save(`weekly_summary_report.pdf`)
  }

  const reportCards = [
    {
      icon: <Calendar size={28} className="text-indigo-400" />,
      title: 'Session Report',
      desc: 'Detailed engagement metrics for each class session',
      color: 'bg-indigo-600/20',
      type: 'session'
    },
    {
      icon: <Users size={28} className="text-purple-400" />,
      title: 'Student Report',
      desc: 'Individual student engagement scores and status',
      color: 'bg-purple-600/20',
      type: 'student'
    },
    {
      icon: <TrendingUp size={28} className="text-blue-400" />,
      title: 'Weekly Summary',
      desc: 'Comprehensive weekly engagement analysis with insights',
      color: 'bg-blue-600/20',
      type: 'weekly'
    },
  ]

  return (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText size={28} className="text-indigo-400" /> Reports
          </h1>
          <p className="text-slate-400 mt-1">Generate and download engagement reports.</p>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {reportCards.map((report, i) => (
            <div key={i} className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
              <div className={`w-14 h-14 ${report.color} rounded-xl flex items-center justify-center mb-4`}>
                {report.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{report.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{report.desc}</p>
              <button
                onClick={() => fetchData(report.type)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                <Eye size={15} /> View Report
              </button>
            </div>
          ))}
        </div>

        {/* Recent Reports Table */}
        <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" /> Recent Reports
            </h2>
            <button className="flex items-center gap-2 border border-[#2d3155] text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              <Filter size={14} /> Filter
            </button>
          </div>
          <div className="w-full">
            <div className="grid grid-cols-5 text-xs text-slate-500 uppercase tracking-wider pb-3 border-b border-[#2d3155] px-2">
              <span className="col-span-2">Report Name</span>
              <span>Type</span>
              <span>Date</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-[#2d3155]">
              {[
                { name: 'Weekly Report - Week 12', type: 'weekly', date: 'Feb 12, 2026' },
                { name: 'Mathematics 101 - Session', type: 'session', date: 'Feb 11, 2026' },
                { name: 'Student Performance', type: 'student', date: 'Feb 10, 2026' },
                { name: 'Physics Class 12B - Session', type: 'session', date: 'Feb 9, 2026' },
                { name: 'Weekly Report - Week 11', type: 'weekly', date: 'Feb 5, 2026' },
              ].map((report, i) => (
                <div key={i} className="grid grid-cols-5 items-center py-4 px-2 hover:bg-[#0f1123] rounded-lg transition-colors">
                  <div className="col-span-2 flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-slate-300 text-sm">{report.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full w-fit font-medium ${typeBadge(report.type)}`}>
                    {report.type}
                  </span>
                  <span className="text-slate-400 text-sm">{report.date}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchData(report.type)}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors px-2 py-1 border border-[#2d3155] rounded-lg">
                      <Eye size={13} /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2d3155]">
              <h2 className="text-white font-semibold text-xl flex items-center gap-2">
                {modal === 'student' && <><Users size={20} className="text-purple-400" /> Student Reports</>}
                {modal === 'session' && <><Calendar size={20} className="text-indigo-400" /> Session Reports</>}
                {modal === 'weekly' && <><TrendingUp size={20} className="text-blue-400" /> Weekly Summary</>}
              </h2>
              <div className="flex items-center gap-2">
                {modal === 'weekly' && data.length > 0 && (
                  <button
                    onClick={() => downloadWeeklyPDF(data)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    <Download size={13} /> Download PDF
                  </button>
                )}
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              ) : modal === 'student' ? (
                selected ? (
                  <div>
                    <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1">
                      ← Back to list
                    </button>
                    <div className="bg-[#0f1123] rounded-xl p-6 mb-4">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {selected.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{selected.name}</h3>
                          <p className="text-slate-400 text-sm">{selected.email}</p>
                        </div>
                        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(selected.status)}`}>
                          {selected.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#1a1d35] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-white">{selected.avgScore}%</p>
                          <p className="text-slate-400 text-xs mt-1">Avg Engagement</p>
                        </div>
                        <div className="bg-[#1a1d35] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-white">{selected.peakScore}%</p>
                          <p className="text-slate-400 text-xs mt-1">Peak Score</p>
                        </div>
                        <div className="bg-[#1a1d35] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-white">{selected.totalSessions}</p>
                          <p className="text-slate-400 text-xs mt-1">Sessions</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-slate-400 text-xs mb-2">Engagement Level</p>
                        <div className="w-full bg-[#2d3155] rounded-full h-3">
                          <div className="h-3 rounded-full bg-indigo-500 transition-all duration-700"
                            style={{ width: `${selected.avgScore}%` }} />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadStudentPDF(selected)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors">
                      <Download size={18} /> Download PDF Report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">No students found</p>
                    ) : data.map((student, i) => (
                      <div key={i} className="bg-[#0f1123] rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {student.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{student.name}</p>
                            <p className="text-slate-400 text-xs">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(student.status)}`}>{student.status}</span>
                          <span className="text-white font-bold text-sm">{student.avgScore}%</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelected(student)}
                              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs px-2 py-1 border border-[#2d3155] rounded-lg">
                              <Eye size={13} /> View
                            </button>
                            <button onClick={() => downloadStudentPDF(student)}
                              className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 text-xs px-2 py-1 border border-[#2d3155] rounded-lg">
                              <Download size={13} /> PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : modal === 'session' ? (
                selected ? (
                  <div>
                    <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1">
                      ← Back to list
                    </button>
                    <div className="bg-[#0f1123] rounded-xl p-6 mb-4">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                          <Calendar size={28} className="text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{selected.name}</h3>
                          <p className="text-slate-400 text-sm">Code: {selected.channelName} · {new Date(selected.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(selected.status)}`}>{selected.status}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#1a1d35] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-white">{selected.avgScore}%</p>
                          <p className="text-slate-400 text-xs mt-1">Avg Engagement</p>
                        </div>
                        <div className="bg-[#1a1d35] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-white">{selected.totalStudents}</p>
                          <p className="text-slate-400 text-xs mt-1">Students</p>
                        </div>
                        <div className="bg-[#1a1d35] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-white">{selected.peakScore}%</p>
                          <p className="text-slate-400 text-xs mt-1">Peak Score</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-slate-400 text-xs mb-2">Engagement Level</p>
                        <div className="w-full bg-[#2d3155] rounded-full h-3">
                          <div className="h-3 rounded-full bg-indigo-500 transition-all duration-700"
                            style={{ width: `${selected.avgScore}%` }} />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadSessionPDF(selected)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors">
                      <Download size={18} /> Download PDF Report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">No sessions found</p>
                    ) : data.map((session, i) => (
                      <div key={i} className="bg-[#0f1123] rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                            <Calendar size={18} className="text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{session.name}</p>
                            <p className="text-slate-400 text-xs">{new Date(session.createdAt).toLocaleDateString()} · {session.totalStudents} students</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(session.status)}`}>{session.status}</span>
                          <span className="text-white font-bold text-sm">{session.avgScore}%</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelected(session)}
                              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs px-2 py-1 border border-[#2d3155] rounded-lg">
                              <Eye size={13} /> View
                            </button>
                            <button onClick={() => downloadSessionPDF(session)}
                              className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 text-xs px-2 py-1 border border-[#2d3155] rounded-lg">
                              <Download size={13} /> PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : modal === 'weekly' ? (
                <div className="space-y-3">
                  {data.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No weekly data found</p>
                  ) : data.map((week, i) => (
                    <div key={i} className="bg-[#0f1123] rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                          <TrendingUp size={18} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{week.weekLabel}</p>
                          <p className="text-slate-400 text-xs">{week.sessions} sessions · {week.totalStudents} students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{week.avgScore}%</p>
                          <p className="text-slate-400 text-xs">avg score</p>
                        </div>
                        <div className="w-24 bg-[#2d3155] rounded-full h-2">
                          <div className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${week.avgScore}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
