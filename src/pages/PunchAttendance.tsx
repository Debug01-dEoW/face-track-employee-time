
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Clock, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { findEmployeeByFace, FaceData } from '@/services/FaceDatabase';
import { checkServiceAvailability } from '@/services/FaceRecognitionService';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PunchAttendance = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedEmployee, setRecognizedEmployee] = useState<FaceData | null>(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [lastPunchTime, setLastPunchTime] = useState<string | null>(null);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();
  
  // Check if Python backend is available
  useEffect(() => {
    const checkServer = async () => {
      const isAvailable = await checkServiceAvailability();
      setServerAvailable(isAvailable);
      
      if (!isAvailable) {
        toast.warning("Face recognition server is not available", {
          description: "Using local fallback mode with limited recognition"
        });
      } else {
        toast.success("Connected to face recognition server");
      }
    };
    
    checkServer();
  }, []);
  
  // Start camera when component mounts
  useEffect(() => {
    // Check if someone already punched recently
    const lastPunch = localStorage.getItem('last_attendance_punch');
    if (lastPunch) {
      const punchData = JSON.parse(lastPunch);
      const punchTime = new Date(punchData.timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - punchTime.getTime()) / 1000 / 60;
      
      // If someone punched within the last 1 minute, show a warning
      if (diffMinutes < 1) {
        setLastPunchTime(punchData.name);
      }
    }
    
    return () => {
      stopCamera();
    };
  }, []);
  
  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };
  
  // Capture current frame
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      return canvas.toDataURL("image/jpeg", 0.9);
    }
    return null;
  };
  
  // Recognize face
  const recognizeFace = async () => {
    setIsProcessing(true);
    
    if (!cameraActive) {
      await startCamera();
      setIsProcessing(false);
      return;
    }
    
    const frameSrc = captureFrame();
    if (!frameSrc) {
      toast.error("Failed to capture image");
      setIsProcessing(false);
      return;
    }
    
    try {
      // Find employee by face
      const employee = await findEmployeeByFace(frameSrc);
      
      if (employee) {
        setRecognizedEmployee(employee);
        toast.success(`Welcome, ${employee.employeeName}!`);
      } else {
        toast.error("Face not recognized. Please try again.");
      }
    } catch (error) {
      console.error("Face recognition error:", error);
      toast.error("An error occurred during face recognition");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Mark attendance
  const markAttendance = () => {
    if (!recognizedEmployee) return;
    
    // Save attendance record (in a real app, this would go to a database)
    const attendanceRecord = {
      employeeId: recognizedEmployee.employeeId,
      name: recognizedEmployee.employeeName,
      timestamp: new Date().toISOString(),
      type: "punch" // Could be "in" or "out" in a real app
    };
    
    // Store in localStorage for demo
    const existingRecords = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    existingRecords.push(attendanceRecord);
    localStorage.setItem('attendance_records', JSON.stringify(existingRecords));
    
    // Store last punch info
    localStorage.setItem('last_attendance_punch', JSON.stringify({
      name: recognizedEmployee.employeeName,
      timestamp: new Date().toISOString()
    }));
    
    setAttendanceMarked(true);
    toast.success("Attendance marked successfully!");
    
    // Redirect after a delay
    setTimeout(() => {
      navigate("/dashboard");
    }, 3000);
  };
  
  // Reset and try again
  const resetAndTryAgain = () => {
    setRecognizedEmployee(null);
    setAttendanceMarked(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Punch Attendance</h1>
        <p className="text-muted-foreground">
          Use facial recognition to mark your attendance
        </p>
      </div>
      
      {serverAvailable === false && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Face recognition server is not available. Using local fallback mode with limited recognition accuracy.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Face Recognition</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {lastPunchTime && !recognizedEmployee && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800">
                <p className="font-medium">Notice</p>
                <p className="text-sm">Another employee recently punched in. Please wait a moment before trying.</p>
              </div>
            )}
            
            <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              {!recognizedEmployee ? (
                <div>
                  {cameraActive ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="h-80 flex flex-col items-center justify-center">
                      <User className="h-20 w-20 text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Camera will activate when you click the button below</p>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 p-6 rounded-lg text-white text-center max-w-xs">
                      <p className="mb-4">Position your face in the frame</p>
                      <Button
                        onClick={recognizeFace}
                        disabled={isProcessing}
                        className="bg-brand-600 hover:bg-brand-700"
                      >
                        {isProcessing ? (
                          <>
                            <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                            Processing...
                          </>
                        ) : !cameraActive ? (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Start Camera
                          </>
                        ) : (
                          <>Recognize Face</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900 p-8 rounded-lg">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">Welcome, {recognizedEmployee.employeeName}!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{recognizedEmployee.department} - {recognizedEmployee.position}</p>
                    
                    {!attendanceMarked ? (
                      <div className="space-y-3 w-full">
                        <Button 
                          onClick={markAttendance}
                          className="w-full bg-brand-600 hover:bg-brand-700"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Mark Attendance
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={resetAndTryAgain}
                          className="w-full"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <div className="text-green-600 dark:text-green-400">
                        <p className="font-medium">Attendance marked successfully!</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirecting to dashboard...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PunchAttendance;
