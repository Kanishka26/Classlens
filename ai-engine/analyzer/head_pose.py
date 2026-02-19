import numpy as np
import cv2

MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),
    (0.0, -330.0, -65.0),
    (-225.0, 170.0, -135.0),
    (225.0, 170.0, -135.0),
    (-150.0, -150.0, -125.0),
    (150.0, -150.0, -125.0),
], dtype=np.float64)

FACE_POINT_INDICES = [1, 152, 263, 33, 287, 57]

def estimate_head_pose(landmarks, frame_shape):
    h, w = frame_shape[:2]
    
    image_points = np.array([
        (landmarks.landmark[i].x * w, landmarks.landmark[i].y * h)
        for i in FACE_POINT_INDICES
    ], dtype=np.float64)

    focal_length = w
    center = (w / 2, h / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float64)
    
    dist_coeffs = np.zeros((4, 1))

    success, rotation_vec, translation_vec = cv2.solvePnP(
        MODEL_POINTS, image_points, camera_matrix, dist_coeffs
    )

    if not success:
        return None

    rotation_mat, _ = cv2.Rodrigues(rotation_vec)
    pose_mat = cv2.hconcat([rotation_mat, translation_vec])
    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)

    # Flatten to make sure we get clean scalar values
    euler_angles = euler_angles.flatten()
    pitch = float(euler_angles[0])
    yaw = float(euler_angles[1])
    roll = float(euler_angles[2])

    return pitch, yaw, roll

def head_pose_score(pitch, yaw, roll):
    pitch = float(np.squeeze(pitch))
    yaw = float(np.squeeze(yaw))
    roll = float(np.squeeze(roll))
    
    yaw_penalty = min(abs(yaw) / 30.0, 1.0)
    pitch_penalty = min(abs(pitch) / 25.0, 1.0)
    score = 100 * (1 - 0.6 * yaw_penalty - 0.4 * pitch_penalty)
    return max(0, min(100, score))
