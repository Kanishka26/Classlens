import Navbar from '../components/layout/Navbar'
import { Calendar, Users, TrendingUp, FileText, Download, Eye, Filter } from 'lucide-react'

const reportTypes = [
  { icon: <Calendar size={28} className="text-indigo-400" />, title: 'Session Report', desc: 'Detailed engagement metrics for each class session', color: 'bg-indigo-600/20' },
  { icon: <Users size={28} className="text-purple-400" />, title: 'Student Report', desc: 'Individual student engagement scores and status', color: 'bg-purple-600/20' },
  { icon: <TrendingUp size={28} className="text-blue-400" />, title: 'Weekly Summary', desc: 'Comprehensive weekly engagement analysis with insights', color: 'bg-blue-600/20' },
]

const recentReports = [
  { name: 'Weekly Report - Week 12', type: 'weekly', date: 'Feb 12, 2026', status: 'Ready' },
  { name: 'Mathematics 101 - Session', type: 'session', date: 'Feb 11, 2026', status: 'Ready' },
  { name: 'Student Performance - March', type: 'student', date: 'Feb 10, 2026', status: 'Ready' },
  { name: 'Physics Class 12B - Session', type: 'session', date: 'Feb 9, 2026', status: 'Ready' },
  { name: 'Weekly Report - Week 11', type: 'weekly', date: 'Feb 5, 2026', status: 'Ready' },
]

const typeBadge = (type) => {
  const styles = {
    weekly: 'bg-teal-600/20 text-teal-400',
    session: 'bg-indigo-600/20 text-indigo-400',
    student: 'bg-purple-600/20 text-purple-400',
  }
  return styles[type] || 'bg-gray-600/20 text-gray-400'
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText size={28} className="text-indigo-400" /> Reports
          </h1>
          <p className="text-slate-400 mt-1">Generate and download engagement reports.</p>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {reportTypes.map((report, i) => (
            <div key={i} className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-6">
              <div className={`w-14 h-14 ${report.color} rounded-xl flex items-center justify-center mb-4`}>
                {report.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{report.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{report.desc}</p>
              <button className="w-full flex items-center justify-center gap-2 border border-[#2d3155] hover:border-indigo-500 text-slate-300 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                <FileText size={15} /> Generate Report
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

          {/* Table */}
          <div className="w-full">
            {/* Header */}
            <div className="grid grid-cols-5 text-xs text-slate-500 uppercase tracking-wider pb-3 border-b border-[#2d3155] px-2">
              <span className="col-span-2">Report Name</span>
              <span>Type</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#2d3155]">
              {recentReports.map((report, i) => (
                <div key={i} className="grid grid-cols-5 items-center py-4 px-2 hover:bg-[#0f1123] rounded-lg transition-colors">
                  <div className="col-span-2 flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-slate-300 text-sm">{report.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full w-fit font-medium ${typeBadge(report.type)}`}>
                    {report.type}
                  </span>
                  <span className="text-slate-400 text-sm">{report.date}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full font-medium">
                      {report.status}
                    </span>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors">
                        <Eye size={14} /> View
                      </button>
                      <button className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 text-xs transition-colors">
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}