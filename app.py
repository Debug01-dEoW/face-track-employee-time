
import os
import eel
import xml.etree.ElementTree as ET
import threading
import time

# Initialize Eel
eel.init('web')

# Create data directories if they don't exist
if not os.path.exists('data'):
    os.makedirs('data')

# Create empty XML files if they don't exist
if not os.path.exists('data/employees.xml'):
    root = ET.Element("employees")
    tree = ET.ElementTree(root)
    tree.write('data/employees.xml')

if not os.path.exists('data/attendance.xml'):
    root = ET.Element("attendance_records")
    tree = ET.ElementTree(root)
    tree.write('data/attendance.xml')

# Locks for thread-safe file access
employee_lock = threading.Lock()
attendance_lock = threading.Lock()

# Function to get all employees
@eel.expose
def eel_get_employees():
    with employee_lock:
        if not os.path.exists('data/employees.xml'):
            return []
        
        try:
            tree = ET.parse('data/employees.xml')
            root = tree.getroot()
            
            employees = []
            for employee in root.findall('./employee'):
                emp_id = employee.find('id').text
                name = employee.find('name').text
                department = employee.find('department').text if employee.find('department') is not None else ""
                position = employee.find('position').text if employee.find('position') is not None else ""
                
                # Check if there are face samples for this employee
                samples = 0
                try:
                    if os.path.exists('user data/name.pkl'):
                        import pickle
                        with open('user data/name.pkl', 'rb') as f:
                            names = pickle.load(f)
                        samples = names.count(name)
                except:
                    pass
                
                employees.append({
                    'id': emp_id,
                    'name': name,
                    'department': department,
                    'position': position,
                    'samples': samples
                })
            
            return employees
        except Exception as e:
            print(f"Error getting employees: {e}")
            return []

# Function to add a new employee
@eel.expose
def eel_add_employee(emp_id, name, department="", position=""):
    with employee_lock:
        try:
            # Load the XML file
            if os.path.exists('data/employees.xml'):
                tree = ET.parse('data/employees.xml')
                root = tree.getroot()
            else:
                root = ET.Element("employees")
                tree = ET.ElementTree(root)
            
            # Check if employee with this ID already exists
            for employee in root.findall('./employee'):
                if employee.find('id').text == emp_id:
                    return {'success': False, 'error': 'Employee ID already exists'}
            
            # Create new employee element
            employee = ET.SubElement(root, "employee")
            ET.SubElement(employee, "id").text = emp_id
            ET.SubElement(employee, "name").text = name
            ET.SubElement(employee, "department").text = department
            ET.SubElement(employee, "position").text = position
            
            # Save the XML file
            tree.write('data/employees.xml')
            
            return {'success': True}
        except Exception as e:
            print(f"Error adding employee: {e}")
            return {'success': False, 'error': str(e)}

# Function to delete an employee
@eel.expose
def delete_employee(emp_id):
    with employee_lock:
        try:
            # Load the XML file
            tree = ET.parse('data/employees.xml')
            root = tree.getroot()
            
            # Find and remove the employee
            for employee in root.findall('./employee'):
                if employee.find('id').text == emp_id:
                    root.remove(employee)
                    tree.write('data/employees.xml')
                    return True
            
            # Employee not found
            return False
        except Exception as e:
            print(f"Error deleting employee: {e}")
            return False

# Function to enroll a face
@eel.expose
def eel_enroll_face(emp_id, name, face_data, department="", position=""):
    # First add the employee to the database
    result = eel_add_employee(emp_id, name, department, position)
    
    if not result['success']:
        # If employee already exists, update their info
        with employee_lock:
            try:
                tree = ET.parse('data/employees.xml')
                root = tree.getroot()
                
                for employee in root.findall('./employee'):
                    if employee.find('id').text == emp_id:
                        employee.find('name').text = name
                        if department and employee.find('department') is not None:
                            employee.find('department').text = department
                        if position and employee.find('position') is not None:
                            employee.find('position').text = position
                        
                        tree.write('data/employees.xml')
                        break
            except Exception as e:
                print(f"Error updating employee: {e}")
    
    # Process the face data
    # In a real application, this would be integrated with the face recognition backend
    # but here we'll just return a mock response
    return {
        'success': True, 
        'samples': 20, 
        'employeeId': emp_id
    }

# Function to get attendance records
@eel.expose
def get_attendance_records():
    with attendance_lock:
        if not os.path.exists('data/attendance.xml'):
            return []
        
        try:
            tree = ET.parse('data/attendance.xml')
            root = tree.getroot()
            
            records = []
            for record in root.findall('./record'):
                employee_name = record.find('employeeName').text
                timestamp = record.find('timestamp').text
                record_type = record.find('type').text
                
                records.append({
                    'employeeName': employee_name,
                    'timestamp': timestamp,
                    'type': record_type
                })
            
            return records
        except Exception as e:
            print(f"Error getting attendance records: {e}")
            return []

# Start the application
if __name__ == '__main__':
    # Import face recognition modules here to verify they're available
    try:
        # This won't run in the Lovable environment, but in a real setup
        # you'd want to check if all dependencies are available
        import add_faces
        import face_recognition
        print("Face recognition modules imported successfully")
    except ImportError as e:
        print(f"Warning: Face recognition modules not available: {e}")
        print("Make sure you have installed all required packages:")
        print("pip install numpy pillow scikit-learn opencv-python")
    
    try:
        eel.start('index.html', size=(1200, 800))
    except Exception as e:
        print(f"Error starting application: {e}")
