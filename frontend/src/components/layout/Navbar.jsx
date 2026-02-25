import { Zap, LayoutDashboard, BookOpen, BarChart2, FileText, Settings, LogOut, ChevronDown, Clock } from 'lucide-react'
import { useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'


const getNavLinks = (role) => {
  const baseLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'Classrooms', path: '/classrooms', icon: <BookOpen size={16} /> },
  ]
  
  // Only teachers see analytics and reports
if (role === 'teacher') {
    baseLinks.push(
      { label: 'Analytics', path: '/analytics', icon: <BarChart2 size={16} /> },
      { label: 'Reports', path: '/reports', icon: <FileText size={16} /> }
    )
  }
  if (role === 'student') {
    baseLinks.push(
      { label: 'History', path: '/history', icon: <Clock size={16} /> }
    )
  }
  
  return baseLinks
}
export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
    navigate('/login')
  }

  return (
    <nav className="bg-[#1a1d35] border-b border-[#2d3155] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold text-indigo-400">ClassLens</span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {getNavLinks(user?.role).map(link => (
          <button key={link.path} onClick={() => navigate(link.path)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${location.pathname === link.path
                ? 'bg-[#2d3155] text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#2d3155]'}`}>
            {link.icon}
            {link.label}
          </button>
        ))}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 relative">
        <button className="text-slate-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
        
        {/* User Dropdown */}
        <button onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2d3155] transition-colors">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm text-slate-300 font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'user'}</p>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1d35] border border-[#2d3155] rounded-xl shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-[#2d3155]">
              <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 capitalize mt-1">{user?.role || 'user'} Account</p>
              <p className="text-xs text-slate-500 mt-2">{user?.email || 'No email'}</p>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-600/20 transition-colors text-sm font-medium">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}