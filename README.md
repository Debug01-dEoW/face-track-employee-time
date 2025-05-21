
# FaceTrack - Face Recognition Attendance System

## Overview
FaceTrack is a web-based attendance tracking system that uses facial recognition for employee check-in and check-out.

## Features
- Face enrollment for employees
- Face recognition for attendance marking
- Attendance history and reporting
- Dark mode support
- Python-powered face recognition for high accuracy

## Technical Stack
### Frontend
- React with TypeScript
- Tailwind CSS
- Shadcn UI components
- React Router

### Backend (Python)
- Flask for the REST API
- face_recognition library (based on dlib)
- NumPy for numerical operations
- Pillow for image processing

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python 3.7+ (for the face recognition backend)
- Supabase account (for database and authentication)

### Frontend Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Python Face Recognition Backend Setup
1. Install the required Python libraries:
   ```
   pip install flask face_recognition numpy Pillow flask-cors
   ```
   
   **Note:** Installing the face_recognition library may require some additional steps on certain operating systems. 
   
   On Ubuntu/Debian:
   ```
   sudo apt-get install -y build-essential cmake
   sudo apt-get install -y libopenblas-dev liblapack-dev
   sudo apt-get install -y python3-dev python3-pip
   pip install dlib
   pip install face_recognition
   ```
   
   On Windows:
   - Install Visual Studio with C++ development tools
   - Then install dlib through pip
   
   On macOS:
   ```
   brew install cmake
   pip install dlib
   pip install face_recognition
   ```

2. Run the Python face recognition server:
   ```
   python face_recognition_server.py
   ```

3. The server will run on http://localhost:5000 by default

### Browser Compatibility
For the best face recognition experience:
- Use Chrome or Edge on Windows
- Use Safari on macOS
- Use Chrome on Android
- Use Safari on iOS

## Face Recognition Flow
1. **Enrollment**: Captures multiple images of an employee's face from different angles
2. **Processing**: Extracts facial features and creates encodings for recognition
3. **Recognition**: Matches captured faces against stored encodings

## System Architecture
- The React frontend handles UI and user interactions
- The Python backend processes face recognition tasks
- Communication happens via RESTful API calls
- Both local storage and server storage are used for redundancy

## Development Notes
- The frontend automatically falls back to local mode if the Python backend is unavailable
- The Python backend stores face encodings in a JSON file for persistence

## Troubleshooting
- If the Python server cannot start, ensure all dependencies are installed correctly
- If face recognition is not working, check that the server is running and accessible
- For camera issues, ensure browser permissions are granted
- Check browser console logs for any errors
