
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (imageSrc: string) => void;
}

const FaceCapture = ({ onCapture }: FaceCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    setIsLoading(true);
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
      toast({
        title: 'Camera Error',
        description: 'Could not access your camera. Please check permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageSrc = canvas.toDataURL('image/png');
        onCapture(imageSrc);
        setIsCaptured(true);
        
        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        
        setIsStreaming(false);
        
        toast({
          title: 'Face captured',
          description: 'Your face has been successfully captured',
        });
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
        {!isStreaming && !isCaptured && (
          <div className="h-80 flex flex-col items-center justify-center p-6 bg-gray-100">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4 text-center">
              Camera access is required for facial recognition
            </p>
            <Button 
              onClick={startCamera} 
              disabled={isLoading}
              className="bg-brand-600 hover:bg-brand-700"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Starting camera...
                </span>
              ) : 'Start Camera'}
            </Button>
          </div>
        )}
        
        {isStreaming && (
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-auto"
              onLoadedMetadata={() => videoRef.current?.play()}
            />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Button 
                onClick={captureImage} 
                className="bg-brand-600 hover:bg-brand-700"
              >
                Capture Face
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
