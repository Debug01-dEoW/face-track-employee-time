
import os
import pickle
import numpy as np
from PIL import Image
import glob
import eel

# Create necessary directories
if not os.path.exists('user data'):
    os.makedirs('user data')
    # Add the haarcascade file for face detection
    cascade_file = os.path.join('user data', 'haarcascade_frontalface_default.xml')
    if not os.path.exists(cascade_file):
        print("Note: You need to download the haarcascade_frontalface_default.xml file")
        print("from OpenCV GitHub and place it in the 'user data' directory")

if not os.path.exists('sample_faces'):
    os.makedirs('sample_faces')

# Eel functions for web interface
@eel.expose
def eel_start_face_enrollment(employee_name):
    # Clear previous face samples
    sample_dir = 'sample_faces'
    for file in glob.glob(f'{sample_dir}/*.jpg'):
        os.remove(file)
    for file in glob.glob(f'{sample_dir}/*.png'):
        os.remove(file)
    
    return {"success": True, "message": f"Ready to enroll faces for {employee_name}"}

@eel.expose
def eel_save_face_snapshot(image_data, index):
    """Save a face snapshot from the web interface"""
    try:
        # Remove data URL prefix
        image_data = image_data.split(',')[1]
        
        # Convert base64 to image
        import base64
        from io import BytesIO
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Save to sample_faces directory
        os.makedirs('sample_faces', exist_ok=True)
        filename = f"sample_faces/face_{index}.jpg"
        image.save(filename)
        
        return {"success": True, "filename": filename}
    except Exception as e:
        print(f"Error saving face snapshot: {e}")
        return {"success": False, "error": str(e)}

@eel.expose
def eel_process_face_samples(name):
    """Process all samples for the employee and save to database"""
    try:
        # Get all image files in the sample_faces directory
        image_files = glob.glob('sample_faces/*.jpg')
        image_files.extend(glob.glob('sample_faces/*.png'))

        if not image_files:
            return {"success": False, "error": "No image files found in the 'sample_faces' directory."}

        print(f"Found {len(image_files)} image files.")

        # Process each image file
        faces_data = []
        for img_file in image_files:
            try:
                # Open and resize the image
                img = Image.open(img_file)
                img = img.resize((50, 50))
                img_array = np.array(img)
                
                # Convert to grayscale if it's a color image
                if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                    # This is an RGB image - convert to grayscale or use all channels
                    img_array = img_array.flatten()
                else:
                    # Already grayscale
                    img_array = img_array.flatten()
                
                faces_data.append(img_array)
                print(f"Processed {img_file}")
            except Exception as e:
                print(f"Error processing {img_file}: {e}")

        if not faces_data:
            return {"success": False, "error": "No face data could be processed. Please check your images."}

        # Convert to numpy array
        faces_data = np.array(faces_data)
        print(f"Collected {len(faces_data)} face images")
        print(f"Face data shape: {faces_data.shape}")

        # Handle the names
        names_path = os.path.join('user data', 'name.pkl')
        if not os.path.exists(names_path):
            names = [name] * len(faces_data)
            with open(names_path, 'wb') as f:
                pickle.dump(names, f)
            print("Created new names file")
        else:
            with open(names_path, 'rb') as f:
                names = pickle.load(f)
            names = names + [name] * len(faces_data)
            with open(names_path, 'wb') as f:
                pickle.dump(names, f)
            print(f"Updated names file, total names: {len(names)}")

        # Handle the face data
        faces_path = os.path.join('user data', 'faces_data.pkl')
        if not os.path.exists(faces_path):
            with open(faces_path, 'wb') as f:
                pickle.dump(faces_data, f)
            print("Created new face data file")
            total_faces = len(faces_data)
        else:
            try:
                with open(faces_path, 'rb') as f:
                    existing_faces = pickle.load(f)
                
                print(f"Existing face data shape: {existing_faces.shape}")
                
                # Check if dimensions match
                if existing_faces.shape[1] != faces_data.shape[1]:
                    print(f"Dimension mismatch: Existing={existing_faces.shape[1]}, New={faces_data.shape[1]}")
                    
                    # Determine the smaller dimension and resize both arrays
                    min_dim = min(existing_faces.shape[1], faces_data.shape[1])
                    print(f"Resizing to common dimension: {min_dim}")
                    
                    # Resize existing data
                    existing_faces_resized = existing_faces[:, :min_dim]
                    # Resize new data
                    faces_data_resized = faces_data[:, :min_dim]
                    
                    # Now append with matching dimensions
                    faces = np.append(existing_faces_resized, faces_data_resized, axis=0)
                else:
                    # Dimensions already match
                    faces = np.append(existing_faces, faces_data, axis=0)
                    
                with open(faces_path, 'wb') as f:
                    pickle.dump(faces, f)
                print(f"Updated face data file, total faces: {faces.shape[0]}")
                total_faces = faces.shape[0]
            except Exception as e:
                print(f"Error processing existing face data: {e}")
                print("Creating new face data file instead")
                with open(faces_path, 'wb') as f:
                    pickle.dump(faces_data, f)
                total_faces = len(faces_data)

        return {
            "success": True, 
            "samples": len(faces_data),
            "totalFaces": total_faces
        }
    except Exception as e:
        print(f"Error in face enrollment: {e}")
        return {"success": False, "error": str(e)}
