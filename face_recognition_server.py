
"""
Face Recognition Server for FaceTrack Application

This Flask server provides face recognition functionality for the FaceTrack web application.
It uses face_recognition library (which is based on dlib) for accurate face detection and recognition.
Eel is used for database operations and frontend communication.

Requirements:
- Python 3.7+
- Flask
- face_recognition
- numpy
- Pillow (PIL)
- flask-cors
- eel

Install dependencies:
pip install flask face_recognition numpy Pillow flask-cors eel
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import json
import os
import base64
import io
from PIL import Image
import time
from datetime import datetime
import logging
import eel
import sqlite3

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Eel
eel.init('web')  # 'web' is the directory that contains the frontend files

# Database setup
DB_PATH = "face_data/facetrack.db"
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def init_db():
    """Initialize the SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        position TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS face_encodings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        encoding BLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized")

# Call init_db to ensure tables exist
init_db()

# Directory to store face encodings as backup
DATA_DIR = "face_data"
ENCODINGS_FILE = os.path.join(DATA_DIR, "encodings.json")

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# Cache for face encodings (for faster access)
employee_encodings_cache = {}

def load_encodings_from_db():
    """Load face encodings from the database into cache"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get all employees with their face encodings
        cursor.execute('''
        SELECT e.id, e.name, f.encoding 
        FROM employees e
        LEFT JOIN face_encodings f ON e.id = f.employee_id
        ''')
        
        results = cursor.fetchall()
        
        # Group by employee
        for employee_id, name, encoding_blob in results:
            if encoding_blob:  # Some employees might not have encodings yet
                if employee_id not in employee_encodings_cache:
                    employee_encodings_cache[employee_id] = {
                        "name": name,
                        "encodings": []
                    }
                
                # Convert BLOB to numpy array
                encoding = np.frombuffer(encoding_blob, dtype=np.float64)
                employee_encodings_cache[employee_id]["encodings"].append(encoding)
        
        conn.close()
        logger.info(f"Loaded {len(employee_encodings_cache)} employee records from database")
        return True
    except Exception as e:
        logger.error(f"Error loading encodings from database: {e}")
        return False

# Load existing encodings from file as backup
def load_encodings_from_file():
    """Load face encodings from file as backup"""
    if os.path.exists(ENCODINGS_FILE):
        try:
            with open(ENCODINGS_FILE, 'r') as f:
                data = json.load(f)
                for employee_id, employee_data in data.items():
                    # Convert string encodings back to numpy arrays
                    encodings = [np.array(enc) for enc in employee_data["encodings"]]
                    employee_encodings_cache[employee_id] = {
                        "name": employee_data["name"],
                        "encodings": encodings
                    }
            logger.info(f"Loaded {len(employee_encodings_cache)} employee records from file backup")
            return True
        except Exception as e:
            logger.error(f"Error loading encodings file: {e}")
            return False
    else:
        logger.info("No existing encodings file found")
        return False

# Try loading from DB first, then from file
if not load_encodings_from_db():
    load_encodings_from_file()

def save_encodings_to_db(employee_id, name, encodings, department="", position=""):
    """Save face encodings to the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if employee exists
        cursor.execute("SELECT id FROM employees WHERE id = ?", (employee_id,))
        if not cursor.fetchone():
            # Add employee if they don't exist
            cursor.execute(
                "INSERT INTO employees (id, name, department, position) VALUES (?, ?, ?, ?)",
                (employee_id, name, department, position)
            )
        
        # Add encodings
        for encoding in encodings:
            # Convert numpy array to BLOB
            encoding_blob = encoding.tobytes()
            cursor.execute(
                "INSERT INTO face_encodings (employee_id, encoding) VALUES (?, ?)",
                (employee_id, encoding_blob)
            )
        
        conn.commit()
        conn.close()
        logger.info(f"Saved {len(encodings)} encodings for employee {employee_id} to database")
        return True
    except Exception as e:
        logger.error(f"Error saving encodings to database: {e}")
        return False

def save_encodings_to_file():
    """Save face encodings to file as backup"""
    try:
        # Convert numpy arrays to lists for JSON serialization
        data = {}
        for employee_id, employee_data in employee_encodings_cache.items():
            data[employee_id] = {
                "name": employee_data["name"],
                "encodings": [enc.tolist() for enc in employee_data["encodings"]]
            }
        
        with open(ENCODINGS_FILE, 'w') as f:
            json.dump(data, f)
        logger.info(f"Saved {len(employee_encodings_cache)} employee records to file backup")
        return True
    except Exception as e:
        logger.error(f"Error saving encodings file: {e}")
        return False

def record_attendance(employee_id, attendance_type="IN"):
    """Record an attendance entry in the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO attendance (employee_id, type) VALUES (?, ?)",
            (employee_id, attendance_type)
        )
        
        conn.commit()
        conn.close()
        logger.info(f"Recorded {attendance_type} attendance for employee {employee_id}")
        return True
    except Exception as e:
        logger.error(f"Error recording attendance: {e}")
        return False

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    try:
        # If there's a data URL prefix, remove it
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 string
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        return image
    except Exception as e:
        logger.error(f"Error converting base64 to image: {e}")
        return None

def process_face_image(image):
    """Process image and extract face encoding"""
    try:
        # Convert PIL Image to numpy array
        rgb_image = np.array(image)
        
        # Find all face locations in the image
        face_locations = face_recognition.face_locations(rgb_image)
        
        if not face_locations:
            logger.warning("No faces found in image")
            return None
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        if not face_encodings:
            logger.warning("Failed to encode face")
            return None
        
        # Return the first face encoding
        return face_encodings[0]
    except Exception as e:
        logger.error(f"Error processing face image: {e}")
        return None

# Expose functions to JavaScript via Eel
@eel.expose
def eel_get_employees():
    """Get all employees via Eel"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, department, position FROM employees")
        employees = cursor.fetchall()
        
        # Convert to list of dictionaries
        result = []
        for emp in employees:
            result.append({
                "id": emp[0],
                "name": emp[1],
                "department": emp[2] or "",
                "position": emp[3] or ""
            })
        
        conn.close()
        return result
    except Exception as e:
        logger.error(f"Error getting employees via Eel: {e}")
        return []

@eel.expose
def eel_enroll_face(employee_id, name, face_data, department="", position=""):
    """Enroll a face via Eel"""
    try:
        # Parse the face data
        face_samples = json.loads(face_data)["samples"]
        
        # Process each face sample
        valid_encodings = []
        for sample in face_samples:
            image = base64_to_image(sample)
            if not image:
                continue
                
            encoding = process_face_image(image)
            if encoding is not None:
                valid_encodings.append(encoding)
        
        if not valid_encodings:
            return {"success": False, "error": "No valid face encodings could be extracted"}
        
        # Store in database
        save_encodings_to_db(employee_id, name, valid_encodings, department, position)
        
        # Update cache
        employee_encodings_cache[employee_id] = {
            "name": name,
            "encodings": valid_encodings
        }
        
        # Save to file as backup
        save_encodings_to_file()
        
        return {"success": True, "samples": len(valid_encodings)}
    except Exception as e:
        logger.error(f"Error in eel_enroll_face: {e}")
        return {"success": False, "error": str(e)}

@eel.expose
def eel_recognize_face(image_data):
    """Recognize a face via Eel"""
    try:
        # Convert base64 to image
        image = base64_to_image(image_data)
        if not image:
            return {"success": False, "error": "Invalid image data"}
        
        # Process the face
        face_encoding = process_face_image(image)
        if face_encoding is None:
            return {"success": False, "error": "No face detected in image"}
        
        # Compare against known faces
        best_match = None
        best_confidence = 0
        
        for employee_id, employee_data in employee_encodings_cache.items():
            known_encodings = employee_data["encodings"]
            
            # Calculate face distances
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            
            # Convert distance to confidence (1 - distance)
            confidences = [1 - dist for dist in face_distances]
            
            # Use average confidence across all samples
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Consider a match if confidence exceeds threshold
            if avg_confidence > 0.6 and avg_confidence > best_confidence:
                best_match = {
                    "id": employee_id,
                    "name": employee_data["name"],
                    "confidence": avg_confidence
                }
                best_confidence = avg_confidence
        
        if best_match:
            # Record attendance
            record_attendance(best_match["id"])
            return {"success": True, "person": best_match}
        else:
            return {"success": True, "person": None, "message": "No match found"}
    except Exception as e:
        logger.error(f"Error in eel_recognize_face: {e}")
        return {"success": False, "error": str(e)}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint to check if the server is running"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route('/api/enroll', methods=['POST'])
def enroll_face():
    """Enroll a new face in the system"""
    try:
        data = request.json
        employee_id = str(data.get('employeeId'))
        employee_name = data.get('employeeName')
        face_samples = data.get('faceSamples', [])
        department = data.get('department', '')
        position = data.get('position', '')
        
        if not employee_id or not employee_name or not face_samples:
            return jsonify({
                "success": False,
                "error": "Missing required fields"
            }), 400
        
        # Process each face sample
        valid_encodings = []
        for sample in face_samples:
            image = base64_to_image(sample)
            if not image:
                continue
                
            encoding = process_face_image(image)
            if encoding is not None:
                valid_encodings.append(encoding)
        
        if not valid_encodings:
            return jsonify({
                "success": False,
                "error": "No valid face encodings could be extracted"
            }), 400
        
        # Store in database
        save_encodings_to_db(employee_id, employee_name, valid_encodings, department, position)
        
        # Update cache
        employee_encodings_cache[employee_id] = {
            "name": employee_name,
            "encodings": valid_encodings
        }
        
        # Save to file as backup
        save_encodings_to_file()
        
        return jsonify({
            "success": True,
            "employeeId": employee_id,
            "message": f"Successfully enrolled {len(valid_encodings)} face samples for {employee_name}"
        })
    except Exception as e:
        logger.error(f"Error in enroll_face: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/recognize', methods=['POST'])
def recognize_face():
    """Recognize a face from an image"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({
                "success": False,
                "error": "No image provided"
            }), 400
        
        # Convert base64 to image
        image = base64_to_image(image_data)
        if not image:
            return jsonify({
                "success": False,
                "error": "Invalid image data"
            }), 400
        
        # Process the face
        face_encoding = process_face_image(image)
        if face_encoding is None:
            return jsonify({
                "success": False,
                "error": "No face detected in image"
            }), 400
        
        # Compare against known faces
        best_match = None
        best_confidence = 0
        
        for employee_id, employee_data in employee_encodings_cache.items():
            known_encodings = employee_data["encodings"]
            
            # Calculate face distances
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            
            # Convert distance to confidence (1 - distance)
            confidences = [1 - dist for dist in face_distances]
            
            # Use average confidence across all samples
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Consider a match if confidence exceeds threshold
            if avg_confidence > 0.6 and avg_confidence > best_confidence:
                best_match = {
                    "id": employee_id,
                    "name": employee_data["name"],
                    "confidence": avg_confidence
                }
                best_confidence = avg_confidence
        
        if best_match:
            # Record attendance
            record_attendance(best_match["id"])
            return jsonify({
                "success": True,
                "person": best_match
            })
        else:
            return jsonify({
                "success": True,
                "person": None,
                "message": "No match found"
            })
    except Exception as e:
        logger.error(f"Error in recognize_face: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/employees', methods=['GET'])
def list_employees():
    """List all enrolled employees"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT e.id, e.name, e.department, e.position, COUNT(f.id) as sample_count
        FROM employees e
        LEFT JOIN face_encodings f ON e.id = f.employee_id
        GROUP BY e.id
        ''')
        
        employees = cursor.fetchall()
        result = []
        
        for emp in employees:
            result.append({
                "id": emp[0],
                "name": emp[1],
                "department": emp[2] or "",
                "position": emp[3] or "",
                "samples": emp[4]
            })
        
        conn.close()
        
        return jsonify({
            "success": True,
            "employees": result
        })
    except Exception as e:
        logger.error(f"Error in list_employees: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/employees/<employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    """Delete an employee's face data"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete face encodings first (due to foreign key constraint)
        cursor.execute("DELETE FROM face_encodings WHERE employee_id = ?", (employee_id,))
        
        # Delete attendance records
        cursor.execute("DELETE FROM attendance WHERE employee_id = ?", (employee_id,))
        
        # Delete employee
        cursor.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
        
        # Check if any rows were affected
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                "success": False,
                "error": "Employee not found"
            }), 404
        
        conn.commit()
        conn.close()
        
        # Remove from cache
        if employee_id in employee_encodings_cache:
            del employee_encodings_cache[employee_id]
            
        # Update backup file
        save_encodings_to_file()
        
        return jsonify({
            "success": True,
            "message": f"Employee {employee_id} deleted"
        })
    except Exception as e:
        logger.error(f"Error in delete_employee: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Count employees
        cursor.execute("SELECT COUNT(*) FROM employees")
        total_employees = cursor.fetchone()[0]
        
        # Count face samples
        cursor.execute("SELECT COUNT(*) FROM face_encodings")
        total_samples = cursor.fetchone()[0]
        
        # Count attendance records
        cursor.execute("SELECT COUNT(*) FROM attendance")
        total_attendance = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            "success": True,
            "stats": {
                "totalEmployees": total_employees,
                "totalSamples": total_samples,
                "totalAttendance": total_attendance
            }
        })
    except Exception as e:
        logger.error(f"Error in get_stats: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    """Get attendance records"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT a.id, a.employee_id, e.name, a.timestamp, a.type
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        ORDER BY a.timestamp DESC
        LIMIT 100
        ''')
        
        records = cursor.fetchall()
        result = []
        
        for rec in records:
            result.append({
                "id": rec[0],
                "employeeId": rec[1],
                "employeeName": rec[2],
                "timestamp": rec[3],
                "type": rec[4]
            })
        
        conn.close()
        
        return jsonify({
            "success": True,
            "records": result
        })
    except Exception as e:
        logger.error(f"Error in get_attendance: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Run Flask and Eel together
if __name__ == '__main__':
    logger.info("Starting Face Recognition Server with Eel and SQLite on port 5000")
    
    # Start Eel in a separate thread
    import threading
    threading.Thread(target=eel.start, args=('index.html', {'port': 8000}), daemon=True).start()
    
    # Run Flask
    app.run(host='0.0.0.0', port=5000, debug=True)
