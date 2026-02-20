# Classlens AI Engine

## Setup
```
cd ai-engine
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Runs on http://localhost:8000

## Endpoints

### GET /health
Check if server is running.
Response:
```json
{"status": "ok", "service": "Classlens AI Engine"}
```

### POST /analyze
Send a base64 webcam frame, get back an engagement score.

Request:
```json
{
  "image": "<base64 encoded jpeg frame>"
}
```

Response:
```json
{
  "score": 62,
  "details": {
    "face_present": true,
    "eye_contact_score": 50,
    "head_pose_score": 49,
    "pitch": -5.6,
    "yaw": 20.8
  }
}
```

## Score Breakdown
| Signal | Weight | Meaning |
|---|---|---|
| Face present | 25% | Is student in frame? |
| Eye openness | 35% | Are eyes open? |
| Head pose | 40% | Looking at screen? |

## How to call from frontend (JavaScript)
```javascript
const response = await axios.post('http://localhost:8000/analyze', {
  image: base64Frame  // no "data:image/jpeg;base64," prefix
});
const { score, details } = response.data;
