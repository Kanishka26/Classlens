import { UserPlus, UserX, Users } from 'lucide-react'

export default function WaitingRoomControls({ waitingParticipants, onAdmit, onDeny }) {
  if (!waitingParticipants || waitingParticipants.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-slate-800 border border-yellow-500/50 rounded-lg p-4 shadow-lg max-w-sm z-40">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
        <Users className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-white">
          Waiting Room ({waitingParticipants.length})
        </h3>
      </div>

      {/* List of waiting participants */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {waitingParticipants.map((participant, idx) => (
          <div
            key={idx}
            className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between gap-3"
          >
            {/* Participant info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{participant.name}</p>
              <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                <span className="capitalize">{participant.role}</span>
                <span className="text-xs">
                  {participant.isMicOn ? '🎤' : '🔇'}{' '}
                  {participant.isCameraOn ? '📹' : '📷'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onAdmit(participant.socketId)}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center justify-center"
                title="Admit participant"
              >
                <UserPlus className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => onDeny(participant.socketId)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center justify-center"
                title="Deny participant"
              >
                <UserX className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-700">
        Waiting room enabled - approve participants to join the meeting
      </p>
    </div>
  )
}
