import { useEffect, useRef, useState } from 'react'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { Mic, MicOff, Camera, CameraOff, X, Clock } from 'lucide-react'

export default function WaitingRoom({ sessionName, onCancel, onReady, user }) {
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null })
  const [error, setError] = useState(null)
  const [isWaitingForHost, setIsWaitingForHost] = useState(false)
  const videoRef = useRef(null)
  const clientRef = useRef(null)

  // Initialize camera preview when component mounts
  useEffect(() => {
    const initializePreview = async () => {
      try {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        // Create audio and video tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
        const videoTrack = await AgoraRTC.createCameraVideoTrack()

        setLocalTracks({ audio: audioTrack, video: videoTrack })

        // Play video preview
        if (videoRef.current) {
          await videoTrack.play(videoRef.current)
        }

        // Set initial mic/camera state
        await audioTrack.setEnabled(isMicOn)
        await videoTrack.setEnabled(isCameraOn)
      } catch (err) {
        console.error('Failed to initialize preview:', err)
        setError('Unable to access camera/microphone. Please check permissions.')
      }
    }

    initializePreview()

    return () => {
      // Cleanup on unmount
      if (localTracks.audio) {
        localTracks.audio.stop()
        localTracks.audio.close()
      }
      if (localTracks.video) {
        localTracks.video.stop()
        localTracks.video.close()
      }
    }
  }, [])

  // Toggle microphone
  const toggleMic = async () => {
    try {
      if (localTracks.audio) {
        await localTracks.audio.setEnabled(!isMicOn)
        setIsMicOn(!isMicOn)
      }
    } catch (err) {
      console.error('Failed to toggle mic:', err)
      setError('Failed to toggle microphone')
    }
  }

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (localTracks.video) {
        await localTracks.video.setEnabled(!isCameraOn)
        setIsCameraOn(!isCameraOn)
      }
    } catch (err) {
      console.error('Failed to toggle camera:', err)
      setError('Failed to toggle camera')
    }
  }

  // Handle cancel
  const handleCancel = async () => {
    // Stop and close tracks
    if (localTracks.audio) {
      localTracks.audio.stop()
      localTracks.audio.close()
    }
    if (localTracks.video) {
      localTracks.video.stop()
      localTracks.video.close()
    }
    if (clientRef.current) {
      await clientRef.current.leave()
    }
    onCancel()
  }

  // Handle join ready - pass mic and camera state to parent
  const handleJoinReady = () => {
    setIsWaitingForHost(true)
    onReady({
      isMicOn,
      isCameraOn,
      localTracks
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        {isWaitingForHost ? (
          <>
            {/* Waiting for Host State */}
            <div className="text-center">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">Waiting Room</h2>
                  <p className="text-slate-400 text-sm mt-1">{sessionName}</p>
                </div>
              </div>

              {/* Waiting Animation */}
              <div className="mb-8 flex justify-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700 animate-pulse" />
                  <div className="relative z-10">
                    <Clock className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                </div>
              </div>

              {/* Message */}
              <h3 className="text-xl font-semibold text-white mb-2">
                Waiting for Host Approval
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Please wait while the host reviews your request to join the meeting.
              </p>

              {/* User Info */}
              <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-slate-300 text-sm">You are joining as:</p>
                <p className="text-white font-semibold">{user?.name || 'User'}</p>
                <p className="text-slate-400 text-sm capitalize">{user?.role || 'participant'}</p>
              </div>

              {/* Media Status */}
              <div className="mb-6 p-3 bg-slate-700/50 rounded-lg text-sm">
                <p className="text-slate-400 mb-2">Your settings:</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    {isMicOn ? (
                      <Mic className="w-4 h-4 text-green-400" />
                    ) : (
                      <MicOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className={isMicOn ? 'text-green-400' : 'text-red-400'}>
                      Mic {isMicOn ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-600" />
                  <div className="flex items-center gap-1">
                    {isCameraOn ? (
                      <Camera className="w-4 h-4 text-green-400" />
                    ) : (
                      <CameraOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className={isCameraOn ? 'text-green-400' : 'text-red-400'}>
                      Camera {isCameraOn ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Cancel Request
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Initial Waiting Room State */}
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Waiting Room</h2>
                <p className="text-slate-400 text-sm mt-1">{sessionName}</p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Video Preview */}
            <div className="mb-6">
              <div
                ref={videoRef}
                className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden"
              />
              <p className="text-slate-400 text-sm mt-2">
                The host will admit you shortly...
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* User Info */}
            <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-slate-300 text-sm">Joining as:</p>
              <p className="text-white font-semibold">{user?.name || 'User'}</p>
              <p className="text-slate-400 text-sm capitalize">{user?.role || 'participant'}</p>
            </div>

            {/* Media Controls */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={toggleMic}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                  isMicOn
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600/30 hover:bg-red-600/40 text-red-300'
                }`}
              >
                {isMicOn ? (
                  <>
                    <Mic className="w-4 h-4" />
                    Mic On
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4" />
                    Mic Off
                  </>
                )}
              </button>

              <button
                onClick={toggleCamera}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                  isCameraOn
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600/30 hover:bg-red-600/40 text-red-300'
                }`}
              >
                {isCameraOn ? (
                  <>
                    <Camera className="w-4 h-4" />
                    Camera On
                  </>
                ) : (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Camera Off
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinReady}
                disabled={error !== null}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
              >
                Ready to Join
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
