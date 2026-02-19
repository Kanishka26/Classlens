import cv2
import base64
import requests

print("Starting webcam... press SPACE to capture, Q to quit")

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Can't access webcam!")
        break

    cv2.imshow("Classlens - Press SPACE to test", frame)
    key = cv2.waitKey(1)

    if key == ord(' '):
        # Capture frame and send to AI engine
        _, buffer = cv2.imencode('.jpg', frame)
        b64 = base64.b64encode(buffer).decode('utf-8')

        response = requests.post(
            'http://127.0.0.1:8000/analyze',
            json={'image': b64}
        )
        result = response.json()
        print("Raw response:", result)
        print("\n--- Engagement Result ---")
        print(f"Score:       {result['score']}%")
        print(f"Face found:  {result['details']['face_present']}")
        print(f"Eyes score:  {result['details']['eye_contact_score']}%")
        print(f"Head score:  {result['details']['head_pose_score']}%")
        print(f"Yaw:         {result['details']['yaw']} degrees")
        print(f"Pitch:       {result['details']['pitch']} degrees")
        print("-------------------------")

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
