
import { toast } from "sonner";

// Define the API base URL
const API_BASE_URL = "http://localhost:5000"; // Change this to your actual API endpoint

interface RecognitionResponse {
  success: boolean;
  person?: {
    id: string;
    name: string;
    confidence: number;
  };
  error?: string;
}

interface EnrollmentResponse {
  success: boolean;
  employeeId?: string;
  error?: string;
}

interface StatsResponse {
  totalEmployees: number;
  totalSamples: number;
  totalAttendance: number;
}

/**
 * Recognizes a face from an image
 * @param imageData Base64 encoded image data
 * @returns Recognition result or null if not recognized
 */
export const recognizeFace = async (imageData: string): Promise<{ id: string, name: string } | null> => {
  try {
    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageData.split(',')[1];
    
    const response = await fetch(`${API_BASE_URL}/api/recognize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Data }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result: RecognitionResponse = await response.json();
    
    if (result.success && result.person) {
      return {
        id: result.person.id,
        name: result.person.name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Face recognition API error:', error);
    toast.error('Face recognition service unavailable. Using local fallback.');
    return null;
  }
};

/**
 * Enrolls a new face in the system
 * @param employeeId Employee ID
 * @param employeeName Employee name
 * @param faceData JSON string containing face samples
 * @param department Employee department (optional)
 * @param position Employee position (optional)
 * @returns Success status
 */
export const enrollFace = async (
  employeeId: number, 
  employeeName: string, 
  faceData: string,
  department: string = "",
  position: string = ""
): Promise<boolean> => {
  try {
    // Parse the face data to extract the samples
    const parsedData = JSON.parse(faceData);
    
    const response = await fetch(`${API_BASE_URL}/api/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId,
        employeeName,
        faceSamples: parsedData.samples,
        department,
        position
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result: EnrollmentResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown enrollment error');
    }
    
    return true;
  } catch (error) {
    console.error('Face enrollment API error:', error);
    toast.error('Face enrollment failed with backend server, using local storage.');
    return false;
  }
};

/**
 * Checks if the face recognition service is available
 * @returns True if service is available
 */
export const checkServiceAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Set a short timeout to avoid long waits if the server is down
      signal: AbortSignal.timeout(2000)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Service health check failed:', error);
    return false;
  }
};

/**
 * Gets statistics about enrolled faces and attendance
 */
export const getFaceStatistics = async (): Promise<StatsResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success) {
      return result.stats;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching face statistics:', error);
    return null;
  }
};

/**
 * Gets all employees with their face enrollment status
 */
export const getEmployees = async (): Promise<any[] | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success) {
      return result.employees;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return null;
  }
};

/**
 * Gets attendance records
 */
export const getAttendanceRecords = async (): Promise<any[] | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/attendance`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success) {
      return result.records;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return null;
  }
};

/**
 * Deletes an employee and their face data
 */
export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting employee:', error);
    return false;
  }
};
