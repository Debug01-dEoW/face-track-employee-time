
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
- Plain HTML, CSS, and JavaScript (no Node.js required)
- Responsive design with CSS Grid and Flexbox
- Dark mode support with localStorage persistence

### Backend (Python)
- Flask for the REST API
- Eel for database operations and JavaScript-Python communication
- face_recognition library (based on dlib)
- XML file storage for employee data
- NumPy for numerical operations
- Pillow for image processing

## Setup Instructions

### Prerequisites
- Python 3.7+ (for the face recognition backend)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Backend Setup
1. Create a Python virtual environment (recommended):
   ```
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

2. Install the required Python libraries:
   ```
   pip install flask face_recognition numpy Pillow flask-cors eel lxml
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

3. Run the Python face recognition server:
   ```
   python face_recognition_server.py
   ```

4. The Flask server will run on http://localhost:5000 by default
   The Eel web interface will automatically open in your browser at http://localhost:8000

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
- The HTML/CSS/JS frontend handles UI and user interactions
- The Python backend processes face recognition tasks
- Communication happens via RESTful API calls and Eel
- XML files store employee data, face encodings, and attendance records

## XML Data Structure
1. **employees.xml**: Stores employee information
   - id: Employee ID (attribute)
   - name: Employee name (element)
   - department: Department (element)
   - position: Position (element)
   - created_at: Timestamp (attribute)

2. **attendance.xml**: Stores attendance records
   - id: UUID (attribute)
   - employee_id: Foreign key to employees (attribute)
   - timestamp: Check-in/out timestamp (attribute)
   - type: Attendance type (IN/OUT) (attribute)

3. **encodings.pkl**: Face encoding data stored in pickle format for performance

## Development Notes
- The frontend automatically falls back to mock data if the Python backend is unavailable
- The Python backend stores face encodings in both a pickle file for fast access

## Troubleshooting
- If the Python server cannot start, ensure all dependencies are installed correctly
- If face recognition is not working, check that the server is running and accessible
- For camera issues, ensure browser permissions are granted
- Check browser console logs and Python server logs for any errors
