import { useEffect, useRef, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { io } from 'socket.io-client'
import { AuthContext } from '../context/AuthContext'
import StudentTile from '../components/meeting/StudentTile'
import AIMonitorPanel from '../components/meeting/AIMonitorPanel'
import WaitingRoom from '../components/meeting/WaitingRoom'
import WaitingRoomControls from '../components/meeting/WaitingRoomControls'
import { Mic, MicOff, Camera, CameraOff, Monitor, PhoneOff, Users, Activity, MessageCircle, Send, X } from 'lucide-react'

const APP_ID = import.meta.env.VITE_AGORA_APP_ID

export default function MeetingPage() {
  const { sessionId } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  
  // Define isTeacher early (before useState that uses it)
  const isTeacher = user?.role === 'teacher'

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
  const [channelName, setChannelName] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [screenShareUid, setScreenShareUid] = useState(null)
  
  // Waiting Room states
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(!isTeacher)
  const [waitingRoomData, setWaitingRoomData] = useState(null)
  const [waitingParticipants, setWaitingParticipants] = useState([])
  const [admissionDenied, setAdmissionDenied] = useState(false)

  const chatEndRef = useRef(null)
  const clientRef = useRef(null)
  const screenTrackRef = useRef(null)
  const localVideoRef = useRef(null)
  const screenVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const analysisRef = useRef(null)
  const socketRef = useRef(null)
  const agoraUidRef = useRef(null)
  const localTracksRef = useRef({ audio: null, video: null })

  // Fetch session details to get the correct Agora channelName
  useEffect(() => {
    let timeoutId;
    let retryCount = 0;
    const maxRetries = 5;
    
    const fetchSessionDetails = async () => {
      try {
        const token = localStorage.getItem('classlens_token')
        console.log('📡 Fetching session details for:', sessionId, '(Attempt', retryCount + 1, 'of', maxRetries + 1, ')')
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
        const url = `${backendUrl}/session/${sessionId}/details`
        console.log('🔗 URL:', url)
        
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        console.log('📊 Response status:', res.status, res.statusText)
        
        if (res.ok) {
          const session = await res.json()
          console.log('✅ Session details fetched:', session)
          setChannelName(session.channelName)
          setSessionName(session.name || 'Meeting')
          setLoadingSession(false)
        } else if (res.status === 404 && retryCount < maxRetries) {
          // Retry if 404 - session might not be indexed yet
          retryCount++
          console.warn('⚠️ Session not found (404), retrying...', retryCount, '/', maxRetries)
          setTimeout(fetchSessionDetails, 1000)
        } else {
          console.error('❌ Failed to fetch session details:', res.status, res.statusText)
          alert('Failed to fetch session details: ' + res.status + ' ' + res.statusText)
          setLoadingSession(false)
        }
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++
          console.warn('⚠️ Error fetching session, retrying...', err.message)
          setTimeout(fetchSessionDetails, 2000)
        } else {
          console.error('❌ Error fetching session details:', err)
          alert('Error fetching session: ' + err.message)
          setLoadingSession(false)
        }
      }
    }
    
    console.log('🚀 Starting session details fetch for sessionId:', sessionId)
    fetchSessionDetails()
    
    // Safety timeout - if session details don't load in 30 seconds, show error
    timeoutId = setTimeout(() => {
      if (loadingSession) {
        console.error('⏱️ Session details fetch timeout after', maxRetries, 'retries')
        setLoadingSession(false)
        alert('Session is taking too long to load. Please refresh and try again.')
      }
    }, 30000)
    
    return () => clearTimeout(timeoutId)
  }, [sessionId, loadingSession])

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 5000, reconnectionAttempts: 5
    })
    socketRef.current = socket

    socket.on('connect', () => {
      if (isTeacher) {
        // Teachers join directly
        socket.emit('join_session', { sessionId, userId: user?.id, role: user?.role, name: user?.name })
        setIsInWaitingRoom(false)
      } else {
        // Students request to join (waiting room)
        const isMicOn = waitingRoomData?.isMicOn ?? true
        const isCameraOn = waitingRoomData?.isCameraOn ?? true
        socket.emit('request_join_session', { 
          sessionId, 
          userId: user?.id, 
          role: user?.role, 
          name: user?.name,
          isMicOn,
          isCameraOn
        })
      }
    })

    socket.on('existing_participants', ({ participants }) => {
      setSocketParticipants(prev => {
        // Merge: keep any participants not in the existing list, then add existing ones
        const existingNames = new Set(participants.map(p => `${p.name}-${p.role}`))
        const filtered = prev.filter(p => !existingNames.has(`${p.name}-${p.role}`))
        return [...filtered, ...participants]
      })
      setStudentNames(prev => {
        const updated = { ...prev }
        participants.forEach(p => { updated[p.agoraUid] = p.name })
        return updated
      })
    })

    socket.on('participant_agora_uid', ({ agoraUid, name, role }) => {
      setSocketParticipants(prev => {
        // Remove any stale entry with same name+role but different agoraUid (handles reloads)
        const filtered = prev.filter(p => !(p.name === name && p.role === role && p.agoraUid !== agoraUid))
        // Add new entry if not already there
        if (filtered.find(p => p.agoraUid === agoraUid)) return filtered
        return [...filtered, { agoraUid, name, role }]
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

    socket.on('screen_share_started', ({ agoraUid }) => {
      console.log('📺 Screen share started by:', agoraUid)
      setScreenShareUid(agoraUid)
    })

    socket.on('screen_share_stopped', ({ agoraUid }) => {
      console.log('📺 Screen share stopped by:', agoraUid)
      setScreenShareUid(null)
    })

    // Waiting room listeners
    socket.on('waiting_participants_update', ({ waitingParticipants }) => {
      console.log('📋 Updated waiting participants:', waitingParticipants)
      setWaitingParticipants(waitingParticipants)
    })

    socket.on('participant_admitted', ({ socketId, name }) => {
      console.log(`✅ You have been admitted to the meeting! Welcome ${name}`)
      setIsInWaitingRoom(false)
      // Now emit join_session to be added to active participants
      socket.emit('join_session', { 
        sessionId, 
        userId: user?.id, 
        role: user?.role, 
        name: user?.name 
      })
    })

    socket.on('participant_denied', ({ reason }) => {
      console.log('❌ Your request to join was denied:', reason)
      setAdmissionDenied(true)
      setTimeout(() => {
        alert('Your request to join this meeting was denied by the host.')
        navigate('/classrooms')
      }, 1000)
    })

    client.on('user-published', async (remoteUser, mediaType) => {
      try {
        await client.subscribe(remoteUser, mediaType)
        console.log(`✅ Subscribed to ${mediaType} from user:`, remoteUser.uid)
        
        if (mediaType === 'video') {
          // Add user to state first
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === remoteUser.uid)
            return exists ? prev : [...prev, remoteUser]
          })
          setVideoOffUsers(prev => { const next = new Set(prev); next.delete(remoteUser.uid); return next })
          
          // Small delay to ensure the track is properly attached after subscription
          setTimeout(() => {
            if (remoteUser.videoTrack) {
              console.log(`▶️ Playing video track for user:`, remoteUser.uid)
              // Force a state update to trigger StudentTile rerender
              setRemoteUsers(prev => [...prev.filter(u => u.uid !== remoteUser.uid), remoteUser])
            }
          }, 100)
        }
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play()
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === remoteUser.uid)
            return exists ? prev : [...prev, remoteUser]
          })
        }
      } catch (err) {
        console.error(`❌ Failed to subscribe to ${mediaType}:`, err)
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
      // Also remove from socketParticipants when user leaves Agora (as a fallback)
      setSocketParticipants(prev => prev.filter(p => p.agoraUid !== remoteUser.uid))
    })

    return () => { 
      socket.emit('leave_session', { sessionId })
      socket.disconnect()
      leaveChannel() 
    }
  }, [sessionId])

  // Join Agora channel once we have the correct channelName (but only if NOT in waiting room)
  useEffect(() => {
    if (channelName && clientRef.current && !isInWaitingRoom) {
      console.log('🔌 Starting to join Agora channel:', channelName)
      joinChannel(clientRef.current)
    }
  }, [channelName, isInWaitingRoom])

  // Handle screen track playback when screen sharing starts
  useEffect(() => {
    if (isSharing && screenTrackRef.current && screenVideoRef.current) {
      // Delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        try {
          console.log('▶️ Playing screen track to ref')
          screenTrackRef.current.play(screenVideoRef.current)
        } catch (err) {
          console.error('❌ Failed to play screen track:', err)
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isSharing])

  const joinChannel = async (client) => {
    try {
      console.log('🎥 Joining Agora channel with name:', channelName)
      const uid = await client.join(APP_ID, channelName, null, null)
      console.log('✅ Successfully joined Agora, UID:', uid)
      agoraUidRef.current = uid
      setAgoraUid(uid)
      if (socketRef.current) {
        socketRef.current.emit('send_agora_uid', { sessionId, agoraUid: uid, userId: user?.id, name: user?.name, role: user?.role })
      }
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      setLocalTracks({ audio: audioTrack, video: videoTrack })
      localTracksRef.current = { audio: audioTrack, video: videoTrack }
      await client.publish([audioTrack, videoTrack])
      setTimeout(() => { if (localVideoRef.current) videoTrack.play(localVideoRef.current) }, 500)
      setJoined(true)
      if (!isTeacher) startEngagementAnalysis(videoTrack)
    } catch (err) {
      console.error('❌ Failed to join:', err)
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
        setScreenShareUid(agoraUidRef.current)
        // Notify others that screen share started
        if (socketRef.current?.connected) {
          socketRef.current.emit('screen_share_started', { sessionId, agoraUid: agoraUidRef.current })
        }
      } catch (err) { console.error(err) }
    } else {
      screenTrackRef.current?.close()
      await clientRef.current.unpublish(screenTrackRef.current)
      await clientRef.current.publish(localTracksRef.current.video)
      setIsSharing(false)
      setScreenShareUid(null)
      // Notify others that screen share stopped
      if (socketRef.current?.connected) {
        socketRef.current.emit('screen_share_stopped', { sessionId, agoraUid: agoraUidRef.current })
      }
    }
  }

  const handleLeave = async () => {
    // Notify others that we're leaving
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_session', { sessionId })
      // Give socket time to send the message
      await new Promise(resolve => setTimeout(resolve, 100))
    }
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

  // Handle waiting room ready - participant has configured mic/camera
  const handleWaitingRoomReady = (data) => {
    setWaitingRoomData(data)
    // Just save the data - don't join yet. Wait for teacher to admit them.
    // The request_join_session was already emitted on socket connect
  }

  // Handle waiting room cancel
  const handleWaitingRoomCancel = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_session', { sessionId })
      socketRef.current.disconnect()
    }
    navigate('/classrooms')
  }

  // Handle teacher admitting a participant
  const handleAdmitParticipant = (socketId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admit_participant', { sessionId, socketId })
    }
  }

  // Handle teacher denying a participant
  const handleDenyParticipant = (socketId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('deny_participant', { sessionId, socketId })
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const realParticipants = socketParticipants
    .filter(p => p.agoraUid !== agoraUidRef.current)
    .map(p => ({ uid: p.agoraUid, name: studentNames[p.agoraUid] || p.name || `Student ${String(p.agoraUid).slice(0, 6)}` }))

  const totalTiles = socketParticipants.length || 1
  
  // Responsive grid configuration based on participant count and screen share status
  let gridContainerClass = 'w-full h-full'
  let gridClass = 'grid-cols-1'
  let gridRows = 'auto-rows-max'
  let gridGapClass = 'gap-2 sm:gap-4'
  let isCentered = true
  
  // When screen sharing is active, use different layout
  if (screenShareUid) {
    // Screen share layout: main area for screen + bottom bar for other participants
    gridContainerClass = 'w-full h-full flex flex-col'
    gridClass = 'grid-cols-1'
    gridRows = 'auto-rows-max'
    gridGapClass = 'gap-2'
    isCentered = false
  } else if (totalTiles === 1) {
    // Single user: centered, no scroll
    gridClass = 'grid-cols-1'
    gridRows = 'auto-rows-fr'
    gridContainerClass = 'w-full h-full'
    isCentered = true
  } else if (totalTiles === 2) {
    // Two users: split 50/50 both ways
    gridClass = 'grid-cols-2'
    gridRows = 'auto-rows-fr'
    gridContainerClass = 'w-full h-full'
    isCentered = false
  } else if (totalTiles === 3) {
    // Three users: 2-3 grid
    gridClass = 'grid-cols-2 xl:grid-cols-3'
    gridRows = 'auto-rows-fr'
    gridContainerClass = 'w-full h-full'
    isCentered = false
  } else if (totalTiles === 4) {
    // Four users: 2x2 grid
    gridClass = 'grid-cols-2'
    gridRows = 'auto-rows-fr'
    gridContainerClass = 'w-full h-full'
    isCentered = false
  } else {
    // 5+ users: responsive columns
    gridClass = 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    gridRows = 'auto-rows-fr'
    gridContainerClass = 'w-full h-full'
    isCentered = false
  }

  if (isInWaitingRoom && !isTeacher) {
    return (
      <WaitingRoom 
        sessionName={sessionName} 
        onCancel={handleWaitingRoomCancel}
        onReady={handleWaitingRoomReady}
        user={user}
      />
    )
  }

  if (admissionDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-white text-lg font-semibold">Access Denied</p>
          <p className="text-slate-400 text-sm mt-2">Your request to join this meeting was denied by the host.</p>
          <button
            onClick={() => navigate('/classrooms')}
            className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            Return to Classrooms
          </button>
        </div>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white text-sm">Joining session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-transparent flex flex-col overflow-hidden">

      {/* Waiting Room Controls for Teachers */}
      {isTeacher && <WaitingRoomControls 
        waitingParticipants={waitingParticipants}
        onAdmit={handleAdmitParticipant}
        onDeny={handleDenyParticipant}
      />}

      {/* Header */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0">
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
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs sm:text-sm transition-colors px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
            <Users size={15} />
            <span className="hidden sm:inline">{socketParticipants.length} participants</span>
            <span className="sm:hidden">{socketParticipants.length}</span>
          </button>

          {showParticipants && (
            <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                <p className="text-[var(--text-primary)] text-sm font-semibold">Participants ({socketParticipants.length})</p>
                <button onClick={() => setShowParticipants(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">{user?.name} <span className="text-[var(--text-tertiary)] text-xs">(You)</span></p>
                    <p className="text-[var(--text-secondary)] text-xs capitalize">{user?.role}</p>
                  </div>
                </div>
                {realParticipants.map((p, i) => {
                  const pd = socketParticipants.find(sp => sp.agoraUid === p.uid)
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[var(--text-primary)] text-sm truncate">{p.name}</p>
                        <p className="text-[var(--text-secondary)] text-xs capitalize">{pd?.role || 'student'}</p>
                      </div>
                    </div>
                  )
                })}
                {realParticipants.length === 0 && (
                  <p className="text-[var(--text-secondary)] text-xs text-center py-4">No other participants yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden w-full">

        {/* Video Grid */}
        <div className={`flex-1 min-h-0 overflow-hidden w-full ${screenShareUid ? 'flex flex-col' : 'overflow-y-auto'}`}>
          {isTeacher && alerts.length > 0 && (
            <div className="absolute top-24 left-4 right-4 z-10 space-y-1">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-orange-900/50 border border-orange-600/50 rounded-lg px-3 py-2 text-xs sm:text-sm text-orange-200 flex items-start gap-2">
                  ⚠️ <span><strong>{alert.studentName}</strong> dropped to {alert.score}% — consider re-engaging!</span>
                </div>
              ))}
            </div>
          )}

          {screenShareUid ? (
            <div className="flex flex-col flex-1 min-h-0 w-full">
              {/* Screen share main view - takes all available space */}
              <div className="flex-1 min-h-0 min-w-0 bg-black overflow-hidden flex items-center justify-center">
                {screenShareUid === agoraUidRef.current ? (
                  <StudentTile
                    label={`${user?.name || 'You'} (Sharing Screen)`}
                    videoRef={screenVideoRef}
                    isLocal
                    isScreenShare
                  />
                ) : (
                  socketParticipants
                    .filter(p => p.agoraUid === screenShareUid)
                    .map(p => {
                      const agoraUser = remoteUsers.find(u => u.uid === p.agoraUid)
                      const isOff = !agoraUser || videoOffUsers.has(p.agoraUid)
                      return (
                        <StudentTile
                          key={p.agoraUid}
                          remoteUser={agoraUser}
                          label={`${p.name} (Sharing Screen)`}
                          isVideoOff={isOff}
                          isScreenShare
                        />
                      )
                    })
                )}
              </div>
              
              {/* Thumbnail bar at bottom with other participants */}
              <div className="h-24 sm:h-28 bg-[var(--bg-primary)]/60 border-t border-[var(--border-color)] overflow-x-auto overflow-y-hidden flex gap-2 p-2 flex-shrink-0">
                {/* Show self thumbnail if not screen sharing */}
                {screenShareUid !== agoraUidRef.current && (
                  <div className="flex-shrink-0 w-24 h-20 sm:w-32 sm:h-24">
                    <StudentTile
                      label={`${user?.name} (You)`}
                      videoRef={localVideoRef}
                      score={isTeacher ? undefined : engagementMap[agoraUid]}
                      isLocal
                      isVideoOff={isVideoOff}
                      isThumbnail
                    />
                  </div>
                )}
                
                {/* Other participants thumbnails */}
                {socketParticipants
                  .filter(p => p.agoraUid !== agoraUidRef.current && p.agoraUid !== screenShareUid)
                  .map(p => {
                    const agoraUser = remoteUsers.find(u => u.uid === p.agoraUid)
                    const isOff = !agoraUser || videoOffUsers.has(p.agoraUid)
                    return (
                      <div key={p.agoraUid} className="flex-shrink-0 w-24 h-20 sm:w-32 sm:h-24">
                        <StudentTile
                          remoteUser={agoraUser}
                          label={p.name || `Student ${String(p.agoraUid).slice(0, 6)}`}
                          score={isOff ? 0 : engagementMap[p.agoraUid]}
                          isVideoOff={isOff}
                          isThumbnail
                        />
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div className={`grid ${gridClass} ${gridRows} ${gridGapClass} ${gridContainerClass} p-2 sm:p-4 overflow-hidden`}>
              {/* Normal grid layout */}
              <div className={`min-h-0 min-w-0 ${totalTiles === 1 ? 'max-w-4xl mx-auto w-full' : ''}`}>
                <StudentTile
                  label={`${user?.name || 'You'} (${isTeacher ? 'Teacher' : 'You'})`}
                  videoRef={localVideoRef}
                  score={isTeacher ? undefined : engagementMap[agoraUid]}
                  isLocal
                  isVideoOff={isVideoOff}
                />
              </div>
              {socketParticipants
                .filter(p => p.agoraUid !== agoraUidRef.current)
                .map(p => {
                  const agoraUser = remoteUsers.find(u => u.uid === p.agoraUid)
                  const isOff = !agoraUser || videoOffUsers.has(p.agoraUid)
                  return (
                    <div key={p.agoraUid} className="min-h-0 min-w-0">
                      <StudentTile
                        remoteUser={agoraUser}
                        label={p.name || `Student ${String(p.agoraUid).slice(0, 6)}`}
                        score={isOff ? 0 : engagementMap[p.agoraUid]}
                        isVideoOff={isOff}
                      />
                    </div>
                  )
                })}
            </div>
          )}
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
          <div className="fixed inset-0 z-40 sm:relative sm:inset-auto sm:w-72 md:w-80 bg-[var(--bg-secondary)] sm:border-l border-[var(--border-color)] flex flex-col overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
              <h2 className="text-[var(--text-primary)] font-semibold text-sm flex items-center gap-2">
                <MessageCircle size={16} className="text-indigo-400" /> Chat
              </h2>
              <button onClick={() => setShowChat(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)]">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-[var(--text-secondary)] text-sm">No messages yet</p>
                </div>
              ) : chatMessages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-glow">
                      {msg.senderName[0]?.toUpperCase()}
                    </div>
                    <span className="text-[var(--text-primary)] text-xs font-semibold truncate">{msg.senderName}</span>
                    <span className="text-[var(--text-secondary)] text-xs shrink-0">{msg.timestamp}</span>
                  </div>
                  <p className="text-[var(--text-primary)] text-sm ml-8 break-words">{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 sm:p-4 border-t border-[var(--border-color)] flex gap-2 shrink-0 bg-[var(--bg-secondary)]">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:border-indigo-500/50 min-w-0 transition-colors"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-glow font-medium shrink-0">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls Bar */}
      <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto shrink-0">
        <ControlBtn onClick={toggleMute} active={isMuted}
          icon={isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          label={isMuted ? 'Unmute' : 'Mute'} />
        <ControlBtn onClick={toggleVideo} active={isVideoOff}
          icon={isVideoOff ? <CameraOff size={16} /> : <Camera size={16} />}
          label={isVideoOff ? 'Start Camera' : 'Stop Camera'} />
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
    blue: active ? 'bg-blue-500 text-white' : 'bg-[var(--bg-tertiary)] hover:brightness-125 text-white',
    indigo: active ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-tertiary)] hover:brightness-125 text-white',
    default: active ? 'bg-orange-600 text-white' : 'bg-[var(--bg-tertiary)] hover:brightness-125 text-white',
  }
  return (
    <button onClick={onClick} title={label}
      className={`flex flex-col items-center gap-0.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-medium transition-colors ${colors[color] || colors.default}`}>
      {icon}
      <span className="text-xs leading-tight max-w-[3rem]">{label}</span>
    </button>
  )
}