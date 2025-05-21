
import { checkServiceAvailability, enrollFace } from './FaceRecognitionService';

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
export const saveFaceData = async (data: FaceData): Promise<boolean> => {
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
    
    // Try to also save to Python backend if available
    const isServerAvailable = await checkServiceAvailability();
    if (isServerAvailable) {
      await enrollFace(data.employeeId, data.employeeName, data.faceData);
    }
    
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
    
    // Note: We should also remove from the Python backend, but that would require
    // additional API endpoint implementation
    
    return true;
  } catch (error) {
    console.error("Error removing face data:", error);
    return false;
  }
};

// Find employee by face data
export const findEmployeeByFace = async (faceImage: string): Promise<FaceData | null> => {
  try {
    // Try to use Python backend first
    const isServerAvailable = await checkServiceAvailability();
    
    if (isServerAvailable) {
      // This will be handled by the FaceRecognitionService
      const result = await import('./FaceRecognitionService').then(module => 
        module.recognizeFace(faceImage)
      );
      
      if (result) {
        // If recognized, find the corresponding employee in our local database
        const employees = getAllFaceData();
        const matchedEmployee = employees.find(emp => emp.employeeId.toString() === result.id);
        
        if (matchedEmployee) {
          return matchedEmployee;
        }
      }
    }
    
    // Fall back to local implementation if Python backend is not available or no match was found
    console.log("Falling back to local face recognition (mock)");
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get all employees with face data
        const employees = getAllFaceData();
        
        if (employees.length === 0) {
          resolve(null);
          return;
        }
        
        // For demo purposes without Python backend, we'll just return a random employee
        const randomIndex = Math.floor(Math.random() * employees.length);
        resolve(employees[randomIndex]);
      }, 1000);
    });
  } catch (error) {
    console.error("Error in findEmployeeByFace:", error);
    return null;
  }
};

// Check if an employee has face data enrolled
export const hasFaceData = (employeeId: number): boolean => {
  const existingData = getAllFaceData();
  return existingData.some(item => item.employeeId === employeeId);
};
