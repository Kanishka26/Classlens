import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import { ArrowLeft, BarChart3, Users, TrendingUp, TrendingDown, Calendar, Download, Eye } from 'lucide-react'
import jsPDF from 'jspdf'

export default function SessionReportPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReport()
  }, [sessionId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('classlens_token')
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/session/${sessionId}/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch report')
      const data = await res.json()
      setReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    if (status === 'High') return 'bg-green-600/20 text-green-400 border-green-600/50'
    if (status === 'Medium') return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50'
    return 'bg-red-600/20 text-red-400 border-red-600/50'
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const generateEngagementAdvice = () => {
    const advice = []
    const { avgScore, status, perStudent } = report
    
    if (avgScore >= 80) {
      advice.push('✓ Excellent engagement level! The class is highly attentive and focused.')
      advice.push('• Maintain current teaching pace and interaction style.')
      advice.push('• Consider incorporating challenging content or discussions to deepen learning.')
    } else if (avgScore >= 60) {
      advice.push('• Moderate engagement - there is room for improvement.')
      advice.push('• Try incorporating more interactive activities or discussions.')
      advice.push('• Break content into smaller segments with periodic checks for understanding.')
      advice.push('• Use visual aids and varied teaching methods to maintain attention.')
    } else {
      advice.push('⚠ Low engagement - immediate action recommended.')
      advice.push('• Increase frequency of interactive questions and student participation.')
      advice.push('• Consider shorter lecture segments followed by activities.')
      advice.push('• Check for technical issues or environmental distractions.')
      advice.push('• Use ice-breakers and energizers to boost class energy.')
    }

    const lowEngagementStudents = perStudent.filter(s => s.avgScore < 50)
    if (lowEngagementStudents.length > 0) {
      advice.push(`• ${lowEngagementStudents.length} student(s) showing low engagement - consider individual follow-ups.`)
    }

    const highEngagementStudents = perStudent.filter(s => s.avgScore >= 80)
    if (highEngagementStudents.length > 0) {
      advice.push(`✓ ${highEngagementStudents.length} student(s) showing excellent engagement.`)
    }

    return advice
  }

  const downloadPDF = () => {
    if (!report) return
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPos = margin

    // Title
    doc.setFontSize(20)
    doc.text('Session Engagement Report', margin, yPos)
    yPos += 12

    // Session Info
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Session: ${report.sessionName}`, margin, yPos)
    yPos += 5
    doc.text(`Date: ${formatDate(report.createdAt)}`, margin, yPos)
    yPos += 5
    doc.text(`Total Students: ${report.totalStudents} | Total Records: ${report.totalRecords}`, margin, yPos)
    yPos += 10

    // Overall Metrics Box
    doc.setDrawColor(100, 150, 255)
    doc.setFillColor(230, 240, 255)
    doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 30, 'F')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text('Overall Session Metrics', margin + 3, yPos + 2)
    yPos += 8
    doc.setFontSize(10)
    doc.text(`Average Engagement: ${report.avgScore}% | Peak Score: ${report.peakScore}% | Low Score: ${report.lowScore}%`, margin + 3, yPos)
    yPos += 5
    doc.text(`Status: ${report.status} Engagement`, margin + 3, yPos)
    yPos += 15

    // Timeline Analysis
    if (yPos > 200) { doc.addPage(); yPos = margin }
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text('Engagement Timeline Analysis', margin, yPos)
    yPos += 8
    doc.setFontSize(9)

    if (report.timeline && report.timeline.length > 0) {
      const timelineSlice = report.timeline.slice(0, 8)
      timelineSlice.forEach((point, idx) => {
        if (yPos > pageHeight - 20) { doc.addPage(); yPos = margin }
        const time = new Date(point.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        doc.text(`${time} - Avg: ${point.avgScore}% | Max: ${point.maxScore}% | Events: ${point.recordCount}`, margin, yPos)
        yPos += 4
      })
    }
    yPos += 5

    // Participant Breakdown
    if (yPos > 200) { doc.addPage(); yPos = margin }
    doc.setFontSize(12)
    doc.text('Participant Performance', margin, yPos)
    yPos += 8
    doc.setFontSize(8)
    doc.setTextColor(50, 50, 50)

    // Header for table
    doc.text('Student Name', margin, yPos)
    doc.text('Avg Score', margin + 80, yPos)
    doc.text('Max', margin + 110, yPos)
    doc.text('Min', margin + 130, yPos)
    doc.text('Events', margin + 150, yPos)
    yPos += 5
    doc.setDrawColor(180, 180, 180)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 3

    doc.setTextColor(0, 0, 0)
    report.perStudent.forEach((student) => {
      if (yPos > pageHeight - 15) { doc.addPage(); yPos = margin }
      doc.text(student.name.substring(0, 20), margin, yPos)
      doc.text(`${student.avgScore}%`, margin + 80, yPos)
      doc.text(`${student.maxScore}%`, margin + 110, yPos)
      doc.text(`${student.minScore}%`, margin + 130, yPos)
      doc.text(`${student.participationCount}`, margin + 150, yPos)
      yPos += 4
    })

    // Recommendations
    if (yPos > 200) { doc.addPage(); yPos = margin }
    yPos += 5
    doc.setFontSize(12)
    doc.text('Recommendations for Improvement', margin, yPos)
    yPos += 8
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)

    const advice = generateEngagementAdvice()
    advice.forEach(rec => {
      if (yPos > pageHeight - 15) { doc.addPage(); yPos = margin }
      const wrappedText = doc.splitTextToSize(rec, pageWidth - 2 * margin - 5)
      doc.text(wrappedText, margin + 3, yPos)
      yPos += wrappedText.length * 4 + 2
    })

    doc.save(`session-report-${report.sessionId}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading report...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-6 text-red-400">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
            <ArrowLeft size={18} />
            Back
          </button>
          <p className="text-slate-400">No report data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4">
              <ArrowLeft size={18} />
              Back
            </button>
            <h1 className="text-3xl font-bold text-white">{report.sessionName}</h1>
            <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
              <Calendar size={16} />
              {formatDate(report.createdAt)}
            </p>
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold">
            <Download size={18} />
            Download PDF
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">Average Engagement</p>
            <p className="text-3xl font-bold text-indigo-400">{report.avgScore}%</p>
            <p className={`text-xs mt-2 px-2 py-1 rounded border w-fit ${getStatusColor(report.status)}`}>
              {report.status} Engagement
            </p>
          </div>

          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2 flex items-center gap-1">
              <TrendingUp size={16} className="text-green-400" />
              Peak Score
            </p>
            <p className="text-3xl font-bold text-green-400">{report.peakScore}%</p>
            <p className="text-xs text-slate-500 mt-2">{formatTime(report.peakPoint.time)}</p>
          </div>

          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2 flex items-center gap-1">
              <TrendingDown size={16} className="text-red-400" />
              Low Score
            </p>
            <p className="text-3xl font-bold text-red-400">{report.lowScore}%</p>
            <p className="text-xs text-slate-500 mt-2">{formatTime(report.lowPoint.time)}</p>
          </div>

          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2 flex items-center gap-1">
              <Users size={16} className="text-blue-400" />
              Total Students
            </p>
            <p className="text-3xl font-bold text-blue-400">{report.totalStudents}</p>
            <p className="text-xs text-slate-500 mt-2">{report.totalRecords} data points</p>
          </div>
        </div>

        {/* Timeline Analysis */}
        <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-400" />
            Timeline Analysis
          </h2>
          <div className="space-y-3">
            {report.timeline.slice(0, 8).map((point, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="text-xs text-slate-400 w-24">{formatTime(point.time)}</div>
                <div className="flex-1 bg-[#0f1123] rounded-full h-8 flex items-center" style={{
                  background: `linear-gradient(90deg, #3b82f6 0%, #3b82f6 ${point.avgScore}%, #0f1123 ${point.avgScore}%)`
                }}>
                  <span className="ml-2 text-xs text-white font-semibold">{point.avgScore}%</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{point.recordCount} records</p>
                  <p className="text-xs text-slate-500">Peak: {point.maxScore}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-Student Breakdown */}
        <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-indigo-400" />
            Per-Student Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2d3155]">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Student</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Avg Score</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Max Score</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Min Score</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Participation</th>
                </tr>
              </thead>
              <tbody>
                {report.perStudent.map((student) => (
                  <tr key={student.studentId} className="border-b border-[#2d3155] hover:bg-[#2d3155]/50">
                    <td className="py-3 px-4 text-white">{student.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold">
                        {student.avgScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-green-400 font-semibold">{student.maxScore}%</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-red-400 font-semibold">{student.minScore}%</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">
                      {student.participationCount} records
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
