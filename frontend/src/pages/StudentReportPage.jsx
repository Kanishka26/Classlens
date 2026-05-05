import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Eye, TrendingUp, TrendingDown, Users, Award, ArrowLeft, Download } from 'lucide-react';
import jsPDF from 'jspdf';

export default function StudentReportPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/student/${studentId}/report`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to load report');
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [studentId]);

  const downloadPDF = () => {
    if (!report) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Title
    pdf.setFontSize(20);
    pdf.text('Student Engagement Report', margin, yPos);
    yPos += 12;

    // Student info
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Student: ${report.studentName}`, margin, yPos);
    yPos += 5;
    pdf.text(`Total Sessions: ${report.totalSessions} | Total Interactions: ${report.totalParticipationCount}`, margin, yPos);
    yPos += 10;

    // Key metrics box
    pdf.setDrawColor(100, 150, 255);
    pdf.setFillColor(230, 240, 255);
    pdf.rect(margin, yPos - 2, pageWidth - 2 * margin, 35, 'F');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text('Performance Overview', margin + 3, yPos + 2);
    yPos += 8;
    pdf.setFontSize(10);
    pdf.text(`Average Engagement: ${report.avgScore}% | Peak Score: ${report.peakScore}% | Low Score: ${report.lowScore}%`, margin + 3, yPos);
    yPos += 5;
    pdf.text(`Trend: ${report.trend} | Rank: #${report.performanceRanking.rank}/${report.performanceRanking.totalStudents} (${report.performanceRanking.percentile}th percentile)`, margin + 3, yPos);
    yPos += 20;

    // Timeline Analysis
    if (yPos > 200) { pdf.addPage(); yPos = margin }
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text('Engagement Timeline', margin, yPos);
    yPos += 8;
    pdf.setFontSize(8);

    if (report.timeline && report.timeline.length > 0) {
      const timelineSlice = report.timeline.slice(0, 10)
      timelineSlice.forEach(point => {
        if (yPos > pageHeight - 15) { pdf.addPage(); yPos = margin }
        const time = new Date(point.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        pdf.text(`${time} - Avg: ${point.avgScore}% | Max: ${point.maxScore}% | Events: ${point.recordCount}`, margin, yPos);
        yPos += 3;
      });
    }
    yPos += 5;

    // Session History
    if (yPos > 200) { pdf.addPage(); yPos = margin }
    pdf.setFontSize(12);
    pdf.text('Session History', margin, yPos);
    yPos += 7;
    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);

    // Header for table
    pdf.text('Session', margin, yPos);
    pdf.text('Date', margin + 70, yPos);
    pdf.text('Avg', margin + 110, yPos);
    pdf.text('Max', margin + 130, yPos);
    pdf.text('Min', margin + 150, yPos);
    yPos += 4;
    pdf.setDrawColor(180, 180, 180);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;

    pdf.setTextColor(0, 0, 0);
    report.perSession.forEach(session => {
      if (yPos > pageHeight - 15) { pdf.addPage(); yPos = margin }
      const sessionDate = new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      pdf.text(session.sessionName.substring(0, 18), margin, yPos);
      pdf.text(sessionDate, margin + 70, yPos);
      pdf.text(`${session.avgScore}%`, margin + 110, yPos);
      pdf.text(`${session.maxScore}%`, margin + 130, yPos);
      pdf.text(`${session.minScore}%`, margin + 150, yPos);
      yPos += 4;
    });

    // Recommendations
    if (yPos > 200) { pdf.addPage(); yPos = margin }
    yPos += 8;
    pdf.setFontSize(12);
    pdf.text('Recommendations for Improvement', margin, yPos);
    yPos += 8;
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);

    report.recommendations.forEach(rec => {
      if (yPos > pageHeight - 15) { pdf.addPage(); yPos = margin }
      const wrappedText = pdf.splitTextToSize(`→ ${rec}`, pageWidth - 2 * margin - 5);
      pdf.text(wrappedText, margin + 3, yPos);
      yPos += wrappedText.length * 4 + 2;
    });

    pdf.save(`${report.studentName}_Report.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1d35] flex items-center justify-center">
        <div className="text-indigo-400 text-lg">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#1a1d35] p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 font-medium">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="text-center text-red-400">{error || 'Failed to load report'}</div>
      </div>
    );
  }

  const getStatusColor = (score) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="text-green-400" size={24} />;
    if (trend === 'declining') return <TrendingDown className="text-red-400" size={24} />;
    return <div className="w-6 h-6 flex items-center justify-center text-slate-400">−</div>;
  };

  return (
    <div className="min-h-screen bg-[#1a1d35] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium">
              <ArrowLeft size={20} /> Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{report.studentName}</h1>
              <p className="text-slate-400 text-sm mt-1">Student Engagement Report</p>
            </div>
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            <Download size={18} /> Download PDF
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20">
            <p className="text-slate-400 text-sm mb-2">Average Engagement</p>
            <p className={`text-3xl font-bold ${report.avgScore >= 80 ? 'text-green-400' : report.avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {report.avgScore}%
            </p>
          </div>

          <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20">
            <p className="text-slate-400 text-sm mb-2">Peak Score</p>
            <p className="text-3xl font-bold text-green-400">{report.peakScore}%</p>
          </div>

          <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20">
            <p className="text-slate-400 text-sm mb-2">Sessions Attended</p>
            <p className="text-3xl font-bold text-indigo-400">{report.totalSessions}</p>
          </div>

          <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20">
            <p className="text-slate-400 text-sm mb-2">Total Interactions</p>
            <p className="text-3xl font-bold text-indigo-400">{report.totalParticipationCount}</p>
          </div>
        </div>

        {/* Trend and Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Engagement Trend</h3>
              {getTrendIcon(report.trend)}
            </div>
            <p className={`text-lg font-semibold capitalize ${
              report.trend === 'improving' ? 'text-green-400' : 
              report.trend === 'declining' ? 'text-red-400' : 
              'text-yellow-400'
            }`}>
              {report.trend.charAt(0).toUpperCase() + report.trend.slice(1)}
            </p>
            <p className="text-sm text-slate-400 mt-2">Comparing engagement across sessions</p>
          </div>

          <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Award className="text-indigo-400" size={24} />
              <h3 className="text-lg font-semibold text-white">Performance Ranking</h3>
            </div>
            <p className="text-2xl font-bold text-indigo-400">
              #{report.performanceRanking.rank} <span className="text-sm text-slate-400">of {report.performanceRanking.totalStudents}</span>
            </p>
            <p className="text-sm text-slate-400 mt-2">{report.performanceRanking.percentile}th percentile</p>
          </div>
        </div>

        {/* Timeline Analysis */}
        <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-6">Timeline Analysis</h3>
          <div className="space-y-4">
            {report.timeline.length > 0 ? (
              report.timeline.map((point, idx) => (
                <div key={idx} className="flex items-end gap-4">
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs text-slate-400">
                      {new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-8 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded"
                        style={{ width: `${(point.avgScore / 100) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">Avg: {point.avgScore}% | Max: {point.maxScore}% | Events: {point.recordCount}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No timeline data available</p>
            )}
          </div>
        </div>

        {/* Session History */}
        <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-6">Session History</h3>
          <div className="space-y-3">
            {report.perSession.length > 0 ? (
              report.perSession.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#1a1d35] rounded-lg">
                  <div>
                    <p className="font-medium text-white">{session.sessionName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(session.date).toLocaleDateString()} • {session.participationCount} interactions
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-semibold ${getStatusColor(session.avgScore)}`}>{session.avgScore}%</p>
                      <p className="text-xs text-slate-400">Avg Score</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-400">{session.maxScore}%</p>
                      <p className="text-xs text-slate-400">Max</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">{session.minScore}%</p>
                      <p className="text-xs text-slate-400">Min</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No session history available</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-[#2d3155] rounded-xl p-6 border border-indigo-500/20">
          <h3 className="text-lg font-semibold text-white mb-6">Recommendations for Improvement</h3>
          <div className="space-y-3">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-[#1a1d35] rounded-lg">
                <div className="text-indigo-400 mt-1">→</div>
                <p className="text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
