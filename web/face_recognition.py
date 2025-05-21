
import cv2
import pickle
import numpy as np
import os
import base64
import eel
from io import BytesIO
from PIL import Image
import threading
import time
import json

# Global variables for face recognition
face_recognition_data = {
    "labels": None,
    "faces": None,
    "classifier": None,
    "initialized": False,
}

# Thread lock to prevent concurrent access
lock = threading.Lock()

def initialize_face_recognition():
    """Initialize the face recognition data"""
    with lock:
        try:
            # Check if required files exist
            user_data_dir = 'user data'
            faces_path = os.path.join(user_data_dir, 'faces_data.pkl')
            names_path = os.path.join(user_data_dir, 'name.pkl')
            
            if not os.path.exists(faces_path) or not os.path.exists(names_path):
                print("Face recognition data not found. Please enroll faces first.")
                return False
                
            # Load the face data
            with open(names_path, 'rb') as f:
                face_recognition_data["labels"] = pickle.load(f)
            with open(faces_path, 'rb') as f:
                face_recognition_data["faces"] = pickle.load(f)
                
            print(f"Loaded {len(face_recognition_data['faces'])} face samples for {len(set(face_recognition_data['labels']))} unique individuals")
            
            # Initialize the KNN classifier
            from sklearn.neighbors import KNeighborsClassifier
            knn = KNeighborsClassifier(n_neighbors=5)
            knn.fit(face_recognition_data["faces"], face_recognition_data["labels"])
            face_recognition_data["classifier"] = knn
            face_recognition_data["initialized"] = True
            
            return True
        except Exception as e:
            print(f"Error initializing face recognition: {e}")
            return False

@eel.expose
def eel_recognize_face(image_data, confidence_threshold=0.65):
    """Recognize a face in the image data"""
    try:
        # Initialize face recognition if not already done
        if not face_recognition_data["initialized"]:
            if not initialize_face_recognition():
                return {"success": False, "error": "Face recognition data not available. Please enroll faces first."}
        
        # Decode image from base64
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Convert to OpenCV format
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"success": False, "error": "Failed to decode image"}
            
        # Create cascade classifier
        cascade_path = os.path.join('user data', 'haarcascade_frontalface_default.xml')
        if not os.path.exists(cascade_path):
            return {"success": False, "error": "Face detection model not found. Please place haarcascade_frontalface_default.xml in the 'user data' directory."}
            
        facedetect = cv2.CascadeClassifier(cascade_path)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply histogram equalization to improve contrast
        gray = cv2.equalizeHist(gray)
        
        # Detect faces
        faces = facedetect.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        # No faces detected
        if len(faces) == 0:
            return {"success": True, "detected": False, "message": "No faces detected in the image."}
        
        # Find the largest face (if multiple are detected)
        largest_face = None
        largest_area = 0
        
        for (x, y, w, h) in faces:
            area = w * h
            if area > largest_area:
                largest_area = area
                largest_face = (x, y, w, h)
        
        if largest_face is None:
            return {"success": True, "detected": False, "message": "Face detection failed."}
            
        # Extract and process the largest face
        x, y, w, h = largest_face
        face_img = frame[y:y+h, x:x+w, :]
        
        # Resize to match training data
        resized_img = cv2.resize(face_img, (50, 50)).flatten().reshape(1, -1)
        
        # Get prediction
        output = face_recognition_data["classifier"].predict(resized_img)
        probabilities = face_recognition_data["classifier"].predict_proba(resized_img)[0]
        max_prob_index = np.argmax(probabilities)
        confidence = probabilities[max_prob_index]
        
        # Get distance to nearest neighbor
        distances, indices = face_recognition_data["classifier"].kneighbors(resized_img)
        nearest_distance = distances[0][0]
        
        # Determine if the face is recognized
        recognized_name = output[0]
        
        # Set status based on confidence
        if confidence < confidence_threshold or nearest_distance > 25000:
            return {
                "success": True,
                "detected": True,
                "recognized": False,
                "message": "Face detected but not recognized"
            }
        else:
            # Look up employee details
            employees_file = "data/employees.xml"
            employee_details = None
            
            try:
                # Load employees from XML and find the matching one
                if os.path.exists(employees_file):
                    import xml.etree.ElementTree as ET
                    tree = ET.parse(employees_file)
                    root = tree.getroot()
                    
                    for employee in root.findall('./employee'):
                        name = employee.find('name').text
                        if name == recognized_name:
                            department = employee.find('department').text if employee.find('department') is not None else ""
                            position = employee.find('position').text if employee.find('position') is not None else ""
                            
                            employee_details = {
                                "name": name,
                                "department": department,
                                "position": position
                            }
                            break
            except Exception as e:
                print(f"Error retrieving employee details: {e}")
                
            # Record attendance
            try:
                # Generate timestamp
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                
                # Create or update attendance.xml
                attendance_file = "data/attendance.xml"
                
                if not os.path.exists(attendance_file):
                    # Create new file
                    root = ET.Element("attendance_records")
                    tree = ET.ElementTree(root)
                    os.makedirs(os.path.dirname(attendance_file), exist_ok=True)
                    tree.write(attendance_file)
                
                # Add new record
                tree = ET.parse(attendance_file)
                root = tree.getroot()
                
                record = ET.SubElement(root, "record")
                ET.SubElement(record, "employeeName").text = recognized_name
                ET.SubElement(record, "timestamp").text = timestamp
                ET.SubElement(record, "type").text = "IN"  # You could implement logic to determine IN or OUT
                
                tree.write(attendance_file)
            except Exception as e:
                print(f"Error recording attendance: {e}")
                
            return {
                "success": True,
                "detected": True,
                "recognized": True,
                "person": {
                    "name": recognized_name,
                    "confidence": float(confidence),
                    "details": employee_details
                }
            }
    except Exception as e:
        print(f"Error in face recognition: {e}")
        return {"success": False, "error": str(e)}
