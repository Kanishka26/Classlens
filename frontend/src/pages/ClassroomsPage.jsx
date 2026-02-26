import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { BookOpen, Users, Plus, Play, Trash2, Edit2, X, Loader, Copy, Check } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function ClassroomsPage() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  
  const [classrooms, setClassrooms] = useState([])
  const [enrolledClassrooms, setEnrolledClassrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showAddClassroomModal, setShowAddClassroomModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [inviteCode, setInviteCode] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState(null)
  const [error, setError] = useState('')
  const [copiedClassroomId, setCopiedClassroomId] = useState(null)

  // Fetch classrooms from backend
  useEffect(() => {
    fetchClassrooms()
  }, [])

  const fetchClassrooms = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('classlens_token')
      
      // Fetch available classrooms
      const response = await fetch(`${BACKEND_URL}/classrooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch classrooms')
      const { data } = await response.json()
      setClassrooms(data || [])
      
      // Fetch enrolled classrooms for students
      if (user?.role === 'student') {
        const enrolledResponse = await fetch(`${BACKEND_URL}/classrooms/enrolled/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (enrolledResponse.ok) {
          const { data: enrolled } = await enrolledResponse.json()
          setEnrolledClassrooms(enrolled || [])
        }
      }
      
      setError('')
    } catch (err) {
      console.error('❌ Error fetching classrooms:', err)
      setError('Failed to load classrooms')
    } finally {
      setLoading(false)
    }
  }

  const handleAddClass = async () => {
    if (!formData.name.trim()) {
      setError('Classroom name is required')
      return
    }

    try {
      setError('')
      const token = localStorage.getItem('classlens_token')
      console.log('🔐 Token:', token ? 'Present' : 'Missing')
      console.log('📝 Creating classroom:', formData)
      
      const response = await fetch(`${BACKEND_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description
        })
      })

      console.log('📡 Response status:', response.status)
      const responseData = await response.json()
      console.log('📦 Response data:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create classroom')
      }
      
      const { data } = responseData
      setClassrooms([data, ...classrooms])
      setFormData({ name: '', description: '' })
      setShowModal(false)
      setError('')
      console.log('✅ Classroom created successfully')
    } catch (err) {
      console.error('❌ Error creating classroom:', err)
      setError(err.message || 'Failed to create classroom')
    }
  }

  const handleStartMeeting = (classroom) => {
    setSelectedClassroom(classroom)
    setShowMeetingModal(true)
  }

  const confirmStartMeeting = () => {
    if (selectedClassroom) {
      navigate(`/meet/${selectedClassroom.id}`)
    }
  }

  const handleDeleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return

    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${BACKEND_URL}/classrooms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete classroom')
      
      setClassrooms(classrooms.filter(c => c.id !== id))
      setError('')
    } catch (err) {
      console.error('❌ Error deleting classroom:', err)
      setError('Failed to delete classroom')
    }
  }

  const handleLeaveClassroom = async (id) => {
    if (!confirm('Are you sure you want to leave this classroom?')) return

    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${BACKEND_URL}/classrooms/${id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to leave classroom')
      
      setEnrolledClassrooms(enrolledClassrooms.filter(c => c.id !== id))
      setError('')
    } catch (err) {
      console.error('❌ Error leaving classroom:', err)
      setError('Failed to leave classroom')
    }
  }

  const copyToClipboard = (classroomId, text) => {
    navigator.clipboard.writeText(text)
    setCopiedClassroomId(classroomId)
    setTimeout(() => setCopiedClassroomId(null), 2000)
  }

  const handleJoinWithInviteCode = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter the invite code')
      return
    }

    try {
      const token = localStorage.getItem('classlens_token')
      const response = await fetch(`${BACKEND_URL}/classrooms/${inviteCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to join classroom')
      }

      const { data } = await response.json()
      setEnrolledClassrooms([data, ...enrolledClassrooms])
      setInviteCode('')
      setShowAddClassroomModal(false)
      setError('')
    } catch (err) {
      console.error('❌ Error joining classroom with invite code:', err)
      setError(err.message || 'Failed to join classroom with this code')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1123]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader size={48} className="text-indigo-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400 text-sm sm:text-base">Loading your classrooms...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1123]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-600/50 rounded-lg px-3 sm:px-4 py-3 text-red-300 flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm">{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {user?.role === 'teacher' ? 'My Classrooms' : 'My Classrooms'}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              {user?.role === 'teacher' 
                ? 'Manage your classes and start live sessions'
                : 'Classrooms you are enrolled in'}
            </p>
          </div>
          {user?.role === 'teacher' ? (
            <button onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto">
              <Plus size={16} /> <span className="hidden xs:inline">New Classroom</span>
            </button>
          ) : (
            <button onClick={() => setShowAddClassroomModal(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto">
              <Plus size={16} /> <span className="hidden xs:inline">Add Classroom</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 md:mb-8">
          {user?.role === 'teacher' ? (
            <>
              <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-4 flex items-center gap-3">
                <div className="text-indigo-400"><BookOpen size={22} /></div>
                <div>
                  <p className="text-slate-400 text-sm">Total Classrooms</p>
                  <p className="text-2xl font-bold text-white">{classrooms.length}</p>
                </div>
              </div>
              <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-4 flex items-center gap-3">
                <div className="text-purple-400"><Users size={22} /></div>
                <div>
                  <p className="text-slate-400 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-white">{classrooms.reduce((a, c) => a + (c.students?.length || 0), 0)}</p>
                </div>
              </div>
              <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-4 flex items-center gap-3">
                <div className="text-blue-400"><Play size={22} /></div>
                <div>
                  <p className="text-slate-400 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-white">{classrooms.reduce((a, c) => a + (c.sessions || 0), 0)}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-4 flex items-center gap-3">
                <div className="text-indigo-400"><BookOpen size={22} /></div>
                <div>
                  <p className="text-slate-400 text-sm">Classes Enrolled</p>
                  <p className="text-2xl font-bold text-white">{enrolledClassrooms.length}</p>
                </div>
              </div>
              <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-4 flex items-center gap-3">
                <div className="text-green-400"><Plus size={22} /></div>
                <div>
                  <p className="text-slate-400 text-sm">Available to Join</p>
                  <p className="text-2xl font-bold text-white">{classrooms.filter(c => !enrolledClassrooms.some(e => e.id === c.id)).length}</p>
                </div>
              </div>
              <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-4 flex items-center gap-3">
                <div className="text-yellow-400"><Users size={22} /></div>
                <div>
                  <p className="text-slate-400 text-sm">Teachers</p>
                  <p className="text-2xl font-bold text-white">{new Set(classrooms.map(c => c.teacherId)).size}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* For Students: My Classes Section */}
        {user?.role === 'student' && (
          <>
            {enrolledClassrooms.length === 0 ? (
              <div className="bg-[#1a1d35] border border-[#2d3155] rounded-xl p-12 text-center">
                <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-4">No classrooms enrolled yet</p>
                <p className="text-slate-500 text-sm mb-6">Click "Add Classroom" above and enter the invite code your teacher provided.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledClassrooms.map(classroom => (
                  <div key={classroom.id} className="bg-[#1a1d35] border border-[#2d3155] rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors">
                    <div className={`${classroom.color} p-4 text-white`}>
                      <h3 className="font-bold text-lg">{classroom.name[0]}</h3>
                    </div>
                    <div className="p-4">
                      <h2 className="text-white font-semibold mb-1">{classroom.name}</h2>
                      <p className="text-slate-400 text-xs mb-2">by {classroom.teacherName}</p>
                      <p className="text-slate-400 text-sm mb-4">{classroom.description || 'No description'}</p>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/meet/${classroom.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                          <Play size={14} /> Join Class
                        </button>
                        <button onClick={() => handleLeaveClassroom(classroom.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg transition-colors text-sm font-medium">
                          <X size={14} /> Leave
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* For Teachers: My Classrooms Grid */}
        {user?.role === 'teacher' && (
          <>
            <h2 className="text-xl font-bold text-white mb-4">My Classrooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map(classroom => {
                const studentCount = Array.isArray(classroom.students) ? classroom.students.length : (classroom.students || 0)
                const sessionCount = classroom.sessions || 0
                
                return (
                <div key={classroom.id} className="bg-[#1a1d35] border border-[#2d3155] rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors">
                  {/* Header */}
                  <div className={`${classroom.color} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{classroom.name[0]}</h3>
                      <div className="flex gap-2">
                        <button className="p-1.5 hover:bg-black/20 rounded transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClass(classroom.id)}
                          className="p-1.5 hover:bg-black/20 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                {/* Content */}
                <div className="p-4">
                  <h2 className="text-white font-semibold mb-1">{classroom.name}</h2>
                  <p className="text-slate-400 text-sm mb-4">{classroom.description || 'No description'}</p>

                  {/* Invite Code Section */}
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-lg p-3 mb-4">
                    <p className="text-slate-400 text-xs mb-2">📤 Share This Invite Code</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-[#0f1123] border border-indigo-500/50 rounded px-2 py-1.5 text-indigo-400 font-mono text-xs break-all">
                        {classroom.id}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(classroom.id, classroom.id)}
                        className="p-1.5 hover:bg-indigo-600/30 rounded transition-colors text-indigo-400">
                        {copiedClassroomId === classroom.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-[#0f1123] rounded-lg p-3 text-center">
                      <p className="text-slate-500 text-xs mb-1">Students</p>
                      <p className="text-white font-bold">{studentCount}</p>
                    </div>
                    <div className="bg-[#0f1123] rounded-lg p-3 text-center">
                      <p className="text-slate-500 text-xs mb-1">Sessions</p>
                      <p className="text-white font-bold">{sessionCount}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <button onClick={() => handleStartMeeting(classroom)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                    <Play size={16} /> Start Meeting
                  </button>
                </div>
              </div>
              )
            })}
            </div>
          </>
        )}

        {classrooms.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {user?.role === 'teacher' ? 'No classrooms yet' : 'No available classrooms to join'}
            </p>
            {user?.role === 'teacher' && (
              <button onClick={() => setShowModal(true)}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                Create your first classroom →
              </button>
            )}
            {user?.role === 'student' && (
              <p className="mt-4 text-slate-500 text-sm">Ask your teachers to create classrooms for you to join.</p>
            )}
          </div>
        )}
      </div>

      {/* New Classroom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-0">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-white font-bold text-lg sm:text-xl">Create New Classroom</h2>
              <button onClick={() => { setShowModal(false); setFormData({ name: '', description: '' }); setError(''); }}
                className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/30 border border-red-600/50 rounded-lg px-3 py-2 text-red-300 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Classroom Name</label>
                <input type="text" placeholder="e.g., Physics - Class 12B"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea placeholder="e.g., Advanced Physics Course"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  rows="3" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
              <button onClick={() => { setShowModal(false); setFormData({ name: '', description: '' }); }}
                className="flex-1 px-4 py-2.5 sm:py-3 border border-[#2d3155] text-slate-300 rounded-lg hover:bg-[#0f1123] transition-colors text-sm font-medium order-2 sm:order-1">
                Cancel
              </button>
              <button onClick={handleAddClass}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium order-1 sm:order-2">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Classroom Modal (For Students) */}
      {showAddClassroomModal && user?.role === 'student' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-0">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-white font-bold text-lg sm:text-xl">Add Classroom</h2>
              <button onClick={() => { setShowAddClassroomModal(false); setInviteCode(''); setError(''); }}
                className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/30 border border-red-600/50 rounded-lg px-3 py-2 text-red-300 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div className="mb-6 sm:mb-8">
              <p className="text-slate-400 text-xs sm:text-sm mb-4">Enter the invite code your teacher provided to join a classroom.</p>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Invite Code</label>
              <input 
                type="text" 
                placeholder="Paste the invite code here"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => { setShowAddClassroomModal(false); setInviteCode(''); }}
                className="flex-1 px-4 py-2.5 sm:py-3 border border-[#2d3155] text-slate-300 rounded-lg hover:bg-[#0f1123] transition-colors text-sm font-medium order-2 sm:order-1">
                Cancel
              </button>
              <button onClick={handleJoinWithInviteCode}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium order-1 sm:order-2">
                Join Classroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Meeting Modal */}
      {showMeetingModal && selectedClassroom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-0">
          <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl w-full max-w-md p-6 sm:p-8">
            <h2 className="text-white font-bold text-lg sm:text-xl mb-2">Start Meeting</h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8">
              Start a live session for <span className="text-indigo-400 font-semibold">{selectedClassroom.name}</span>
            </p>

            <div className="bg-[#0f1123] rounded-lg p-4 sm:p-5 mb-6 sm:mb-8">
              <p className="text-slate-400 text-xs sm:text-sm mb-3">Classroom Details:</p>
              <p className="text-white font-medium text-sm">{selectedClassroom.name}</p>
              <p className="text-slate-500 text-xs mt-2">{selectedClassroom.students} students enrolled</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowMeetingModal(false)}
                className="flex-1 px-4 py-2.5 sm:py-3 border border-[#2d3155] text-slate-300 rounded-lg hover:bg-[#0f1123] transition-colors text-sm font-medium order-2 sm:order-1">
                Cancel
              </button>
              <button onClick={confirmStartMeeting}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium order-1 sm:order-2">
                Start Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

