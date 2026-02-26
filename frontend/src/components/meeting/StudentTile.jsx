import { useEffect, useRef } from 'react'
import { VideoOff } from 'lucide-react'

export default function StudentTile({ remoteUser, label, score, isLocal, videoRef, isVideoOff }) {
  const tileRef = useRef(null)

  useEffect(() => {
  if (!isLocal && remoteUser?.videoTrack && !isVideoOff) {
    remoteUser.videoTrack.play(tileRef.current)
  }
}, [remoteUser, isVideoOff])

  const getStyle = (s) => {
    if (s === undefined || s === null) return { ring: 'ring-[#2d3155]', badge: 'bg-gray-700 text-gray-300', bar: 'bg-gray-500' }
    if (s >= 75) return { ring: 'ring-green-500', badge: 'bg-green-600 text-white', bar: 'bg-green-400' }
    if (s >= 50) return { ring: 'ring-yellow-500', badge: 'bg-yellow-500 text-white', bar: 'bg-yellow-400' }
    return { ring: 'ring-red-500', badge: 'bg-red-600 text-white', bar: 'bg-red-500' }
  }

  const style = getStyle(score)
  const initials = label?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`relative bg-[#1a1d35] rounded-xl overflow-hidden ring-2 ${style.ring} transition-all duration-500`}
      style={{ aspectRatio: '16/9' }}>

      {/* Video or Avatar */}
      {isVideoOff ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f1123]">
          <div className="w-16 h-16 bg-[#2d3155] rounded-full flex items-center justify-center text-slate-400 mb-2">
            <VideoOff size={28} />
          </div>
          <p className="text-slate-500 text-xs">Camera Off</p>
        </div>
      ) : isLocal ? (
        <div ref={videoRef} className="w-full h-full" />
      ) : remoteUser?.videoTrack ? (
        <div ref={tileRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#0f1123]">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
        <p className="text-white text-xs font-medium truncate">{label}</p>
        {score !== undefined && score !== null && !isVideoOff && (
          <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
            <div className={`h-1 rounded-full transition-all duration-700 ${style.bar}`}
              style={{ width: `${score}%` }} />
          </div>
        )}
      </div>

      {/* Score badge */}
      {isVideoOff ? (
        <div className="absolute top-2 right-2 bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">
          Off
        </div>
      ) : score !== undefined && score !== null ? (
        <div className={`absolute top-2 right-2 ${style.badge} text-xs font-bold px-2 py-0.5 rounded-full`}>
          {score}%
        </div>
      ) : (
        <div className="absolute top-2 right-2 bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">
          --
        </div>
      )}

      {/* No face badge */}
      {!isVideoOff && score !== undefined && score < 30 && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
          No Face
        </div>
      )}
    </div>
  )
}