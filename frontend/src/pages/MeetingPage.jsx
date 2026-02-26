import { useEffect, useRef, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { io } from 'socket.io-client'
import { AuthContext } from '../context/AuthContext'
import StudentTile from '../components/meeting/StudentTile'
import AIMonitorPanel from '../components/meeting/AIMonitorPanel'
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, Activity, MessageCircle, Send, X } from 'lucide-react'

const APP_ID = import.meta.env.VITE_AGORA_APP_ID

export default function MeetingPage() {
  const { sessionId } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [showParticipants, setShowParticipants] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState([])
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null })
  const [isMuted, setIsMuted] = useState(false)
  const [socketParticipants, setSocketParticipants] = useState([])
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [joined, setJoined] = useState(false)
  const [engagementMap, setEngagementMap] = useState({})
  const [alerts, setAlerts] = useState([])
  const [studentNames, setStudentNames] = useState({})
  const [agoraUid, setAgoraUid] = useState(null)
  const [videoOffUsers, setVideoOffUsers] = useState(new Set())
  const [chatMessages, setChatMessages] = useState([])
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [sessionName, setSessionName] = useState('Meeting')

  const chatEndRef = useRef(null)
  const clientRef = useRef(null)
  const screenTrackRef = useRef(null)
  const localVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const analysisRef = useRef(null)
  const socketRef = useRef(null)
  const agoraUidRef = useRef(null)
  const localTracksRef = useRef({ audio: null, video: null })

  const isTeacher = user?.role === 'teacher'

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('classlens_token')
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/session/${sessionId}/report`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.session?.name) setSessionName(data.session.name)
      } catch (err) {}
    }
    fetchSession()
  }, [sessionId])

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 5000, reconnectionAttempts: 5
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_session', { sessionId, role: user?.role, name: user?.name })
    })

    socket.on('existing_participants', ({ participants }) => {
      setSocketParticipants(participants)
      setStudentNames(prev => {
        const updated = { ...prev }
        participants.forEach(p => { updated[p.agoraUid] = p.name })
        return updated
      })
    })

    socket.on('participant_agora_uid', ({ agoraUid, name, role }) => {
      setSocketParticipants(prev => {
        if (prev.find(p => p.agoraUid === agoraUid)) return prev
        return [...prev, { agoraUid, name, role }]
      })
      setStudentNames(prev => ({ ...prev, [agoraUid]: name }))
    })

    socket.on('participant_left', ({ agoraUid }) => {
      setSocketParticipants(prev => prev.filter(p => p.agoraUid !== agoraUid))
      setRemoteUsers(prev => prev.filter(u => u.uid !== agoraUid))
      setVideoOffUsers(prev => { const next = new Set(prev); next.delete(agoraUid); return next })
      setEngagementMap(prev => { const n = { ...prev }; delete n[agoraUid]; return n })
    })

    socket.on('chat_message', ({ senderName, message, timestamp }) => {
      setChatMessages(prev => [...prev, { senderName, message, timestamp }])
    })

    socket.on('engagement_update', ({ agoraUid, studentName, score }) => {
      setEngagementMap(prev => ({ ...prev, [agoraUid]: score }))
      setStudentNames(prev => ({ ...prev, [agoraUid]: studentName }))
      if (score < 40) {
        const alertId = Date.now()
        setAlerts(prev => [...prev.slice(-2), { id: alertId, studentName, score }])
        setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== alertId)), 5000)
      }
    })

    client.on('user-published', async (remoteUser, mediaType) => {
      await client.subscribe(remoteUser, mediaType)
      if (mediaType === 'video') {
        setRemoteUsers(prev => prev.find(u => u.uid === remoteUser.uid) ? prev : [...prev, remoteUser])
        setVideoOffUsers(prev => { const next = new Set(prev); next.delete(remoteUser.uid); return next })
      }
      if (mediaType === 'audio') {
        remoteUser.audioTrack?.play()
        setRemoteUsers(prev => prev.find(u => u.uid === remoteUser.uid) ? prev : [...prev, remoteUser])
      }
    })

    client.on('user-unpublished', (remoteUser, mediaType) => {
      if (mediaType === 'video') {
        setVideoOffUsers(prev => new Set([...prev, remoteUser.uid]))
        setEngagementMap(prev => ({ ...prev, [remoteUser.uid]: 0 }))
      }
    })

    client.on('user-left', (remoteUser) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid))
      setVideoOffUsers(prev => { const next = new Set(prev); next.delete(remoteUser.uid); return next })
      setEngagementMap(prev => { const n = { ...prev }; delete n[remoteUser.uid]; return n })
    })

    joinChannel(client)
    return () => { socket.disconnect(); leaveChannel() }
  }, [])

  const joinChannel = async (client) => {
    try {
      const uid = await client.join(APP_ID, sessionId, null, null)
      agoraUidRef.current = uid
      setAgoraUid(uid)
      if (socketRef.current) {
        socketRef.current.emit('send_agora_uid', { sessionId, agoraUid: uid, name: user?.name, role: user?.role })
      }
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      setLocalTracks({ audio: audioTrack, video: videoTrack })
      localTracksRef.current = { audio: audioTrack, video: videoTrack }
      await client.publish([audioTrack, videoTrack])
      setTimeout(() => { if (localVideoRef.current) videoTrack.play(localVideoRef.current) }, 500)
      setJoined(true)
      if (!isTeacher) startEngagementAnalysis(videoTrack)
    } catch (err) {
      console.error('Failed to join:', err)
      setJoined(true)
    }
  }

  const leaveChannel = async () => {
    clearInterval(analysisRef.current)
    localTracksRef.current.audio?.close()
    localTracksRef.current.video?.close()
    screenTrackRef.current?.close()
    await clientRef.current?.leave()
  }

  const startEngagementAnalysis = (videoTrack) => {
    clearInterval(analysisRef.current)
    analysisRef.current = setInterval(async () => {
      try {
        const canvas = canvasRef.current
        if (!canvas) return
        const mediaStreamTrack = videoTrack.getMediaStreamTrack()
        const imageCapture = new ImageCapture(mediaStreamTrack)
        const bitmap = await imageCapture.grabFrame()
        canvas.width = 320; canvas.height = 240
        canvas.getContext('2d').drawImage(bitmap, 0, 0, 320, 240)
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
        const response = await fetch(`${import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000'}/analyze`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
        const result = await response.json()
        setEngagementMap(prev => ({ ...prev, [agoraUidRef.current]: result.score }))
        const token = localStorage.getItem('classlens_token')
        await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/engagement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ sessionId, score: result.score, agoraUid: agoraUidRef.current, details: result.details })
        })
      } catch (err) { console.error('❌ Engagement error:', err) }
    }, 2000)
  }

  const toggleMute = () => {
    localTracksRef.current.audio?.setEnabled(isMuted)
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    const turningOff = !isVideoOff
    localTracksRef.current.video?.setEnabled(!turningOff)
    setIsVideoOff(turningOff)
    if (!isTeacher) {
      if (turningOff) {
        clearInterval(analysisRef.current)
        setEngagementMap(prev => ({ ...prev, [agoraUidRef.current]: 0 }))
        const token = localStorage.getItem('classlens_token')
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/engagement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ sessionId, score: 0, agoraUid: agoraUidRef.current, details: {} })
        })
      } else {
        startEngagementAnalysis(localTracksRef.current.video)
      }
    }
  }

  const toggleScreenShare = async () => {
    if (!isSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack()
        screenTrackRef.current = screenTrack
        await clientRef.current.unpublish(localTracksRef.current.video)
        await clientRef.current.publish(screenTrack)
        setIsSharing(true)
      } catch (err) { console.error(err) }
    } else {
      screenTrackRef.current?.close()
      await clientRef.current.unpublish(screenTrackRef.current)
      await clientRef.current.publish(localTracksRef.current.video)
      setIsSharing(false)
    }
  }

  const handleLeave = async () => {
    await leaveChannel()
    navigate('/dashboard')
  }

  const sendChatMessage = () => {
    if (!chatInput.trim() || !socketRef.current?.connected) return
    socketRef.current.emit('send_chat', {
      sessionId, senderName: user?.name || 'You', message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
    setChatInput('')
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const realParticipants = socketParticipants
    .filter(p => p.agoraUid !== agoraUidRef.current)
    .map(p => ({ uid: p.agoraUid, name: studentNames[p.agoraUid] || p.name || `Student ${String(p.agoraUid).slice(0, 6)}` }))

  const totalTiles = socketParticipants.length || 1
  const gridCols = totalTiles === 1 ? 'grid-cols-1' :
    totalTiles === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    totalTiles === 3 ? 'grid-cols-1 sm:grid-cols-3' :
    totalTiles === 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' :
    totalTiles <= 6 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'

  if (!joined) {
    return (
      <div className="min-h-screen bg-[#0f1123] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white text-sm">Joining session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0f1123] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-[#1a1d35] border-b border-[#2d3155] px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-white font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-xs md:max-w-sm">{sessionName}</h1>
          <div className="flex items-center gap-1 bg-red-600/20 border border-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-full shrink-0">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs sm:text-sm transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-[#2d3155]">
            <Users size={15} />
            <span className="hidden sm:inline">{socketParticipants.length} participants</span>
            <span className="sm:hidden">{socketParticipants.length}</span>
          </button>

          {showParticipants && (
            <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-[#1a1d35] border border-[#2d3155] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2d3155] flex items-center justify-between">
                <p className="text-white text-sm font-semibold">Participants ({socketParticipants.length})</p>
                <button onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#0f1123] border-b border-[#2d3155]">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user?.name} <span className="text-slate-500 text-xs">(You)</span></p>
                    <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
                  </div>
                </div>
                {realParticipants.map((p, i) => {
                  const pd = socketParticipants.find(sp => sp.agoraUid === p.uid)
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#0f1123] border-b border-[#2d3155]">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{p.name}</p>
                        <p className="text-slate-400 text-xs capitalize">{pd?.role || 'student'}</p>
                      </div>
                    </div>
                  )
                })}
                {realParticipants.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-4">No other participants yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video Grid */}
        <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
          {isTeacher && alerts.length > 0 && (
            <div className="mb-3 space-y-1">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-orange-900/50 border border-orange-600/50 rounded-lg px-3 py-2 text-xs sm:text-sm text-orange-200 flex items-start gap-2">
                  ⚠️ <span><strong>{alert.studentName}</strong> dropped to {alert.score}% — consider re-engaging!</span>
                </div>
              ))}
            </div>
          )}

          <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
            <StudentTile
              label={`${user?.name || 'You'} (${isTeacher ? 'Teacher' : 'You'})`}
              videoRef={localVideoRef}
              score={isTeacher ? undefined : engagementMap[agoraUid]}
              isLocal
              isVideoOff={isVideoOff}
            />
            {socketParticipants
              .filter(p => p.agoraUid !== agoraUidRef.current)
              .map(p => {
                const agoraUser = remoteUsers.find(u => u.uid === p.agoraUid)
                const isOff = !agoraUser || videoOffUsers.has(p.agoraUid)
                return (
                  <StudentTile
                    key={p.agoraUid}
                    remoteUser={agoraUser}
                    label={p.name || `Student ${String(p.agoraUid).slice(0, 6)}`}
                    score={isOff ? 0 : engagementMap[p.agoraUid]}
                    isVideoOff={isOff}
                  />
                )
              })}
          </div>
        </div>

        {/* AI Monitor Panel — teacher only, desktop */}
        {isTeacher && showPanel && !showChat && (
          <div className="hidden sm:block w-72 shrink-0">
            <AIMonitorPanel
              engagementMap={engagementMap}
              participants={realParticipants}
              onClose={() => setShowPanel(false)}
            />
          </div>
        )}

        {/* Chat Panel — full screen on mobile, sidebar on desktop */}
        {showChat && (
          <div className="fixed inset-0 z-40 sm:relative sm:inset-auto sm:w-72 md:w-80 bg-[#1a1d35] sm:border-l border-[#2d3155] flex flex-col overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-[#2d3155] flex items-center justify-between shrink-0">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <MessageCircle size={16} className="text-indigo-400" /> Chat
              </h2>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#2d3155]">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No messages yet</p>
                </div>
              ) : chatMessages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {msg.senderName[0]?.toUpperCase()}
                    </div>
                    <span className="text-white text-xs font-semibold truncate">{msg.senderName}</span>
                    <span className="text-slate-500 text-xs shrink-0">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-sm ml-8 break-words">{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 sm:p-4 border-t border-[#2d3155] flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                className="flex-1 bg-[#0f1123] border border-[#2d3155] rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-w-0"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white rounded-lg transition-colors shrink-0">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls Bar */}
      <div className="bg-[#1a1d35] border-t border-[#2d3155] px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto shrink-0">
        <ControlBtn onClick={toggleMute} active={isMuted}
          icon={isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          label={isMuted ? 'Unmute' : 'Mute'} />
        <ControlBtn onClick={toggleVideo} active={isVideoOff}
          icon={isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
          label={isVideoOff ? 'Start Cam' : 'Stop Cam'} />
        {isTeacher && (
          <ControlBtn onClick={toggleScreenShare} active={isSharing}
            icon={<Monitor size={16} />}
            label={isSharing ? 'Stop' : 'Share'}
            color="blue" />
        )}
        {isTeacher && (
          <ControlBtn onClick={() => setShowPanel(!showPanel)} active={showPanel}
            icon={<Activity size={16} />} label="Engage" color="indigo" />
        )}
        <ControlBtn onClick={() => setShowChat(!showChat)} active={showChat}
          icon={<MessageCircle size={16} />} label="Chat" color="indigo" />
        <ControlBtn onClick={handleLeave}
          icon={<PhoneOff size={16} />} label="Leave" color="red" />
      </div>
    </div>
  )
}

function ControlBtn({ onClick, active, icon, label, color }) {
  const colors = {
    red: 'bg-red-600 hover:bg-red-700 text-white',
    blue: active ? 'bg-blue-500 text-white' : 'bg-[#2d3155] hover:bg-[#3d4165] text-white',
    indigo: active ? 'bg-indigo-600 text-white' : 'bg-[#2d3155] hover:bg-[#3d4165] text-white',
    default: active ? 'bg-orange-600 text-white' : 'bg-[#2d3155] hover:bg-[#3d4165] text-white',
  }
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-medium transition-colors ${colors[color] || colors.default}`}>
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  )
}