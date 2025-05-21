
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, RefreshCw, AlertTriangle, Server, Database } from "lucide-react";
import CameraView from "./face/CameraView";
import ProgressIndicator from "./face/ProgressIndicator";
import EnrollmentInstructions from "./face/EnrollmentInstructions";
import { useFaceCapture } from "./face/useFaceCapture";
import { toast } from "sonner";

interface FaceEnrollmentProps {
  employeeId: number;
  employeeName: string;
  department?: string;
  position?: string;
  onComplete: (faceData: string) => void;
  onCancel: () => void;
}

const FaceEnrollment = ({ 
  employeeId, 
  employeeName, 
  department = "", 
  position = "", 
  onComplete, 
  onCancel 
}: FaceEnrollmentProps) => {
  const [webInterfaceLaunched, setWebInterfaceLaunched] = useState(false);
  
  const handleLaunchWebInterface = () => {
    // Open the face enrollment web interface in a new tab
    window.open(`/web/enroll_face.html?name=${encodeURIComponent(employeeName)}&id=${employeeId}&dept=${encodeURIComponent(department)}&pos=${encodeURIComponent(position)}`, '_blank');
    setWebInterfaceLaunched(true);
    
    toast.info("Web interface launched", {
      description: "Please complete the face enrollment process in the new tab."
    });
  };

  const handleCompleteEnrollment = () => {
    // For demo purposes, assume enrollment was successful via the web interface
    const faceData = JSON.stringify({
      employeeId,
      employeeName,
      timestamp: new Date().toISOString(),
      department,
      position,
      webEnrolled: true
    });
    
    onComplete(faceData);
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Face Enrollment: {employeeName}</CardTitle>
        <CardDescription>
          Please follow the instructions to capture face data from different angles
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert variant="default">
          <Database className="h-4 w-4" />
          <AlertDescription>
            Face enrollment uses a specialized Python interface for high-accuracy processing.
          </AlertDescription>
        </Alert>
        
        {!webInterfaceLaunched ? (
          <div className="flex flex-col items-center p-8">
            <Camera className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Launch Face Enrollment Tool</h3>
            <p className="text-gray-500 text-center mb-6">
              Our face enrollment tool will open in a new window. It will collect multiple samples of your face from different angles for better recognition accuracy.
            </p>
            <Button onClick={handleLaunchWebInterface}>
              <Camera className="mr-2 h-4 w-4" />
              Start Face Enrollment
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-8 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Face Enrollment In Progress</h3>
            <p className="text-gray-600 text-center mb-6">
              Please complete the enrollment process in the web interface that opened in a new tab.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              After completing enrollment in the web interface, click the button below to finish the process.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        {webInterfaceLaunched && (
          <Button onClick={handleCompleteEnrollment}>
            Complete Enrollment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default FaceEnrollment;
