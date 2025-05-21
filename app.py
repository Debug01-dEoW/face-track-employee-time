
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

if __name__ == '__main__':
    try:
        # Start the Eel application
        print("Starting Face Recognition System...")
        print("Web interface available at: http://localhost:8000/checkin.html")
        
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
        eel.start('index.html', size=(1000, 800), port=8000)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
