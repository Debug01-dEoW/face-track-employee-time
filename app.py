
import eel
import os
import sys
import web.add_faces
import web.face_recognition
import json

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
    try:
        # Check if employees.xml exists
        employees_file = os.path.join('data', 'employees.xml')
        if os.path.exists(employees_file):
            import xml.etree.ElementTree as ET
            tree = ET.parse(employees_file)
            root = tree.getroot()
            
            # Extract all department values
            departments = set()
            for employee in root.findall('./employee'):
                dept = employee.find('department')
                if dept is not None and dept.text:
                    departments.add(dept.text)
            
            return list(departments) if departments else ["IT", "HR", "Marketing", "Finance", "Operations"]
        else:
            # Return default departments if file doesn't exist
            return ["IT", "HR", "Marketing", "Finance", "Operations"]
    except Exception as e:
        print(f"Error getting departments: {e}")
        return ["IT", "HR", "Marketing", "Finance", "Operations"]

@eel.expose
def search_employees(search_term, department_filter, face_data_filter):
    """Search employees based on filters"""
    try:
        results = []
        employees_file = os.path.join('data', 'employees.xml')
        
        if os.path.exists(employees_file):
            import xml.etree.ElementTree as ET
            tree = ET.parse(employees_file)
            root = tree.getroot()
            
            search_term = search_term.lower()
            
            for employee in root.findall('./employee'):
                name = employee.find('name').text
                department = employee.find('department').text if employee.find('department') is not None else ""
                position = employee.find('position').text if employee.find('position') is not None else ""
                face_samples = employee.find('face_samples')
                has_face_data = face_samples is not None and int(face_samples.text) > 0
                
                # Apply filters
                name_match = search_term == "" or search_term in name.lower()
                dept_match = department_filter == "" or department_filter == department
                face_data_match = face_data_filter == "" or (face_data_filter == "yes" and has_face_data) or (face_data_filter == "no" and not has_face_data)
                
                if name_match and dept_match and face_data_match:
                    results.append({
                        "name": name,
                        "department": department,
                        "position": position,
                        "hasFaceData": has_face_data
                    })
            
            return {"success": True, "employees": results}
        else:
            # Return empty results if file doesn't exist
            return {"success": True, "employees": []}
    except Exception as e:
        print(f"Error searching employees: {e}")
        return {"success": False, "error": str(e)}

@eel.expose
def get_employees():
    """Get all employees"""
    try:
        employees_file = os.path.join('data', 'employees.xml')
        
        if os.path.exists(employees_file):
            import xml.etree.ElementTree as ET
            tree = ET.parse(employees_file)
            root = tree.getroot()
            
            employees = []
            for employee in root.findall('./employee'):
                name = employee.find('name').text
                department = employee.find('department').text if employee.find('department') is not None else ""
                position = employee.find('position').text if employee.find('position') is not None else ""
                face_samples = employee.find('face_samples')
                has_face_data = face_samples is not None and int(face_samples.text) > 0
                
                employees.append({
                    "name": name,
                    "department": department,
                    "position": position,
                    "hasFaceData": has_face_data
                })
            
            return {"success": True, "employees": employees}
        else:
            # Return empty results if file doesn't exist
            return {"success": True, "employees": []}
    except Exception as e:
        print(f"Error getting employees: {e}")
        return {"success": False, "error": str(e)}

@eel.expose
def eel_recognize_face(image_data):
    """Expose the face recognition function to JavaScript"""
    return web.face_recognition.eel_recognize_face(image_data)

@eel.expose
def eel_start_face_enrollment(username):
    """Start face enrollment process"""
    return web.add_faces.eel_start_face_enrollment(username)

@eel.expose
def eel_save_face_snapshot(image_data, index):
    """Save a face snapshot"""
    return web.add_faces.eel_save_face_snapshot(image_data, index)

@eel.expose
def eel_process_face_samples(username):
    """Process collected face samples"""
    return web.add_faces.eel_process_face_samples(username)

@eel.expose
def record_attendance(name, timestamp, record_type="IN"):
    """Record attendance in XML file"""
    return web.face_recognition.record_attendance(name, timestamp, record_type)

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
