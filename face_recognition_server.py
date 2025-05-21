
"""
Face Recognition Server for FaceTrack Application

This Flask server provides face recognition functionality for the FaceTrack web application.
It uses face_recognition library (which is based on dlib) for accurate face detection and recognition.

Requirements:
- Python 3.7+
- Flask
- face_recognition
- numpy
- Pillow (PIL)
- flask-cors

Install dependencies:
pip install flask face_recognition numpy Pillow flask-cors

Run the server:
python face_recognition_server.py
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

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Directory to store face encodings
DATA_DIR = "face_data"
ENCODINGS_FILE = os.path.join(DATA_DIR, "encodings.json")

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# Load existing encodings if available
employee_encodings = {}
if os.path.exists(ENCODINGS_FILE):
    try:
        with open(ENCODINGS_FILE, 'r') as f:
            data = json.load(f)
            for employee_id, employee_data in data.items():
                # Convert string encodings back to numpy arrays
                encodings = [np.array(enc) for enc in employee_data["encodings"]]
                employee_encodings[employee_id] = {
                    "name": employee_data["name"],
                    "encodings": encodings
                }
        logger.info(f"Loaded {len(employee_encodings)} employee records from storage")
    except Exception as e:
        logger.error(f"Error loading encodings file: {e}")
else:
    logger.info("No existing encodings file found. Starting with empty database.")

def save_encodings():
    """Save face encodings to disk"""
    try:
        # Convert numpy arrays to lists for JSON serialization
        data = {}
        for employee_id, employee_data in employee_encodings.items():
            data[employee_id] = {
                "name": employee_data["name"],
                "encodings": [enc.tolist() for enc in employee_data["encodings"]]
            }
        
        with open(ENCODINGS_FILE, 'w') as f:
            json.dump(data, f)
        logger.info(f"Saved {len(employee_encodings)} employee records to storage")
        return True
    except Exception as e:
        logger.error(f"Error saving encodings file: {e}")
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
        
        # Store the encodings
        employee_encodings[employee_id] = {
            "name": employee_name,
            "encodings": valid_encodings
        }
        
        # Save to disk
        save_encodings()
        
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
        
        for employee_id, employee_data in employee_encodings.items():
            known_encodings = employee_data["encodings"]
            
            # Calculate face distances
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            
            # Convert distance to confidence (1 - distance)
            confidences = [1 - dist for dist in face_distances]
            
            # Use average confidence across all samples
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Use maximum confidence as an alternative
            # max_confidence = max(confidences) if confidences else 0
            
            # Consider a match if confidence exceeds threshold
            if avg_confidence > 0.6 and avg_confidence > best_confidence:
                best_match = {
                    "id": employee_id,
                    "name": employee_data["name"],
                    "confidence": avg_confidence
                }
                best_confidence = avg_confidence
        
        if best_match:
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
        employees = []
        for employee_id, employee_data in employee_encodings.items():
            employees.append({
                "id": employee_id,
                "name": employee_data["name"],
                "samples": len(employee_data["encodings"])
            })
        
        return jsonify({
            "success": True,
            "employees": employees
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
        if employee_id in employee_encodings:
            del employee_encodings[employee_id]
            save_encodings()
            return jsonify({
                "success": True,
                "message": f"Employee {employee_id} deleted"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Employee not found"
            }), 404
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
        total_employees = len(employee_encodings)
        total_samples = sum(len(data["encodings"]) for data in employee_encodings.values())
        
        return jsonify({
            "success": True,
            "stats": {
                "totalEmployees": total_employees,
                "totalSamples": total_samples
            }
        })
    except Exception as e:
        logger.error(f"Error in get_stats: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Face Recognition Server on port 5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
