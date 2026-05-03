import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Sparkles } from 'lucide-react'
import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'teacher' })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null)
  const [error, setError] = useState('')
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register'
      const payload = tab === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name, role: form.role }
      const { data } = await axios.post(`${API}${endpoint}`, payload)
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(provider)
    setError('')
    try {
      // Open OAuth popup
      const clientId = provider === 'google' 
        ? import.meta.env.VITE_GOOGLE_CLIENT_ID
        : import.meta.env.VITE_MICROSOFT_CLIENT_ID
      
      if (!clientId) {
        setError(`${provider === 'google' ? 'Google' : 'Microsoft'} Client ID not configured. Please contact admin.`)
        setOauthLoading(null)
        return
      }
      
      const redirectUri = `${window.location.origin}/auth/callback`
      
      if (provider === 'google') {
        const scope = 'openid email profile'
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}&` +
          `redirect_uri=${redirectUri}&` +
          `response_type=code&` +
          `scope=${scope}`
        window.location.href = authUrl
      } else if (provider === 'microsoft') {
        const scope = 'openid email profile'
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${clientId}&` +
          `redirect_uri=${redirectUri}&` +
          `response_type=code&` +
          `scope=${scope}&` +
          `prompt=select_account`
        window.location.href = authUrl
      }
    } catch (err) {
      setError('OAuth login failed. Please try again.')
      setOauthLoading(null)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl p-6 sm:p-8 w-full max-w-md">
        
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-6 sm:mb-8">
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
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block'
          }} className="text-base sm:text-lg font-bold">ClassLens</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0f1123] rounded-xl p-1 mb-6 sm:mb-8">
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors capitalize
                ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {tab === 'register' && (
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="Full Name"
              className="w-full bg-[#0f1123] border border-[#2d3155] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          )}
          <input name="email" value={form.email} onChange={handleChange}
            placeholder="Email" type="email"
            className="w-full bg-[#0f1123] border border-[#2d3155] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          <input name="password" value={form.password} onChange={handleChange}
            placeholder="Password" type="password"
            className="w-full bg-[#0f1123] border border-[#2d3155] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500" />

          {/* Role Selector (register only) */}
          {tab === 'register' && (
            <div className="grid grid-cols-2 gap-3 pt-2 sm:pt-3">
              {['teacher', 'student'].map(r => (
                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                  className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium border transition-colors capitalize
                    ${form.role === r
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-[#0f1123] border-[#2d3155] text-slate-400 hover:border-indigo-500'}`}>
                  {r === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && <p className="text-red-400 text-xs sm:text-sm mt-3">{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading || oauthLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl mt-4 transition-colors text-sm sm:text-base">
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-6 sm:mt-8">
          <div className="flex-1 h-px bg-[#2d3155]"></div>
          <span className="text-slate-500 text-xs">Or continue with</span>
          <div className="flex-1 h-px bg-[#2d3155]"></div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => handleOAuthLogin('google')} disabled={oauthLoading}
            className="flex items-center justify-center gap-2 bg-[#0f1123] hover:bg-[#1a1d35] border border-[#2d3155] rounded-xl py-2.5 text-slate-300 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button onClick={() => handleOAuthLogin('microsoft')} disabled={oauthLoading}
            className="flex items-center justify-center gap-2 bg-[#0f1123] hover:bg-[#1a1d35] border border-[#2d3155] rounded-xl py-2.5 text-slate-300 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="12" y="1" width="11" height="9" fill="#7FBA00"/>
              <rect x="1" y="12" width="9" height="11" fill="#00A4EF"/>
              <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
            </svg>
            Microsoft
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs sm:text-sm mt-4">
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
            className="text-indigo-400 hover:underline">
            {tab === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}