import { useContext, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { AuthContext } from '../context/AuthContext'
import { Settings, Bell, Lock, User, LogOut, Save, X } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [notifications, setNotifications] = useState({
    engagementAlerts: true,
    classroomUpdates: true,
    reportNotifications: true,
    emailNotifications: true,
  })
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      })

      if (!response.ok) throw new Error('Failed to update profile')
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      if (!response.ok) throw new Error('Failed to change password')
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/user/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notifications)
      })

      if (!response.ok) throw new Error('Failed to update notifications')
      setMessage({ type: 'success', text: 'Notification settings saved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update notifications' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Settings size={24} className="sm:w-8 sm:h-8 text-indigo-400" /> Settings
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">Manage your account and preferences.</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-3 sm:p-4 rounded-lg flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-green-600/20 border border-green-600/50'
              : 'bg-red-600/20 border border-red-600/50'
          }`}>
            <p className={`text-xs sm:text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
            <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-6 border-b border-[#2d3155]">
          {[
            { id: 'profile', label: 'Profile', icon: <User size={16} /> },
            { id: 'security', label: 'Security', icon: <Lock size={16} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Profile Information</h2>

            <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
              {/* Profile Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base">{user?.name}</p>
                  <p className="text-slate-400 text-xs sm:text-sm capitalize">{user?.role} Account</p>
                  <button className="text-indigo-400 hover:text-indigo-300 text-xs sm:text-sm mt-2">Change Avatar</button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleProfileChange}
                  className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Account Type</label>
                <div className="bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-slate-400 text-sm capitalize">
                  {user?.role}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors">
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Security Settings</h2>

            <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
              {/* Current Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleProfileChange}
                  placeholder="Enter your current password"
                  className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleProfileChange}
                  placeholder="Enter your new password"
                  className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleProfileChange}
                  placeholder="Confirm your new password"
                  className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-[#0f1123] rounded-lg p-3 sm:p-4">
                <p className="text-xs text-slate-400 mb-2">Password requirements:</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Minimum 6 characters</li>
                  <li>• Mix of uppercase and lowercase letters</li>
                  <li>• Include numbers or special characters</li>
                </ul>
              </div>
            </div>

            {/* Change Password Button */}
            <button
              onClick={handleChangePassword}
              disabled={loading || !formData.currentPassword || !formData.newPassword}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors">
              <Lock size={16} />
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Notification Preferences</h2>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {[
                { key: 'engagementAlerts', label: 'Engagement Alerts', desc: 'Get notified when students become disengaged' },
                { key: 'classroomUpdates', label: 'Classroom Updates', desc: 'Receive updates about your classrooms' },
                { key: 'reportNotifications', label: 'Report Notifications', desc: 'Get notified when reports are ready' },
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 sm:p-4 bg-[#0f1123] rounded-lg border border-[#2d3155]">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">{item.desc}</p>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => handleNotificationChange(item.key)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                      notifications[item.key] ? 'bg-indigo-600' : 'bg-[#2d3155]'
                    } peer-focus:outline peer-focus:outline-2 peer-focus:outline-indigo-500`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : ''
                      }`} />
                    </span>
                  </label>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveNotifications}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors">
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        )}

        {/* Logout Section */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[#2d3155]">
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-2">Logout</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-4">Sign out from your account on this device.</p>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
