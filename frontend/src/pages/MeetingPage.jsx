import { useEffect, useRef, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { io } from 'socket.io-client'
import { AuthContext } from '../context/AuthContext'
import StudentTile from '../components/meeting/StudentTile'
import AIMonitorPanel from '../components/meeting/AIMonitorPanel'
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, Activity } from 'lucide-react'

const APP_ID = import.meta.env.VITE_AGORA_APP_ID

export default function MeetingPage() {
  const { sessionId } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [remoteUsers, setRemoteUsers] = useState([])
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null })
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [joined, setJoined] = useState(false)
  const [engagementMap, setEngagementMap] = useState({})
  const [alerts, setAlerts] = useState([])
  const [studentNames, setStudentNames] = useState({})
  const [agoraUid, setAgoraUid] = useState(null)

  const clientRef = useRef(null)
  const screenTrackRef = useRef(null)
  const localVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const analysisRef = useRef(null)
  const socketRef = useRef(null)
  const agoraUidRef = useRef(null)

  const isTeacher = user?.role === 'teacher'

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    // Socket.IO
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')
    socketRef.current = socket
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id)
      socket.emit('join_session', { sessionId, role: user?.role, name: user?.name })
    })

    // Listen for existing participants when we join
    socket.on('existing_participants', ({ participants }) => {
      console.log('📋 [EXISTING PARTICIPANTS]:', participants)
      setStudentNames(prev => {
        const updated = { ...prev }
        participants.forEach(p => {
          updated[p.agoraUid] = p.name
          console.log(`✅ Mapped agoraUid ${p.agoraUid} to name: ${p.name}`)
        })
        return updated
      })
    })

    // Listen for new participants joining
    socket.on('participant_agora_uid', ({ agoraUid, name, role }) => {
      console.log('🆔 [PARTICIPANT AGORA UID UPDATE]:', { agoraUid, name, role })
      setStudentNames(prev => {
        const updated = { ...prev, [agoraUid]: name }
        console.log('✅ Updated agoraUid', agoraUid, 'to name:', name)
        return updated
      })
    })

    // Teacher listens for real student scores
    socket.on('engagement_update', ({ agoraUid, studentName, score }) => {
      console.log('🎯 [TEACHER] Received engagement_update:', { agoraUid, studentName, score }, 'Current map:', engagementMap)
      setEngagementMap(prev => {
        const updated = { ...prev, [agoraUid]: score }
        console.log('📊 Updated engagementMap:', updated)
        return updated
      })
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
      }
      if (mediaType === 'audio') remoteUser.audioTrack?.play()
    })

    client.on('user-unpublished', (remoteUser, mediaType) => {
      if (mediaType === 'video') setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid))
    })

    client.on('user-left', (remoteUser) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid))
      setEngagementMap(prev => { const n = { ...prev }; delete n[remoteUser.uid]; return n })
    })

    joinChannel(client)

    return () => {
      socket.disconnect()
      leaveChannel()
    }
  }, [])

  const joinChannel = async (client) => {
    try {
      const uid = await client.join(APP_ID, sessionId, null, null)
      agoraUidRef.current = uid
      setAgoraUid(uid)
      
      // Send agoraUid to backend so others know this participant's UID
      if (socketRef.current) {
        socketRef.current.emit('send_agora_uid', { sessionId, agoraUid: uid, name: user?.name, role: user?.role })
        console.log(`📤 [${user?.role}] Sent agoraUid to backend:`, uid)
      }
      
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      setLocalTracks({ audio: audioTrack, video: videoTrack })
      await client.publish([audioTrack, videoTrack])
      setTimeout(() => {
        if (localVideoRef.current) videoTrack.play(localVideoRef.current)
      }, 500)
      setJoined(true)
      if (!isTeacher) startEngagementAnalysis(videoTrack)
    } catch (err) {
      console.error('Failed to join:', err)
      setJoined(true)
    }
  }

  const leaveChannel = async () => {
    clearInterval(analysisRef.current)
    localTracks.audio?.close()
    localTracks.video?.close()
    screenTrackRef.current?.close()
    await clientRef.current?.leave()
  }

  const startEngagementAnalysis = (videoTrack) => {
    analysisRef.current = setInterval(async () => {
      try {
        const canvas = canvasRef.current
        if (!canvas) {
          console.error('❌ [STUDENT] Canvas element not found')
          return
        }
        const mediaStreamTrack = videoTrack.getMediaStreamTrack()
        const imageCapture = new ImageCapture(mediaStreamTrack)
        const bitmap = await imageCapture.grabFrame()
        canvas.width = 320
        canvas.height = 240
        canvas.getContext('2d').drawImage(bitmap, 0, 0, 320, 240)
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]

        const response = await fetch(`${import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000'}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
        const result = await response.json()
        const score = result.score

        // Update own score locally
        setEngagementMap(prev => ({ ...prev, [agoraUidRef.current]: score }))

        // Post to backend with agoraUid
        const token = localStorage.getItem('classlens_token')
        const engagementPayload = { sessionId, score, agoraUid: agoraUidRef.current, details: result.details }
        console.log('🎤 [STUDENT] Posting engagement:', engagementPayload)
        
        const postResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/engagement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(engagementPayload)
        })
        
        if (!postResponse.ok) {
          console.error('❌ [STUDENT] Failed to post engagement:', postResponse.status, await postResponse.text())
        } else {
          console.log('✅ [STUDENT] Engagement posted successfully')
        }
      } catch (err) {
        console.error('❌ [STUDENT] Error in engagement analysis:', err)
        const mockScore = Math.floor(Math.random() * 40 + 60)
        setEngagementMap(prev => ({ ...prev, [agoraUidRef.current]: mockScore }))
      }
    }, 2000)
  }

  const toggleMute = () => {
    localTracks.audio?.setEnabled(isMuted)
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    localTracks.video?.setEnabled(isVideoOff)
    setIsVideoOff(!isVideoOff)
  }

  const toggleScreenShare = async () => {
    if (!isSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack()
        screenTrackRef.current = screenTrack
        await clientRef.current.unpublish(localTracks.video)
        await clientRef.current.publish(screenTrack)
        setIsSharing(true)
      } catch (err) { console.error(err) }
    } else {
      screenTrackRef.current?.close()
      await clientRef.current.unpublish(screenTrackRef.current)
      await clientRef.current.publish(localTracks.video)
      setIsSharing(false)
    }
  }

  const handleLeave = async () => {
    await leaveChannel()
    navigate('/dashboard')
  }

  const realParticipants = remoteUsers.map(u => ({
    uid: u.uid,
    name: studentNames[u.uid] || `Student ${String(u.uid).slice(0, 6)}`
  }))

  if (!joined) {
    return (
      <div className="min-h-screen bg-[#0f1123] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Joining session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1123] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1d35] border-b border-[#2d3155] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold">Physics - Class 12B</h1>
          <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 text-red-400 text-xs px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Users size={16} />
          <span>{realParticipants.length + 1} participants</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {alerts.length > 0 && (
            <div className="mb-3 space-y-1">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-orange-900/50 border border-orange-600/50 rounded-lg px-3 py-2 text-sm text-orange-200 flex items-center gap-2">
                  ⚠️ <strong>{alert.studentName}</strong> dropped to {alert.score}% — consider re-engaging!
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {/* Local tile */}
            <StudentTile
              label={`${user?.name || 'You'} (${isTeacher ? 'Teacher' : 'You'})`}
              videoRef={localVideoRef}
              score={isTeacher ? undefined : engagementMap[agoraUid]}
              isLocal
            />
            {/* Real remote users */}
            {remoteUsers.map(remoteUser => (
              <StudentTile
                key={remoteUser.uid}
                remoteUser={remoteUser}
                label={studentNames[remoteUser.uid] || `Student ${String(remoteUser.uid).slice(0, 6)}`}
                score={engagementMap[remoteUser.uid]}
              />
            ))}
          </div>
        </div>

        {/* AI Monitor Panel */}
        {showPanel && (
          <AIMonitorPanel
            engagementMap={engagementMap}
            participants={realParticipants}
            onClose={() => setShowPanel(false)}
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls Bar */}
      <div className="bg-[#1a1d35] border-t border-[#2d3155] px-6 py-4 flex items-center justify-center gap-3">
        <ControlBtn onClick={toggleMute} active={isMuted}
          icon={isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          label={isMuted ? 'Unmute' : 'Mute'} />
        <ControlBtn onClick={toggleVideo} active={isVideoOff}
          icon={isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
          label={isVideoOff ? 'Start Video' : 'Stop Video'} />
        {isTeacher && (
          <ControlBtn onClick={toggleScreenShare} active={isSharing}
            icon={<Monitor size={18} />}
            label={isSharing ? 'Stop Share' : 'Share Screen'}
            color="blue" />
        )}
        <ControlBtn
          onClick={() => setShowPanel(!showPanel)}
          active={showPanel}
          icon={<Activity size={18} />}
          label="Engagement"
          color="indigo" />
        <ControlBtn onClick={handleLeave}
          icon={<PhoneOff size={18} />}
          label="End Class"
          color="red" />
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
      className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${colors[color] || colors.default}`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}