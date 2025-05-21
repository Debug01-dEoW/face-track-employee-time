
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, RefreshCw, AlertTriangle, Server } from "lucide-react";
import CameraView from "./face/CameraView";
import ProgressIndicator from "./face/ProgressIndicator";
import EnrollmentInstructions from "./face/EnrollmentInstructions";
import { useFaceCapture } from "./face/useFaceCapture";
import { checkServiceAvailability, enrollFace } from "@/services/FaceRecognitionService";
import { toast } from "sonner";

interface FaceEnrollmentProps {
  employeeId: number;
  employeeName: string;
  onComplete: (faceData: string) => void;
  onCancel: () => void;
}

const FaceEnrollment = ({ employeeId, employeeName, onComplete, onCancel }: FaceEnrollmentProps) => {
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  
  // Check service availability on component mount
  useEffect(() => {
    const checkServer = async () => {
      const isAvailable = await checkServiceAvailability();
      setServerAvailable(isAvailable);
      
      if (!isAvailable) {
        toast.error("Face recognition server is not available", {
          description: "Please make sure the Python backend is running"
        });
      } else {
        toast.success("Connected to face recognition server");
      }
    };
    
    checkServer();
  }, []);

  const handleEnrollmentComplete = async (faceData: string) => {
    try {
      // First try to enroll with the Python backend
      if (serverAvailable) {
        const success = await enrollFace(employeeId, employeeName, faceData);
        
        if (success) {
          toast.success("Face data successfully enrolled with recognition server");
        } else {
          toast.error("Failed to enroll with recognition server");
        }
      }
      
      // Always complete locally as well
      onComplete(faceData);
    } catch (error) {
      console.error("Error during enrollment:", error);
      toast.error("An error occurred during enrollment");
      onComplete(faceData); // Still complete with local data
    }
  };
  
  const { 
    videoRef, 
    canvasRef, 
    isCapturing, 
    progress, 
    currentDirection, 
    startCapture 
  } = useFaceCapture(handleEnrollmentComplete);

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Face Enrollment: {employeeName}</CardTitle>
        <CardDescription>
          Please follow the instructions to capture face from different angles
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {serverAvailable === false && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Face recognition server is not available. Enrollment will use local storage only.
            </AlertDescription>
          </Alert>
        )}
        
        {serverAvailable === true && (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
            <Server className="h-4 w-4" />
            <AlertDescription>
              Connected to Python face recognition server for high-accuracy processing.
            </AlertDescription>
          </Alert>
        )}
        
        <CameraView 
          videoRef={videoRef}
          isCapturing={isCapturing} 
          currentDirection={currentDirection}
        />
        
        <ProgressIndicator progress={progress} isCapturing={isCapturing} />
        
        <EnrollmentInstructions isCapturing={isCapturing} />
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        {!isCapturing ? (
          <Button onClick={startCapture}>
            <Camera className="mr-2 h-4 w-4" />
            Start Enrollment
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Capturing...
          </Button>
        )}
      </CardFooter>
      
      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
};

export default FaceEnrollment;
