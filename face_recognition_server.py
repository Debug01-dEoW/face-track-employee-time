"""
Face Recognition Server for FaceTrack Application

This Flask server provides face recognition functionality for the FaceTrack web application.
It uses face_recognition library (which is based on dlib) for accurate face detection and recognition.
Eel is used for database operations and frontend communication.
Employee data is stored in XML format.

Requirements:
- Python 3.7+
- Flask
- face_recognition
- numpy
- Pillow (PIL)
- flask-cors
- eel
- lxml (for XML processing)

Install dependencies:
pip install flask face_recognition numpy Pillow flask-cors eel lxml
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
import xml.etree.ElementTree as ET
from lxml import etree
import pickle
import uuid
import threading

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Eel
eel.init('web')  # 'web' is the directory that contains the frontend files

# Directory to store XML data and face encodings
DATA_DIR = "face_data"
EMPLOYEES_XML = os.path.join(DATA_DIR, "employees.xml")
ATTENDANCE_XML = os.path.join(DATA_DIR, "attendance.xml")
ENCODINGS_FILE = os.path.join(DATA_DIR, "encodings.pkl")

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# Lock for thread safety when accessing XML files
xml_lock = threading.Lock()

# Cache for face encodings (for faster access)
employee_encodings_cache = {}

def initialize_xml_files():
    """Initialize XML files if they don't exist"""
    # Create employees XML if it doesn't exist
    if not os.path.exists(EMPLOYEES_XML):
        root = ET.Element("employees")
        tree = ET.ElementTree(root)
        tree.write(EMPLOYEES_XML, encoding='utf-8', xml_declaration=True)
        logger.info("Created new employees XML file")
    
    # Create attendance XML if it doesn't exist
    if not os.path.exists(ATTENDANCE_XML):
        root = ET.Element("attendance_records")
        tree = ET.ElementTree(root)
        tree.write(ATTENDANCE_XML, encoding='utf-8', xml_declaration=True)
        logger.info("Created new attendance XML file")

initialize_xml_files()

def get_employee_by_id(employee_id):
    """Get employee data by ID from XML"""
    try:
        with xml_lock:
            tree = ET.parse(EMPLOYEES_XML)
            root = tree.getroot()
            
            for employee in root.findall("employee"):
                if employee.get("id") == employee_id:
                    return {
                        "id": employee.get("id"),
                        "name": employee.find("name").text,
                        "department": employee.find("department").text if employee.find("department") is not None else "",
                        "position": employee.find("position").text if employee.find("position") is not None else "",
                        "created_at": employee.get("created_at")
                    }
        
        return None
    except Exception as e:
        logger.error(f"Error retrieving employee: {e}")
        return None

def save_employee(employee_id, name, department="", position=""):
    """Save employee data to XML"""
    try:
        with xml_lock:
            tree = ET.parse(EMPLOYEES_XML)
            root = tree.getroot()
            
            # Check if employee already exists
            existing = False
            for employee in root.findall("employee"):
                if employee.get("id") == employee_id:
                    existing = True
                    employee.find("name").text = name
                    if employee.find("department") is not None:
                        employee.find("department").text = department
                    else:
                        dept = ET.SubElement(employee, "department")
                        dept.text = department
                        
                    if employee.find("position") is not None:
                        employee.find("position").text = position
                    else:
                        pos = ET.SubElement(employee, "position")
                        pos.text = position
                    break
            
            # Add new employee if not found
            if not existing:
                employee = ET.SubElement(root, "employee")
                employee.set("id", employee_id)
                employee.set("created_at", datetime.now().isoformat())
                
                name_elem = ET.SubElement(employee, "name")
                name_elem.text = name
                
                dept = ET.SubElement(employee, "department")
                dept.text = department
                
                pos = ET.SubElement(employee, "position")
                pos.text = position
            
            # Write back to file
            tree.write(EMPLOYEES_XML, encoding='utf-8', xml_declaration=True)
            
            # Pretty print for better readability
            parser = etree.XMLParser(remove_blank_text=True)
            tree = etree.parse(EMPLOYEES_XML, parser)
            tree.write(EMPLOYEES_XML, encoding='utf-8', xml_declaration=True, pretty_print=True)
            
            return True
    except Exception as e:
        logger.error(f"Error saving employee: {e}")
        return False

def load_encodings_from_file():
    """Load face encodings from pickle file"""
    if os.path.exists(ENCODINGS_FILE):
        try:
            with open(ENCODINGS_FILE, 'rb') as f:
                global employee_encodings_cache
                employee_encodings_cache = pickle.load(f)
            logger.info(f"Loaded {len(employee_encodings_cache)} employee encodings from file")
            return True
        except Exception as e:
            logger.error(f"Error loading encodings file: {e}")
            return False
    else:
        logger.info("No existing encodings file found")
        return False

# Try loading existing encodings
load_encodings_from_file()

def save_encodings_to_file():
    """Save face encodings to pickle file"""
    try:
        with open(ENCODINGS_FILE, 'wb') as f:
            pickle.dump(employee_encodings_cache, f)
        logger.info(f"Saved {len(employee_encodings_cache)} employee encodings to file")
        return True
    except Exception as e:
        logger.error(f"Error saving encodings file: {e}")
        return False

def record_attendance(employee_id, attendance_type="IN"):
    """Record an attendance entry in the XML file"""
    try:
        with xml_lock:
            tree = ET.parse(ATTENDANCE_XML)
            root = tree.getroot()
            
            record = ET.SubElement(root, "record")
            record.set("id", str(uuid.uuid4()))
            record.set("employee_id", employee_id)
            record.set("timestamp", datetime.now().isoformat())
            record.set("type", attendance_type)
            
            # Write back to file
            tree.write(ATTENDANCE_XML, encoding='utf-8', xml_declaration=True)
            
            # Pretty print for better readability
            parser = etree.XMLParser(remove_blank_text=True)
            tree = etree.parse(ATTENDANCE_XML, parser)
            tree.write(ATTENDANCE_XML, encoding='utf-8', xml_declaration=True, pretty_print=True)
            
            logger.info(f"Recorded {attendance_type} attendance for employee {employee_id}")
            return True
    except Exception as e:
        logger.error(f"Error recording attendance: {e}")
        return False

def get_all_employees():
    """Get all employees from XML"""
    try:
        with xml_lock:
            tree = ET.parse(EMPLOYEES_XML)
            root = tree.getroot()
            
            employees = []
            for employee in root.findall("employee"):
                employees.append({
                    "id": employee.get("id"),
                    "name": employee.find("name").text,
                    "department": employee.find("department").text if employee.find("department") is not None else "",
                    "position": employee.find("position").text if employee.find("position") is not None else "",
                    "created_at": employee.get("created_at"),
                    "samples": len(employee_encodings_cache.get(employee.get("id"), {}).get("encodings", [])),
                })
            
            return employees
    except Exception as e:
        logger.error(f"Error getting all employees: {e}")
        return []

def get_attendance_records(limit=100):
    """Get attendance records from XML"""
    try:
        with xml_lock:
            tree = ET.parse(ATTENDANCE_XML)
            root = tree.getroot()
            
            records = []
            for record in root.findall("record"):
                employee_id = record.get("employee_id")
                employee = get_employee_by_id(employee_id)
                
                records.append({
                    "id": record.get("id"),
                    "employeeId": employee_id,
                    "employeeName": employee["name"] if employee else "Unknown",
                    "timestamp": record.get("timestamp"),
                    "type": record.get("type")
                })
            
            # Sort by timestamp desc and limit records
            records.sort(key=lambda x: x["timestamp"], reverse=True)
            return records[:limit]
    except Exception as e:
        logger.error(f"Error getting attendance records: {e}")
        return []

def delete_employee(employee_id):
    """Delete an employee and their data"""
    try:
        # Delete from XML
        with xml_lock:
            tree = ET.parse(EMPLOYEES_XML)
            root = tree.getroot()
            
            for employee in root.findall("employee"):
                if employee.get("id") == employee_id:
                    root.remove(employee)
                    tree.write(EMPLOYEES_XML, encoding='utf-8', xml_declaration=True)
                    
                    # Pretty print for better readability
                    parser = etree.XMLParser(remove_blank_text=True)
                    tree = etree.parse(EMPLOYEES_XML, parser)
                    tree.write(EMPLOYEES_XML, encoding='utf-8', xml_declaration=True, pretty_print=True)
                    break
        
        # Remove from encodings cache
        if employee_id in employee_encodings_cache:
            del employee_encodings_cache[employee_id]
            save_encodings_to_file()
            
        return True
    except Exception as e:
        logger.error(f"Error deleting employee: {e}")
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
    return get_all_employees()

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
        
        # Store employee data
        save_employee(employee_id, name, department, position)
        
        # Update cache
        employee_encodings_cache[employee_id] = {
            "name": name,
            "encodings": valid_encodings
        }
        
        # Save to file
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

@eel.expose
def get_attendance_records(limit=100):
    """Get attendance records via Eel"""
    return get_attendance_records(limit)

@eel.expose
def delete_employee(employee_id):
    """Delete an employee via Eel"""
    return delete_employee(employee_id)

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
        
        # Save employee data
        save_employee(employee_id, employee_name, department, position)
        
        # Update cache
        employee_encodings_cache[employee_id] = {
            "name": employee_name,
            "encodings": valid_encodings
        }
        
        # Save encodings to file
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
        employees = get_all_employees()
        
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
def delete_employee_endpoint(employee_id):
    """Delete an employee's face data"""
    try:
        success = delete_employee(employee_id)
        
        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to delete employee"
            }), 500
            
        return jsonify({
            "success": True,
            "message": f"Employee {employee_id} deleted"
        })
    except Exception as e:
        logger.error(f"Error in delete_employee_endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    try:
        employees = get_all_employees()
        
        # Count face samples
        total_samples = 0
        for employee_id in employee_encodings_cache:
            total_samples += len(employee_encodings_cache[employee_id]["encodings"])
        
        # Count attendance records
        with xml_lock:
            tree = ET.parse(ATTENDANCE_XML)
            root = tree.getroot()
            total_attendance = len(root.findall("record"))
        
        return jsonify({
            "success": True,
            "stats": {
                "totalEmployees": len(employees),
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
        records = get_attendance_records(limit=100)
        
        return jsonify({
            "success": True,
            "records": records
        })
    except Exception as e:
        logger.error(f"Error in get_attendance: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Run Flask and Eel together
if __name__ == '__main__':
    logger.info("Starting Face Recognition Server with Eel and XML storage on port 5000")
    
    # Start Eel in a separate thread
    import threading
    threading.Thread(target=eel.start, args=('index.html', {'port': 8000}), daemon=True).start()
    
    # Run Flask
    app.run(host='0.0.0.0', port=5000, debug=True)
