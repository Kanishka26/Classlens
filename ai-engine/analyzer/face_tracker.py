import mediapipe as mp
import cv2
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Eye landmark indices
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

def get_face_landmarks(frame):
    mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = mp_face_mesh.process(rgb)
    mp_face_mesh.close()
    
    if results.multi_face_landmarks:
        return results.multi_face_landmarks[0]
    return None

def get_eye_aspect_ratio(landmarks, eye_indices, frame_shape):
    h, w = frame_shape[:2]
    points = [
        (int(landmarks.landmark[i].x * w),
         int(landmarks.landmark[i].y * h))
        for i in eye_indices
    ]
    v1 = np.linalg.norm(np.array(points[1]) - np.array(points[5]))
    v2 = np.linalg.norm(np.array(points[2]) - np.array(points[4]))
    h1 = np.linalg.norm(np.array(points[0]) - np.array(points[3]))
    ear = (v1 + v2) / (2.0 * h1) if h1 > 0 else 0
    return ear