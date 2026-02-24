from analyzer.face_tracker import get_face_landmarks, get_eye_aspect_ratio, LEFT_EYE, RIGHT_EYE
from analyzer.head_pose import estimate_head_pose, head_pose_score
import numpy as np

WEIGHTS = {
    "face_present": 0.20,
    "eye_openness": 0.30,
    "head_pose":    0.35,
    "attention_stability": 0.15
}

EAR_CLOSED = 0.12
EAR_DROWSY = 0.17
EAR_NORMAL = 0.22
EAR_WIDE = 0.30

_previous_state = {
    "eye_ear": 0.25,
    "head_yaw": 0,
    "head_pitch": 0
}

def compute_engagement_score(frame):
    global _previous_state

    result = {
        "score": 0,
        "details": {
            "face_present": False,
            "eye_contact_score": 0,
            "head_pose_score": 0,
            "attention_stability_score": 0,
            "pitch": 0,
            "yaw": 0,
            "eye_state": "closed",
        }
    }

    landmarks = get_face_landmarks(frame)

    if landmarks is None:
        result["score"] = 0
        return result

    result["details"]["face_present"] = True
    face_score = 95

    # Eye openness score
    left_ear = get_eye_aspect_ratio(landmarks, LEFT_EYE, frame.shape)
    right_ear = get_eye_aspect_ratio(landmarks, RIGHT_EYE, frame.shape)
    avg_ear = (left_ear + right_ear) / 2.0

    if avg_ear < EAR_CLOSED:
        eye_score = 10
        eye_state = "closed"
    elif avg_ear < EAR_DROWSY:
        eye_scale = (avg_ear - EAR_CLOSED) / (EAR_DROWSY - EAR_CLOSED)
        eye_score = 10 + eye_scale * 35
        eye_state = "drowsy"
    elif avg_ear < EAR_NORMAL:
        eye_scale = (avg_ear - EAR_DROWSY) / (EAR_NORMAL - EAR_DROWSY)
        eye_score = 45 + eye_scale * 40
        eye_state = "normal"
    else:
        eye_scale = min((avg_ear - EAR_NORMAL) / (EAR_WIDE - EAR_NORMAL), 1.0)
        eye_score = 85 + eye_scale * 15
        eye_state = "wide_open"

    result["details"]["eye_contact_score"] = round(eye_score)
    result["details"]["eye_state"] = eye_state

    # Head pose score
    pose = estimate_head_pose(landmarks, frame.shape)
    if pose:
        pitch, yaw, roll = pose
        hp_score = compute_head_pose_score(pitch, yaw, roll)
        result["details"]["head_pose_score"] = round(hp_score)
        result["details"]["pitch"] = round(pitch, 1)
        result["details"]["yaw"] = round(yaw, 1)
    else:
        hp_score = 50

    # Attention stability score
    stability_score = compute_attention_stability(
        avg_ear,
        _previous_state["eye_ear"],
        pose[1] if pose else 0,
        _previous_state["head_yaw"],
        pose[0] if pose else 0,
        _previous_state["head_pitch"]
    )

    result["details"]["attention_stability_score"] = round(stability_score)

    if pose:
        _previous_state["eye_ear"] = avg_ear
        _previous_state["head_yaw"] = pose[1]
        _previous_state["head_pitch"] = pose[0]
    else:
        _previous_state["eye_ear"] = avg_ear

    # Final score — simple weighted sum, no penalizing scaling
    final_score = (
        WEIGHTS["face_present"] * face_score +
        WEIGHTS["eye_openness"] * eye_score +
        WEIGHTS["head_pose"] * hp_score +
        WEIGHTS["attention_stability"] * stability_score
    )

    result["score"] = round(max(0, min(100, final_score)))
    return result


def compute_head_pose_score(pitch, yaw, roll):
    pitch = float(np.squeeze(pitch))
    yaw = float(np.squeeze(yaw))
    roll = float(np.squeeze(roll))

    yaw_gaussian = np.exp(-((yaw ** 2) / (2 * 25 ** 2)))
    pitch_offset = pitch + 15
    pitch_gaussian = np.exp(-((pitch_offset ** 2) / (2 * 30 ** 2)))
    roll_gaussian = np.exp(-((abs(roll) ** 2) / (2 * 35 ** 2)))

    hp_score = 100 * (
        0.5 * yaw_gaussian +
        0.35 * pitch_gaussian +
        0.15 * roll_gaussian
    )

    return max(0, min(100, hp_score))


def compute_attention_stability(curr_ear, prev_ear, curr_yaw, prev_yaw, curr_pitch, prev_pitch):
    ear_change = abs(curr_ear - prev_ear)
    ear_penalty = min(ear_change * 100, 30)

    yaw_change = abs(curr_yaw - prev_yaw)
    pitch_change = abs(curr_pitch - prev_pitch)
    head_movement = np.sqrt(yaw_change ** 2 + pitch_change ** 2)
    head_penalty = min((head_movement / 15.0) ** 1.5 * 40, 40)

    stability_score = 100 - ear_penalty - head_penalty
    return max(0, min(100, stability_score))
