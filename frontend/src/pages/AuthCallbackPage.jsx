import { useEffect, useState, useContext } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')

        if (errorParam) {
          setError(`OAuth error: ${errorParam}`)
          setLoading(false)
          return
        }

        if (!code) {
          setError('No authorization code received')
          setLoading(false)
          return
        }

        // Determine provider from state or path
        const provider = state?.split('_')[0] || 'google'
        const role = searchParams.get('role') || 'student'

        // Exchange code for token
        const response = await axios.post(`${API}/auth/oauth-callback`, {
          code,
          provider,
          redirectUri: window.location.origin + '/auth/callback'
        })

        if (response.data.token && response.data.user) {
          login(response.data.user, response.data.token)
          navigate('/dashboard')
        } else {
          setError('Authentication failed')
        }
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(err.response?.data?.error || 'Authentication failed')
      } finally {
        setLoading(false)
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, login])

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl p-6 sm:p-8 w-full max-w-md text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 border-r-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Processing authentication...</p>
          </>
        ) : error ? (
          <>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
              Back to Login
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
