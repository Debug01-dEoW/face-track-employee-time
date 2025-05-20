
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, RefreshCw } from "lucide-react";
import CameraView from "./face/CameraView";
import ProgressIndicator from "./face/ProgressIndicator";
import EnrollmentInstructions from "./face/EnrollmentInstructions";
import { useFaceCapture } from "./face/useFaceCapture";

interface FaceEnrollmentProps {
  employeeId: number;
  employeeName: string;
  onComplete: (faceData: string) => void;
  onCancel: () => void;
}

const FaceEnrollment = ({ employeeId, employeeName, onComplete, onCancel }: FaceEnrollmentProps) => {
  const { 
    videoRef, 
    canvasRef, 
    isCapturing, 
    progress, 
    currentDirection, 
    startCapture 
  } = useFaceCapture((faceData) => {
    onComplete(faceData);
  });

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Face Enrollment: {employeeName}</CardTitle>
        <CardDescription>
          Please follow the instructions to capture face from different angles
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
