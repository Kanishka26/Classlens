import { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Zap, LayoutDashboard, BookOpen, BarChart2, FileText, Settings, LogOut } from 'lucide-react'

const navLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Classrooms', path: '/classrooms', icon: <BookOpen size={16} /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChart2 size={16} /> },
  { label: 'Reports', path: '/reports', icon: <FileText size={16} /> },
]

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
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
        {navLinks.map(link => (
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
      <div className="flex items-center gap-3">
        <button className="text-slate-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm text-slate-300">{user?.name || 'User'}</span>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  )
}