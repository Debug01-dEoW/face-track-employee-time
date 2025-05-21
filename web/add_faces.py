
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

def recognize_face(frame_data=None):
    """Recognize a face in the provided frame data or from webcam."""
    try:
        # Check if scikit-learn is installed
        try:
            from sklearn.neighbors import KNeighborsClassifier
        except ImportError:
            print("Error: scikit-learn is not installed.")
            return {"success": False, "error": "scikit-learn not installed"}
        
        # Check if required files exist
        names_path = os.path.join(user_data_dir, 'name.pkl')
        faces_path = os.path.join(user_data_dir, 'faces_data.pkl')
        
        if not os.path.exists(names_path) or not os.path.exists(faces_path):
            print("Error: Face data not found. Please collect face samples first.")
            return {"success": False, "error": "Face data not found"}
        
        # Load face data and names
        try:
            with open(names_path, 'rb') as f:
                names = pickle.load(f)
            
            with open(faces_path, 'rb') as f:
                faces = pickle.load(f)
        except Exception as e:
            print(f"Error loading face data: {e}")
            return {"success": False, "error": f"Error loading face data: {e}"}
        
        if len(names) == 0 or len(faces) == 0:
            print("Error: No face data found. Please collect face samples first.")
            return {"success": False, "error": "No face data found"}
        
        # Get the feature dimensions from the training data
        feature_count = faces.shape[1]
        print(f"Loaded training data with {feature_count} features")
        
        # Train KNN classifier
        knn = KNeighborsClassifier(n_neighbors=5)
        knn.fit(faces, names)
        
        # If frame_data is provided, use it instead of webcam
        if frame_data is not None:
            try:
                # Process the provided frame
                return process_frame_for_recognition(frame_data, knn, feature_count)
            except Exception as e:
                print(f"Error processing frame: {e}")
                return {"success": False, "error": f"Error processing frame: {e}"}
        
        # If no frame data provided, this function can be called to begin interactive webcam recognition
        # (Note: This part would not typically be used via Eel, but kept for backward compatibility)
        print("No frame data provided, starting webcam recognition")
        
        # Initialize face detector
        face_detector = cv2.CascadeClassifier(cascade_path)
        if face_detector.empty():
            print("Error: Failed to load face detector model.")
            return {"success": False, "error": "Failed to load face detector model"}
        
        # Initialize video capture
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open camera.")
            return {"success": False, "error": "Could not open camera"}
        
        print("\nStarting face recognition. Press 'q' to quit.")
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Failed to grab frame from camera.")
                    break
                
                # Create copy for display
                display_frame = frame.copy()
                
                # Convert to grayscale
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Detect faces
                faces_rect = face_detector.detectMultiScale(
                    gray, 
                    scaleFactor=1.1, 
                    minNeighbors=5,
                    minSize=(30, 30)
                )
                
                # Process the largest face only
                largest_face = get_largest_face(faces_rect)
                
                if largest_face is not None:
                    # Similar code to process_frame_for_recognition but for display
                    x, y, w, h = largest_face
                    
                    # Extract face region with margin
                    margin = int(0.2 * w)
                    y1 = max(0, y - margin)
                    y2 = min(frame.shape[0], y + h + margin)
                    x1 = max(0, x - margin)
                    x2 = min(frame.shape[1], x + w + margin)
                    
                    try:
                        face_img = frame[y1:y2, x1:x2]
                        face_size = 100
                        resized_face = cv2.resize(face_img, (face_size, face_size))
                        flattened_face = resized_face.reshape(1, -1)
                        
                        # Make sure dimensions match
                        if flattened_face.shape[1] > feature_count:
                            flattened_face = flattened_face[:, :feature_count]
                        elif flattened_face.shape[1] < feature_count:
                            # Pad with zeros if too small
                            padding = np.zeros((1, feature_count - flattened_face.shape[1]))
                            flattened_face = np.concatenate((flattened_face, padding), axis=1)
                            
                        # Get prediction and probability
                        user_name = knn.predict(flattened_face)[0]
                        probs = knn.predict_proba(flattened_face)[0]
                        
                        # Get the highest probability and convert to percentage
                        user_prob = np.max(probs) * 100
                        
                        # Display the result
                        result_text = f"{user_name} ({user_prob:.1f}%)"
                        
                        # Determine color based on confidence
                        if user_prob >= 80:
                            color = (0, 255, 0)  # Green for high confidence
                        elif user_prob >= 50:
                            color = (0, 255, 255)  # Yellow for medium confidence
                        else:
                            color = (0, 0, 255)  # Red for low confidence
                        
                        # Draw rectangle and name
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(display_frame, result_text, (x1, y1 - 10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                    except Exception as e:
                        print(f"Error processing face: {e}")
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(display_frame, "Error processing face", (x1, y1 - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                else:
                    # No face detected
                    cv2.putText(display_frame, "No face detected", (10, 50), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                # Add instructions
                cv2.putText(display_frame, "Press 'q' to quit", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                # Show the frame
                cv2.imshow("Face Recognition", display_frame)
                
                # Check for quit key
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        
        except Exception as e:
            print(f"Error during face recognition: {e}")
            return {"success": False, "error": f"Error during face recognition: {e}"}
        
        finally:
            # Clean up
            cap.release()
            cv2.destroyAllWindows()
            return {"success": True, "message": "Face recognition completed"}
            
    except Exception as e:
        print(f"General error in face recognition: {e}")
        return {"success": False, "error": f"General error in face recognition: {e}"}

def process_frame_for_recognition(frame_data, knn, feature_count):
    """Process a single frame for face recognition."""
    try:
        # Convert base64 to image if needed
        if isinstance(frame_data, str) and frame_data.startswith('data:image'):
            frame_data = frame_data.split(',')[1]
            
            # Convert base64 to image
            import base64
            from io import BytesIO
            
            image_bytes = base64.b64decode(frame_data)
            
            # Convert to OpenCV format
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            return {"success": False, "error": "Invalid image data format"}
        
        if frame is None:
            return {"success": False, "error": "Failed to decode image"}
        
        # Load face detector
        face_detector = cv2.CascadeClassifier(cascade_path)
        if face_detector.empty():
            return {"success": False, "error": "Failed to load face detector"}
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces_rect = face_detector.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        # Get the largest face
        largest_face = get_largest_face(faces_rect)
        
        if largest_face is None:
            return {"success": True, "detected": False, "message": "No face detected in image"}
        
        x, y, w, h = largest_face
        
        # Extract face region with margin
        margin = int(0.2 * w)
        y1 = max(0, y - margin)
        y2 = min(frame.shape[0], y + h + margin)
        x1 = max(0, x - margin)
        x2 = min(frame.shape[1], x + w + margin)
        
        face_img = frame[y1:y2, x1:x2]
        face_size = 100
        resized_face = cv2.resize(face_img, (face_size, face_size))
        flattened_face = resized_face.reshape(1, -1)
        
        # Make sure dimensions match the training data
        if flattened_face.shape[1] > feature_count:
            flattened_face = flattened_face[:, :feature_count]
        elif flattened_face.shape[1] < feature_count:
            # Pad with zeros if too small
            padding = np.zeros((1, feature_count - flattened_face.shape[1]))
            flattened_face = np.concatenate((flattened_face, padding), axis=1)
            
        # Get prediction and probability
        user_name = knn.predict(flattened_face)[0]
        probs = knn.predict_proba(flattened_face)[0]
        
        # Get the highest probability
        user_prob = np.max(probs)
        
        # Check confidence threshold
        if user_prob < 0.6:  # 60% confidence threshold
            return {"success": True, "detected": True, "recognized": False, "message": "Face detected but confidence too low"}
        
        # Look up employee details
        # This is a placeholder - in a real application you would look up details from a database
        user_details = get_employee_details(user_name)
        
        # Record the recognition event
        record_recognition_event(user_name)
        
        return {
            "success": True,
            "detected": True,
            "recognized": True,
            "person": {
                "name": user_name,
                "confidence": float(user_prob),
                "details": user_details
            }
        }
        
    except Exception as e:
        print(f"Error in process_frame_for_recognition: {e}")
        return {"success": False, "error": str(e)}

def get_employee_details(username):
    """Get employee details from employee records."""
    try:
        # Check if employees.xml exists
        employee_file = os.path.join('data', 'employees.xml')
        if os.path.exists(employee_file):
            import xml.etree.ElementTree as ET
            tree = ET.parse(employee_file)
            root = tree.getroot()
            
            for employee in root.findall('./employee'):
                name_elem = employee.find('name')
                if name_elem is not None and name_elem.text == username:
                    # Found matching employee
                    details = {}
                    
                    for field in ['department', 'position', 'email']:
                        field_elem = employee.find(field)
                        if field_elem is not None:
                            details[field] = field_elem.text
                    
                    return details
        
        # If no match or no file, return empty details
        return {}
    except Exception as e:
        print(f"Error getting employee details: {e}")
        return {}

def record_recognition_event(username):
    """Record a recognition event."""
    try:
        # Create data directory if it doesn't exist
        data_dir = 'data'
        os.makedirs(data_dir, exist_ok=True)
        
        # Create or update attendance.xml
        attendance_file = os.path.join(data_dir, 'attendance.xml')
        
        import xml.etree.ElementTree as ET
        
        if not os.path.exists(attendance_file):
            # Create new file
            root = ET.Element("attendance_records")
            tree = ET.ElementTree(root)
        else:
            # Load existing file
            tree = ET.parse(attendance_file)
            root = tree.getroot()
        
        # Add new record
        record = ET.SubElement(root, "record")
        ET.SubElement(record, "employeeName").text = username
        ET.SubElement(record, "timestamp").text = datetime.now().isoformat()
        ET.SubElement(record, "type").text = "IN"  # Could be more sophisticated with IN/OUT logic
        
        # Save the file
        tree.write(attendance_file)
        
        print(f"Recorded recognition event for {username}")
        return True
    except Exception as e:
        print(f"Error recording recognition event: {e}")
        return False

# Expose functions to JavaScript via Eel
@eel.expose
def eel_recognize_face(image_data):
    """Recognize a face via Eel"""
    return recognize_face(image_data)

if __name__ == "__main__":
    # If running directly, prompt for username and collect samples
    if len(sys.argv) > 1:
        username = sys.argv[1]
        print(f"Starting face sample collection for {username}")
        collect_face_samples(username)
    else:
        # Show menu when run directly (not via Eel)
        print(f"\n{'='*60}")
        print("FACE RECOGNITION SYSTEM")
        print(f"{'='*60}")
        username = input("Enter username for face enrollment: ")
        if username.strip():
            collect_face_samples(username)
        else:
            print("Username cannot be empty.")
