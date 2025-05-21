
import eel
import os
import sys
import web.add_faces
import web.face_recognition

# Initialize Eel with the 'web' directory
eel.init('web')

# Create necessary directories
if not os.path.exists('user data'):
    os.makedirs('user data')

if not os.path.exists('data'):
    os.makedirs('data')

if not os.path.exists('sample_faces'):
    os.makedirs('sample_faces')

# Expose functions to JavaScript
@eel.expose
def get_departments():
    """Get a list of all departments from employee data"""
    # This would normally come from a database
    # For now, we'll just return a static list
    return ["IT", "HR", "Marketing", "Finance", "Operations"]

@eel.expose
def search_employees(search_term, department_filter, face_data_filter):
    """Search employees based on filters"""
    # This would normally query a database
    # For our simple app, we'll just return success since filtering is done client-side
    return {"success": True}

@eel.expose
def eel_recognize_face(image_data):
    """Expose the face recognition function to JavaScript"""
    return web.face_recognition.eel_recognize_face(image_data)

if __name__ == '__main__':
    try:
        # Start the Eel application
        print("Starting Face Recognition System...")
        print("Web interface available at: http://localhost:8000/index.html")
        
        # Check if there's a command to run a specific function
        if len(sys.argv) > 1:
            if sys.argv[1] == "--enroll" and len(sys.argv) > 2:
                username = sys.argv[2]
                print(f"Starting enrollment for {username}")
                web.add_faces.collect_face_samples(username)
                sys.exit(0)
            elif sys.argv[1] == "--recognize":
                print("Starting face recognition")
                web.face_recognition.recognize_face()
                sys.exit(0)
        
        # Otherwise, start the web interface
        # Use 'chrome' as default mode, fallback to 'default'
        try:
            eel.start('index.html', mode='chrome', size=(1200, 800), port=8000)
        except eel.browsers.NoBrowser:
            try:
                eel.start('index.html', mode='default', size=(1200, 800), port=8000)
            except Exception as e:
                print(f"Failed to start browser: {e}")
                eel.start('index.html', mode=None, size=(1200, 800), port=8000)
                print("No browser mode. Please visit http://localhost:8000/index.html in your browser.")
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
