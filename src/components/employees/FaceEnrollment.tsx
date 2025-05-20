
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Camera, Check, User, RefreshCw } from "lucide-react";

interface FaceEnrollmentProps {
  employeeId: number;
  employeeName: string;
  onComplete: (faceData: string) => void;
  onCancel: () => void;
}

const FaceEnrollment = ({ employeeId, employeeName, onComplete, onCancel }: FaceEnrollmentProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [faceSamples, setFaceSamples] = useState<string[]>([]);
  const [currentDirection, setCurrentDirection] = useState("center");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const directions = [
    "center", "slightly right", "right", 
    "slightly left", "left", 
    "slightly up", "up", 
    "slightly down", "down",
    "right up", "right down", 
    "left up", "left down",
    "center", "center", // More center shots for better accuracy
    "slight smile", "big smile", 
    "neutral", "slight frown", "eyebrows raised"
  ];

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
    }
  };

  // Start face capture process
  const startCapture = () => {
    setIsCapturing(true);
    setProgress(0);
    setFaceSamples([]);
    captureNextSample();
  };

  // Capture a single face sample
  const captureSample = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
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
      const imageSrc = canvas.toDataURL("image/png");
      return imageSrc;
    }
    return null;
  };

  // Capture next sample with delay
  const captureNextSample = () => {
    if (faceSamples.length >= 20) {
      // We have enough samples
      finishCapture();
      return;
    }
    
    // Set the current direction instruction
    setCurrentDirection(directions[faceSamples.length]);
    
    // Give the user a moment to adjust their face
    setTimeout(() => {
      const sample = captureSample();
      if (sample) {
        setFaceSamples(prev => [...prev, sample]);
        setProgress((faceSamples.length + 1) * 5); // 5% per sample
      }
      
      // Small delay before next capture
      setTimeout(captureNextSample, 1500);
    }, 2000);
  };

  // Finish the capture process
  const finishCapture = () => {
    setIsCapturing(false);
    
    // Combine all face samples into one data structure
    const faceData = JSON.stringify({
      employeeId,
      timestamp: new Date().toISOString(),
      samples: faceSamples
    });
    
    toast.success("Face enrollment completed successfully!");
    onComplete(faceData);
  };

  // Clean up on component unmount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Face Enrollment: {employeeName}</CardTitle>
        <CardDescription>
          Please follow the instructions to capture face from different angles
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="relative rounded-md overflow-hidden bg-gray-100 aspect-video">
          {!isCapturing ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <User className="h-16 w-16 text-gray-400" />
              <p className="text-gray-500 text-center px-6">
                Click "Start Enrollment" to begin the face capture process
              </p>
            </div>
          ) : (
            <div className="relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 text-center">
                <p className="font-medium">Please look {currentDirection}</p>
              </div>
            </div>
          )}
        </div>
        
        {isCapturing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.min(100, progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>We'll capture 20 images of your face from different angles to ensure accurate recognition.</p>
        </div>
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
