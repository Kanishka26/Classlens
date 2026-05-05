import { useContext, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { AuthContext } from '../context/AuthContext'
import { Settings, Bell, Lock, User, LogOut, Save, X, Upload, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout, updateUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [uploadingPicture, setUploadingPicture] = useState(false)

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click()
  }

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' })
      return
    }

    setUploadingPicture(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64String = event.target.result
        
        // Update profile with picture
        const token = localStorage.getItem('classlens_token')
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            profilePicture: base64String
          })
        })

        if (!response.ok) throw new Error('Failed to upload profile picture')
        
        // Update AuthContext with new profile picture
        updateUser({ profilePicture: base64String })
        
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload profile picture' })
    } finally {
      setUploadingPicture(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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
      
      // Update AuthContext with new user data
      updateUser({ name: formData.name, email: formData.email })
      
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

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Password is required to delete account' })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/user/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: deletePassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }

      setMessage({ type: 'success', text: 'Account deleted successfully. Redirecting...' })
      setTimeout(() => {
        logout()
        navigate('/')
      }, 2000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete account' })
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
      setDeletePassword('')
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen">
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
                <div
                  onClick={handleProfilePictureClick}
                  className="w-16 sm:w-20 h-16 sm:h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 cursor-pointer hover:bg-indigo-700 transition-colors overflow-hidden"
                >
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base">{user?.name}</p>
                  <p className="text-slate-400 text-xs sm:text-sm capitalize">{user?.role} Account</p>
                  <button
                    onClick={handleProfilePictureClick}
                    disabled={uploadingPicture}
                    className="text-indigo-400 hover:text-indigo-300 text-xs sm:text-sm mt-2 flex items-center gap-1 disabled:opacity-50">
                    <Upload size={14} />
                    {uploadingPicture ? 'Uploading...' : 'Change Picture'}
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
                disabled={uploadingPicture}
              />

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

            {/* Delete Account Section */}
            <div className="mt-8 pt-6 border-t border-[#2d3155]">
              <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors">
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Delete Account?</h2>
            <p className="text-slate-400 text-sm mb-4">
              This action is permanent and cannot be undone. All your data, classrooms, and sessions will be deleted.
            </p>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Enter your password to confirm</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletePassword('')
                }}
                className="flex-1 px-4 py-2.5 bg-[#2d3155] hover:bg-[#3d4175] text-white rounded-lg font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || !deletePassword}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
