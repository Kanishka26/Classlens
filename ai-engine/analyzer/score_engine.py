from analyzer.face_tracker import get_face_landmarks, get_eye_aspect_ratio, LEFT_EYE, RIGHT_EYE
from analyzer.head_pose import estimate_head_pose, head_pose_score
import numpy as np

# Enhanced weights for better accuracy
WEIGHTS = {
    "face_present": 0.15,      # Face detection quality (improved from 0.25)
    "eye_openness": 0.40,      # Eye contact is critical for engagement (improved from 0.35)
    "head_pose":    0.35,      # Head pose/attention (reduced from 0.40)
    "attention_stability": 0.10  # NEW: Reward consistent attention
}

# Eye aspect ratio thresholds for different states
EAR_CLOSED = 0.15            # Eyes closed
EAR_DROWSY = 0.22            # Eyes drowsy/mostly closed
EAR_NORMAL = 0.30            # Eyes normally open
EAR_WIDE = 0.40              # Eyes wide open (peak engagement)

# Store previous state for attention stability
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
        # No face detected = 0 engagement
        result["score"] = 0
        return result

    result["details"]["face_present"] = True
    
    # 1. FACE DETECTION CONFIDENCE SCORE (0-100)
    # Students in frame = better engagement setup
    face_score = 95  # Good: Face is detected and visible

    # 2. IMPROVED EYE OPENNESS SCORE (0-100)
    # Multi-level scoring instead of binary
    left_ear = get_eye_aspect_ratio(landmarks, LEFT_EYE, frame.shape)
    right_ear = get_eye_aspect_ratio(landmarks, RIGHT_EYE, frame.shape)
    avg_ear = (left_ear + right_ear) / 2.0
    
    # Classify eye state and calculate score
    if avg_ear < EAR_CLOSED:
        # Eyes closed - very low engagement
        eye_score = 10
        eye_state = "closed"
    elif avg_ear < EAR_DROWSY:
        # Eyes drowsy - student might be sleepy
        eye_scale = (avg_ear - EAR_CLOSED) / (EAR_DROWSY - EAR_CLOSED)
        eye_score = 10 + eye_scale * 35  # 10-45
        eye_state = "drowsy"
    elif avg_ear < EAR_NORMAL:
        # Eyes normally open - engaged
        eye_scale = (avg_ear - EAR_DROWSY) / (EAR_NORMAL - EAR_DROWSY)
        eye_score = 45 + eye_scale * 40  # 45-85
        eye_state = "normal"
    else:
        # Eyes wide open - very engaged
        eye_scale = min((avg_ear - EAR_NORMAL) / (EAR_WIDE - EAR_NORMAL), 1.0)
        eye_score = 85 + eye_scale * 15  # 85-100
        eye_state = "wide_open"
    
    result["details"]["eye_contact_score"] = round(eye_score)
    result["details"]["eye_state"] = eye_state

    # 3. ENHANCED HEAD POSE SCORE (0-100)
    # Using Gaussian curves for smoother transitions
    pose = estimate_head_pose(landmarks, frame.shape)
    if pose:
        pitch, yaw, roll = pose
        hp_score = compute_head_pose_score(pitch, yaw, roll)
        result["details"]["head_pose_score"] = round(hp_score)
        result["details"]["pitch"] = round(pitch, 1)
        result["details"]["yaw"] = round(yaw, 1)
    else:
        hp_score = 50

    # 4. NEW: ATTENTION STABILITY SCORE (0-100)
    # Reward consistent attention, penalize sudden movements
    stability_score = compute_attention_stability(
        avg_ear, 
        _previous_state["eye_ear"],
        pose[1] if pose else 0,
        _previous_state["head_yaw"],
        pose[0] if pose else 0,
        _previous_state["head_pitch"]
    )
    
    result["details"]["attention_stability_score"] = round(stability_score)

    # Update previous state for next frame
    if pose:
        _previous_state["eye_ear"] = avg_ear
        _previous_state["head_yaw"] = pose[1]
        _previous_state["head_pitch"] = pose[0]
    else:
        _previous_state["eye_ear"] = avg_ear

    # Final weighted score with new formula
    final_score = (
        WEIGHTS["face_present"] * face_score +
        WEIGHTS["eye_openness"] * eye_score +
        WEIGHTS["head_pose"] * hp_score +
        WEIGHTS["attention_stability"] * stability_score
    )

    # Apply non-linear scaling for better discrimination at high engagement
    # This emphasizes the difference between good and excellent engagement
    normalized_score = final_score / 100.0
    if normalized_score > 0.5:
        # Slightly boost high engagement scores
        normalized_score = 0.5 + (normalized_score - 0.5) ** 0.85 * 0.5
    else:
        # Keep low engagement scores proportional
        normalized_score = normalized_score ** 1.1

    result["score"] = round(max(0, min(100, normalized_score * 100)))
    return result


def compute_head_pose_score(pitch, yaw, roll):
    """
    Enhanced head pose scoring using Gaussian curves
    instead of linear penalties for smoother transitions
    """
    pitch = float(np.squeeze(pitch))
    yaw = float(np.squeeze(yaw))
    roll = float(np.squeeze(roll))
    
    # Gaussian curves centered at ideal position (looking at screen)
    # Ideal: pitch ≈ -15° (slight downward), yaw ≈ 0° (forward)
    
    # YAW penalty (side-to-side movement) - most important
    # Peak engagement at 0°, falls off as student looks away
    yaw_gaussian = np.exp(-((yaw ** 2) / (2 * 25 ** 2)))  # sigma = 25°
    
    # PITCH penalty (up-down movement)
    # Ideal around -15° (looking at screen naturally)
    # Penalizes looking too high (distraction) or too low (sleeping)
    pitch_offset = pitch + 15
    pitch_gaussian = np.exp(-((pitch_offset ** 2) / (2 * 30 ** 2)))  # sigma = 30°
    
    # ROLL penalty (head tilt) - minor effect
    # Slight tilt is okay, extreme tilt suggests distraction or discomfort
    roll_gaussian = np.exp(-((abs(roll) ** 2) / (2 * 35 ** 2)))  # sigma = 35°
    
    # Weighted combination
    hp_score = 100 * (
        0.5 * yaw_gaussian +      # Yaw is most critical (50%)
        0.35 * pitch_gaussian +   # Pitch is important (35%)
        0.15 * roll_gaussian      # Roll is minor (15%)
    )
    
    return max(0, min(100, hp_score))


def compute_attention_stability(curr_ear, prev_ear, curr_yaw, prev_yaw, curr_pitch, prev_pitch):
    """
    Score based on attention consistency
    Reward smooth attention, penalize sudden jerky movements
    """
    # Eye aspect ratio changes
    ear_change = abs(curr_ear - prev_ear)
    ear_penalty = min(ear_change * 100, 30)  # Max 30 point penalty
    
    # Head movement smoothness
    yaw_change = abs(curr_yaw - prev_yaw)
    pitch_change = abs(curr_pitch - prev_pitch)
    head_movement = np.sqrt(yaw_change ** 2 + pitch_change ** 2)
    
    # Penalize rapid head movements (> 10° per frame is jerky)
    head_penalty = min((head_movement / 15.0) ** 1.5 * 40, 40)  # Max 40 point penalty
    
    # Base score starts high, penalties reduce it
    stability_score = 100 - ear_penalty - head_penalty
    
    return max(0, min(100, stability_score))