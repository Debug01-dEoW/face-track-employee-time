
// This service simulates storing face data
// In a real implementation, this would interact with a backend API

// Types
export interface FaceData {
  employeeId: number;
  employeeName: string;
  department: string;
  position: string;
  faceData: string; // Encoded face data (JSON string)
}

// Mock storage in localStorage
const FACE_DB_KEY = "facetrack_face_database";

// Get all face data
export const getAllFaceData = (): FaceData[] => {
  try {
    const data = localStorage.getItem(FACE_DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error retrieving face database:", error);
    return [];
  }
};

// Save face data for an employee
export const saveFaceData = (data: FaceData): boolean => {
  try {
    const existingData = getAllFaceData();
    
    // Check if employee already has face data
    const index = existingData.findIndex(item => item.employeeId === data.employeeId);
    
    if (index >= 0) {
      // Update existing record
      existingData[index] = data;
    } else {
      // Add new record
      existingData.push(data);
    }
    
    // Save to localStorage
    localStorage.setItem(FACE_DB_KEY, JSON.stringify(existingData));
    return true;
  } catch (error) {
    console.error("Error saving face data:", error);
    return false;
  }
};

// Remove face data for an employee
export const removeFaceData = (employeeId: number): boolean => {
  try {
    const existingData = getAllFaceData();
    const filteredData = existingData.filter(item => item.employeeId !== employeeId);
    
    // Save to localStorage
    localStorage.setItem(FACE_DB_KEY, JSON.stringify(filteredData));
    return true;
  } catch (error) {
    console.error("Error removing face data:", error);
    return false;
  }
};

// Find employee by face data (simulated)
export const findEmployeeByFace = async (faceImage: string): Promise<FaceData | null> => {
  // In a real implementation, this would use a face recognition API
  // Here we're just simulating a delay and returning a match for demo purposes
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get all employees with face data
      const employees = getAllFaceData();
      
      if (employees.length === 0) {
        resolve(null);
        return;
      }
      
      // In a real system, we would compare the face image against all stored face data
      // For demo purposes, we'll just return the first employee (to simulate a match)
      // This should be replaced with actual face recognition logic
      
      const randomIndex = Math.floor(Math.random() * employees.length);
      resolve(employees[randomIndex]);
    }, 2000); // Simulate 2-second processing time
  });
};

// Check if an employee has face data enrolled
export const hasFaceData = (employeeId: number): boolean => {
  const existingData = getAllFaceData();
  return existingData.some(item => item.employeeId === employeeId);
};
