
import { toast } from "sonner";

// Define the API base URL - this would point to your Python backend
// In development, this might be a local server; in production, it would be your deployed API
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
  employeeId?: number;
  error?: string;
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
    toast.error('Face recognition service unavailable');
    return null;
  }
};

/**
 * Enrolls a new face in the system
 * @param employeeId Employee ID
 * @param employeeName Employee name
 * @param faceData JSON string containing face samples
 * @returns Success status
 */
export const enrollFace = async (employeeId: number, employeeName: string, faceData: string): Promise<boolean> => {
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
        faceSamples: parsedData.samples
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
    toast.error('Face enrollment failed');
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
    });
    
    return response.ok;
  } catch (error) {
    console.error('Service health check failed:', error);
    return false;
  }
};
