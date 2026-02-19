from analyzer.face_tracker import get_face_landmarks, get_eye_aspect_ratio, LEFT_EYE, RIGHT_EYE
from analyzer.head_pose import estimate_head_pose, head_pose_score

# How much each signal contributes to the final score
WEIGHTS = {
    "face_present": 0.25,  # Is the student in frame?
    "eye_openness": 0.35,  # Are their eyes open?
    "head_pose":    0.40,  # Are they looking at the screen?
}

EAR_THRESHOLD_OPEN = 0.25  # Below this = eyes likely closed

def compute_engagement_score(frame):
    result = {
        "score": 0,
        "details": {
            "face_present": False,
            "eye_contact_score": 0,
            "head_pose_score": 0,
            "pitch": 0,
            "yaw": 0,
        }
    }

    landmarks = get_face_landmarks(frame)

    if landmarks is None:
        # No face detected = 0 engagement
        result["score"] = 0
        return result

    result["details"]["face_present"] = True
    face_score = 100

    # Eye openness score
    left_ear = get_eye_aspect_ratio(landmarks, LEFT_EYE, frame.shape)
    right_ear = get_eye_aspect_ratio(landmarks, RIGHT_EYE, frame.shape)
    avg_ear = (left_ear + right_ear) / 2.0

    if avg_ear < EAR_THRESHOLD_OPEN:
        eye_score = min(100, (avg_ear / EAR_THRESHOLD_OPEN) * 100)
    else:
        eye_score = 100

    result["details"]["eye_contact_score"] = round(eye_score)

    # Head pose score
    pose = estimate_head_pose(landmarks, frame.shape)
    if pose:
        pitch, yaw, roll = pose
        hp_score = head_pose_score(pitch, yaw, roll)
        result["details"]["head_pose_score"] = round(hp_score)
        result["details"]["pitch"] = round(pitch, 1)
        result["details"]["yaw"] = round(yaw, 1)
    else:
        hp_score = 50

    # Final weighted score
    final_score = (
        WEIGHTS["face_present"] * face_score +
        WEIGHTS["eye_openness"] * eye_score +
        WEIGHTS["head_pose"]    * hp_score
    )

    result["score"] = round(max(0, min(100, final_score)))
    return result