
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface FaceCapture {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  progress: number;
  currentDirection: string;
  faceSamples: string[];
  startCapture: () => void;
  resetCapture: () => void;
}

export const useFaceCapture = (onComplete: (faceData: string) => void) => {
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

  // Capture a single face sample
  const captureSample = () => {
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
      return canvas.toDataURL("image/png");
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

  // Start face capture process
  const startCapture = () => {
    setIsCapturing(true);
    setProgress(0);
    setFaceSamples([]);
    captureNextSample();
  };

  // Reset the capture process
  const resetCapture = () => {
    setIsCapturing(false);
    setProgress(0);
    setFaceSamples([]);
    setCurrentDirection("center");
  };

  // Finish the capture process
  const finishCapture = () => {
    setIsCapturing(false);
    
    // Combine all face samples into one data structure
    const faceData = JSON.stringify({
      timestamp: new Date().toISOString(),
      samples: faceSamples
    });
    
    toast.success("Face enrollment completed successfully!");
    onComplete(faceData);
  };

  // Setup camera when component mounts and cleanup when unmounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isCapturing,
    progress,
    currentDirection,
    faceSamples,
    startCapture,
    resetCapture
  };
};
