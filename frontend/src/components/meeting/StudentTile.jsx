import { useEffect, useRef } from 'react'
import { VideoOff } from 'lucide-react'

export default function StudentTile({ remoteUser, label, score, isLocal, videoRef, isVideoOff, isScreenShare, isThumbnail }) {
  const tileRef = useRef(null)

  useEffect(() => {
    if (!isLocal && remoteUser?.videoTrack && !isVideoOff && tileRef.current) {
      try {
        // Check if the video track is already playing to avoid errors
        remoteUser.videoTrack.play(tileRef.current)
        console.log(`▶️ Video playing for user:`, remoteUser.uid)
      } catch (err) {
        console.error(`❌ Error playing video for user ${remoteUser.uid}:`, err)
      }
    } else if (isLocal && videoRef && videoRef.current) {
      // Local video is handled separately by MeetingPage
    }
  }, [remoteUser?.videoTrack, isVideoOff, remoteUser?.uid])

  const getStyle = (s) => {
    if (s === undefined || s === null) return { ring: 'ring-[var(--border-color)]', badge: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]', bar: 'bg-gray-500' }
    if (s >= 75) return { ring: 'ring-green-500', badge: 'bg-green-600 text-white', bar: 'bg-green-400' }
    if (s >= 50) return { ring: 'ring-yellow-500', badge: 'bg-yellow-500 text-white', bar: 'bg-yellow-400' }
    return { ring: 'ring-red-500', badge: 'bg-red-600 text-white', bar: 'bg-red-500' }
  }

  const style = getStyle(score)
  const initials = label?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // Screen share or thumbnail styling
  const containerClasses = isThumbnail 
    ? `relative bg-[var(--bg-secondary)] rounded-lg overflow-hidden ring-2 ${style.ring} transition-all w-full h-full`
    : isScreenShare
    ? `relative bg-black overflow-hidden w-full h-full`
    : `relative bg-[var(--bg-secondary)] rounded-xl overflow-hidden ring-2 ${style.ring} transition-all duration-500 w-full h-full`
  
  const aspectRatio = (isScreenShare || isThumbnail) ? 'auto' : '16/9'

  return (
    <div className={containerClasses} style={isScreenShare ? {} : { aspectRatio }}>

      {/* Video or Avatar */}
      {isVideoOff ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-primary)]">
          <div className={`${isThumbnail ? 'w-10 h-10' : 'w-16 h-16'} bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center text-[var(--text-tertiary)] ${!isThumbnail && 'mb-2'}`}>
            <VideoOff size={isThumbnail ? 16 : 28} />
          </div>
          {!isThumbnail && <p className="text-[var(--text-secondary)] text-xs">Camera Off</p>}
        </div>
      ) : isLocal && videoRef ? (
        <div ref={videoRef} className="w-full h-full" />
      ) : !isLocal && remoteUser?.videoTrack ? (
        <div ref={tileRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
          <div className={`${isThumbnail ? 'w-8 h-8 text-sm' : 'w-16 h-16 text-xl'} bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold`}>
            {initials}
          </div>
        </div>
      )}

      {/* Bottom overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent ${isThumbnail ? 'px-2 py-1' : 'px-3 py-2'}`}>
        <p className={`text-white ${isThumbnail ? 'text-xs' : 'text-xs font-medium'} truncate`}>{isThumbnail ? label?.split('(')[0]?.trim() : label}</p>
        {score !== undefined && score !== null && !isVideoOff && !isThumbnail && (
          <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
            <div className={`h-1 rounded-full transition-all duration-700 ${style.bar}`}
              style={{ width: `${score}%` }} />
          </div>
        )}
      </div>

      {/* Score badge */}
      {!isThumbnail && !isScreenShare && (
        <>
          {isVideoOff ? (
            <div className="absolute top-2 right-2 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs px-2 py-0.5 rounded-full">
              Off
            </div>
          ) : score !== undefined && score !== null ? (
            <div className={`absolute top-2 right-2 ${style.badge} text-xs font-bold px-2 py-0.5 rounded-full`}>
              {score}%
            </div>
          ) : (
            <div className="absolute top-2 right-2 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs px-2 py-0.5 rounded-full">
              --
            </div>
          )}

          {/* No face badge */}
          {!isVideoOff && score !== undefined && score < 30 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
              No Face
            </div>
          )}
        </>
      )}
    </div>
  )
}