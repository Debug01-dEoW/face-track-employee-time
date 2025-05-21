
import os
import cv2
import numpy as np
import pickle
import time
from datetime import datetime
import sys
import eel

# Create directories if they don't exist
user_data_dir = 'user data'
if not os.path.exists(user_data_dir):
    os.makedirs(user_data_dir)

if not os.path.exists('Student images'):
    os.makedirs('Student images')

# Check for cascade file
cascade_path = os.path.join(user_data_dir, 'haarcascade_frontalface_default.xml')
if not os.path.exists(cascade_path):
    # Download the file if it doesn't exist
    try:
        import urllib.request
        print("Downloading face detection model...")
        cascade_url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
        urllib.request.urlretrieve(cascade_url, cascade_path)
        print("Download complete!")
    except Exception as e:
        print(f"Error downloading face detection model: {e}")
        print("Please download the file manually and place it in the 'user data' directory.")
        sys.exit(1)

def get_largest_face(faces):
    """Return the largest face in the list of faces detected."""
    if len(faces) == 0:
        return None
    
    # Find the face with the largest area
    largest_area = 0
    largest_face = None
    
    for (x, y, w, h) in faces:
        area = w * h
        if area > largest_area:
            largest_area = area
            largest_face = (x, y, w, h)
    
    return largest_face

@eel.expose
def eel_start_face_enrollment(username):
    """Start face enrollment process via Eel"""
    print(f"\n{'='*50}")
    print(f"Starting face sample collection for user: {username}")
    print(f"{'='*50}")
    
    # Return success to indicate enrollment can begin
    return {"success": True, "message": f"Ready to collect face samples for {username}"}

@eel.expose
def eel_save_face_snapshot(image_data, index):
    """Save a face snapshot captured via the web interface"""
    try:
        # Remove data URL prefix
        image_data = image_data.split(',')[1]
        
        # Convert base64 to image
        import base64
        from io import BytesIO
        
        image_bytes = base64.b64decode(image_data)
        
        # Convert to OpenCV format
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"success": False, "error": "Failed to decode image"}
        
        # Create cascade classifier
        face_detector = cv2.CascadeClassifier(cascade_path)
        if face_detector.empty():
            return {"success": False, "error": "Failed to load face detector model"}
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_detector.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        # Get only the largest face
        largest_face = get_largest_face(faces)
        
        if largest_face is not None:
            x, y, w, h = largest_face
            
            # Extract face region with a margin
            margin = int(0.2 * w)  # 20% margin
            y1 = max(0, y - margin)
            y2 = min(frame.shape[0], y + h + margin)
            x1 = max(0, x - margin)
            x2 = min(frame.shape[1], x + w + margin)
            
            face_img = frame[y1:y2, x1:x2]
            
            # Resize to a standard size
            resized_face = cv2.resize(face_img, (100, 100))
            
            # Save to sample_faces directory
            os.makedirs('sample_faces', exist_ok=True)
            filename = f"sample_faces/face_{index}.jpg"
            cv2.imwrite(filename, resized_face)
            
            return {"success": True, "filename": filename}
        else:
            return {"success": False, "error": "No face detected in image"}
    except Exception as e:
        print(f"Error saving face snapshot: {e}")
        return {"success": False, "error": str(e)}

@eel.expose
def eel_process_face_samples(username):
    """Process collected face samples and save to face database"""
    try:
        # Get all image files in the sample_faces directory
        image_files = []
        for ext in ['jpg', 'jpeg', 'png']:
            image_files.extend([f for f in os.listdir('sample_faces') if f.lower().endswith(f'.{ext}')])
        
        if not image_files:
            return {"success": False, "error": "No face images found in the sample_faces directory"}
        
        image_files = [os.path.join('sample_faces', f) for f in image_files]
        print(f"Found {len(image_files)} face images to process")
        
        faces_data = []
        for img_file in image_files:
            try:
                # Load the image
                img = cv2.imread(img_file)
                if img is None:
                    print(f"Could not load image {img_file}")
                    continue
                
                # Flatten the image
                flattened_img = img.reshape(1, -1)[0]
                faces_data.append(flattened_img)
                print(f"Processed {img_file}")
            except Exception as e:
                print(f"Error processing {img_file}: {e}")
        
        if not faces_data:
            return {"success": False, "error": "No valid face data could be processed"}
        
        # Convert to numpy array
        faces_data = np.array(faces_data)
        
        # Save the face data
        save_face_data(username, faces_data)
        
        # Also save a sample image for the user
        sample_path = os.path.join('Student images', f"{username}.png")
        cv2.imwrite(sample_path, cv2.imread(image_files[0]))
        
        # Clear the sample_faces directory
        for file in image_files:
            try:
                os.remove(file)
            except Exception as e:
                print(f"Error removing {file}: {e}")
        
        return {
            "success": True, 
            "samples": len(faces_data),
            "message": f"Successfully processed {len(faces_data)} face samples for {username}"
        }
    except Exception as e:
        print(f"Error processing face samples: {e}")
        return {"success": False, "error": str(e)}

def save_face_data(username, face_data):
    """Save the face data and username to data files."""
    # Create user data directory if it doesn't exist
    if not os.path.exists(user_data_dir):
        os.makedirs(user_data_dir)
    
    # Save the face data
    faces_path = os.path.join(user_data_dir, 'faces_data.pkl')
    names_path = os.path.join(user_data_dir, 'name.pkl')
    
    # Handle face data
    if os.path.exists(faces_path):
        # Load existing data
        with open(faces_path, 'rb') as f:
            existing_faces = pickle.load(f)
        
        # Make sure dimensions match
        if existing_faces.shape[1] != face_data.shape[1]:
            print(f"Warning: Dimension mismatch between existing data ({existing_faces.shape[1]}) and new data ({face_data.shape[1]})")
            # Use the smaller dimension
            min_dim = min(existing_faces.shape[1], face_data.shape[1])
            existing_faces = existing_faces[:, :min_dim]
            face_data = face_data[:, :min_dim]
        
        # Append new data
        faces = np.append(existing_faces, face_data, axis=0)
    else:
        faces = face_data
    
    # Save updated face data
    with open(faces_path, 'wb') as f:
        pickle.dump(faces, f)
    
    # Handle names data
    names = [username] * len(face_data)
    
    if os.path.exists(names_path):
        # Load existing names
        with open(names_path, 'rb') as f:
            existing_names = pickle.load(f)
        # Append new names
        names = existing_names + names
    
    # Save updated names
    with open(names_path, 'wb') as f:
        pickle.dump(names, f)
    
    # Save a timestamp
    with open(os.path.join(user_data_dir, 'last_update.txt'), 'a') as f:
        f.write(f"{datetime.now()} - Added {len(face_data)} samples for {username}\n")

    # Also save to XML format
    save_to_xml(username, face_data)

def save_to_xml(username, face_data):
    """Save employee data to XML format for better integration with web apps"""
    try:
        import xml.etree.ElementTree as ET
        from xml.dom import minidom
        
        # Create data directory if it doesn't exist
        data_dir = 'data'
        os.makedirs(data_dir, exist_ok=True)
        
        # Path for employees.xml
        employees_file = os.path.join(data_dir, 'employees.xml')
        
        # Check if file exists
        if os.path.exists(employees_file):
            # Load existing file
            tree = ET.parse(employees_file)
            root = tree.getroot()
        else:
            # Create new file structure
            root = ET.Element('employees')
            tree = ET.ElementTree(root)
        
        # Check if this employee already exists
        existing_employee = None
        for employee in root.findall('./employee'):
            if employee.find('name').text == username:
                existing_employee = employee
                break
        
        # If employee doesn't exist, create a new entry
        if existing_employee is None:
            employee = ET.SubElement(root, 'employee')
            ET.SubElement(employee, 'name').text = username
            ET.SubElement(employee, 'department').text = 'Not Specified'
            ET.SubElement(employee, 'position').text = 'Not Specified'
            ET.SubElement(employee, 'email').text = f"{username.lower().replace(' ', '.')}@example.com"
            ET.SubElement(employee, 'face_samples').text = str(len(face_data))
            ET.SubElement(employee, 'enrollment_date').text = datetime.now().isoformat()
        else:
            # Just update the face samples count
            samples_element = existing_employee.find('face_samples')
            if samples_element is not None:
                samples_element.text = str(int(samples_element.text) + len(face_data))
            else:
                ET.SubElement(existing_employee, 'face_samples').text = str(len(face_data))
        
        # Save with pretty formatting
        xmlstr = minidom.parseString(ET.tostring(root)).toprettyxml(indent="   ")
        with open(employees_file, "w") as f:
            f.write(xmlstr)
            
        print(f"Saved employee data to {employees_file}")
        return True
    except Exception as e:
        print(f"Error saving to XML: {e}")
        return False
