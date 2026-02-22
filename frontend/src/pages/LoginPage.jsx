import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Zap } from 'lucide-react'
import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'teacher' })
  const [loading, setLoading] = useState(false)
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


  return (
    <div className="min-h-screen bg-[#0f1123] flex items-center justify-center p-4">
      <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl p-8 w-full max-w-md">
        
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-indigo-400">ClassLens</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0f1123] rounded-xl p-1 mb-6">
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
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
            <div className="grid grid-cols-2 gap-3 pt-1">
              {['teacher', 'student'].map(r => (
                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                  className={`py-3 rounded-xl text-sm font-medium border transition-colors capitalize
                    ${form.role === r
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-[#0f1123] border-[#2d3155] text-slate-400 hover:border-indigo-500'}`}>
                  {r === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl mt-4 transition-colors">
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-4">
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