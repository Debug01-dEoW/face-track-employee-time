
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, RefreshCw, User, Server, AlertTriangle } from 'lucide-react';
import { recognizeFace, checkServiceAvailability } from '@/services/FaceRecognitionService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FaceCaptureProps {
  onCapture: (imageSrc: string, recognizedPerson?: { id: string, name: string } | null) => void;
}

const FaceCapture = ({ onCapture }: FaceCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);

  // Check if Python backend is available
  useEffect(() => {
    const checkServer = async () => {
      const isAvailable = await checkServiceAvailability();
      setServerAvailable(isAvailable);
      
      if (isAvailable) {
        console.log("Connected to Python face recognition server");
      } else {
        console.log("Python face recognition server not available");
      }
    };
    
    checkServer();
  }, []);

  useEffect(() => {
    return () => {
      // Clean up stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setIsProcessing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Could not access your camera. Please check permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      setIsProcessing(true);
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        const context = canvas.getContext('2d');
        if (!context) {
          toast.error("Could not get canvas context");
          return;
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        
        // Send to backend for recognition
        const recognitionResult = await recognizeFace(imageSrc);
        
        onCapture(imageSrc, recognitionResult);
        setIsCaptured(true);
        
        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        
        setIsStreaming(false);
        
        if (recognitionResult) {
          toast.success(`Identified as ${recognitionResult.name}`);
        } else {
          toast.info('Face was not recognized in our system');
        }
      } catch (error) {
        console.error('Error during face capture:', error);
        toast.error('Failed to process the image');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const resetCapture = () => {
    setIsCaptured(false);
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative">
        {serverAvailable === false && (
          <Alert variant="destructive" className="m-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Face recognition server is not available. Using local fallback mode.
            </AlertDescription>
          </Alert>
        )}
        
        {serverAvailable === true && (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 m-3">
            <Server className="h-4 w-4" />
            <AlertDescription>
              Using Python-powered face recognition for high accuracy.
            </AlertDescription>
          </Alert>
        )}
        
        {!isStreaming && !isCaptured && (
          <div className="h-80 flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
              Camera access is required for facial recognition
            </p>
            <Button 
              onClick={startCamera} 
              disabled={isProcessing}
              className="bg-brand-600 hover:bg-brand-700"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Starting camera...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Start Camera
                </span>
              )}
            </Button>
          </div>
        )}
        
        {isStreaming && (
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-auto"
              onLoadedMetadata={() => videoRef.current?.play()}
            />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Button 
                onClick={captureImage}
                disabled={isProcessing}
                className="bg-brand-600 hover:bg-brand-700"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Capture Face
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {isCaptured && (
          <div className="relative">
            <canvas 
              ref={canvasRef} 
              className="w-full h-auto"
            />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <Button 
                onClick={resetCapture} 
                variant="outline"
              >
                Retake
              </Button>
            </div>
          </div>
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default FaceCapture;
