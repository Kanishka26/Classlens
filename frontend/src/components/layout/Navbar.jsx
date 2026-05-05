import { Sparkles, LayoutDashboard, BookOpen, BarChart2, FileText, Settings, LogOut, ChevronDown, Clock, Menu, X, Moon, Sun } from 'lucide-react'
import { useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'


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
  const { theme, toggleTheme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
    setShowMobileMenu(false)
    navigate('/login')
  }

  const handleNavClick = (path) => {
    navigate(path)
    setShowMobileMenu(false)
  }

  return (
    <>
      <nav className="bg-[#1a1d35] border-b border-[#2d3155] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#f43f5e', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M4 16 Q8 8, 16 8 Q24 8, 28 16" stroke="url(#grad1)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M6 20 Q10 14, 16 14 Q22 14, 26 20" stroke="url(#grad1)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
            <path d="M8 24 Q12 20, 16 20 Q20 20, 24 24" stroke="url(#grad1)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span style={{
            background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block'
          }} className="text-lg sm:text-xl font-bold">ClassLens</span>
        </div>

        {/* Nav Links - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {getNavLinks(user?.role).map(link => (
            <button key={link.path} onClick={() => handleNavClick(link.path)}
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
        <div className="flex items-center gap-2 sm:gap-3 relative">
          <button onClick={toggleTheme} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#2d3155]" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button onClick={() => handleNavClick('/settings')} className="hidden sm:block text-slate-400 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
          
          {/* User Dropdown */}
          <button onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[#2d3155] transition-colors">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm text-slate-300 font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'user'}</p>
            </div>
            <ChevronDown size={16} className={`hidden sm:block text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile Menu Button */}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-slate-400 hover:text-white">
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
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

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-[#1a1d35] border-b border-[#2d3155] px-4 py-3 space-y-2">
          {getNavLinks(user?.role).map(link => (
            <button key={link.path} onClick={() => handleNavClick(link.path)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                ${location.pathname === link.path
                  ? 'bg-[#2d3155] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#2d3155]'}`}>
              {link.icon}
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#2d3155] mt-2">
            <button onClick={() => handleNavClick('/settings')} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-white hover:bg-[#2d3155]">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      )}
    </>
  )
}