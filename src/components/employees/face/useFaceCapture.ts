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

// Standard image dimensions for face processing (same as Python script)
const FACE_IMAGE_SIZE = 50;

export const useFaceCapture = (onComplete: (faceData: string) => void) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [faceSamples, setFaceSamples] = useState<string[]>([]);
  const [currentDirection, setCurrentDirection] = useState("center");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Create a processing canvas for image manipulation
  useEffect(() => {
    processingCanvasRef.current = document.createElement('canvas');
    processingCanvasRef.current.width = FACE_IMAGE_SIZE;
    processingCanvasRef.current.height = FACE_IMAGE_SIZE;
    
    return () => {
      processingCanvasRef.current = null;
    };
  }, []);
  
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

  // Start camera with better error handling
  const startCamera = async () => {
    try {
      console.log("Attempting to access camera...");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported in this browser");
      }
      
      const constraints = { 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      };
      
      console.log("Requesting camera with constraints:", constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted:", stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded, playing video");
          videoRef.current?.play().catch(e => console.error("Error playing video:", e));
          setCameraActive(true);
        };
      } else {
        console.error("Video ref is null");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
      setIsCapturing(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    console.log("Stopping camera");
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        console.log("Stopping track:", track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
      setCameraActive(false);
    } else {
      console.log("No camera to stop");
    }
  };

  // Process image to standardized format (similar to Python script)
  const processImage = (imageData: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!processingCanvasRef.current) {
        reject(new Error("Processing canvas not available"));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = processingCanvasRef.current as HTMLCanvasElement;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          
          // Clear canvas
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, FACE_IMAGE_SIZE, FACE_IMAGE_SIZE);
          
          // Draw image resized to 50x50 (matching Python script)
          ctx.drawImage(img, 0, 0, FACE_IMAGE_SIZE, FACE_IMAGE_SIZE);
          
          // Get image data for processing
          const imageDataObj = ctx.getImageData(0, 0, FACE_IMAGE_SIZE, FACE_IMAGE_SIZE);
          
          // Convert to grayscale (optional, similar to Python script's capability)
          // Keeping color information for now as it may be useful for recognition
          
          // Return processed image as data URL
          const processedDataUrl = canvas.toDataURL("image/png");
          console.log("Image successfully processed to standard format");
          resolve(processedDataUrl);
        } catch (e) {
          console.error("Error processing image:", e);
          reject(e);
        }
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image for processing"));
      };
      
      img.src = imageData;
    });
  };

  // Capture a single face sample with better error handling
  const captureSample = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref is null");
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video dimensions are zero, stream might not be ready");
      return null;
    }
    
    console.log("Capturing sample, video dimensions:", video.videoWidth, "x", video.videoHeight);
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext("2d");
    if (context) {
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log("Frame drawn to canvas");
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL("image/png");
        console.log("Sample captured successfully");
        
        // Process image to standardized format
        try {
          const processedDataUrl = await processImage(dataUrl);
          console.log("Image processed successfully");
          return processedDataUrl;
        } catch (e) {
          console.error("Error in image processing:", e);
          // Fall back to original if processing fails
          return dataUrl;
        }
      } catch (e) {
        console.error("Error capturing frame:", e);
        return null;
      }
    }
    console.error("Could not get canvas context");
    return null;
  };

  // Capture next sample with delay
  const captureNextSample = async () => {
    if (faceSamples.length >= 20) {
      console.log("All samples collected, finishing capture");
      finishCapture();
      return;
    }
    
    // Set the current direction instruction
    setCurrentDirection(directions[faceSamples.length]);
    console.log("Setting direction:", directions[faceSamples.length]);
    
    // Give the user a moment to adjust their face
    setTimeout(async () => {
      const sample = await captureSample();
      if (sample) {
        setFaceSamples(prev => [...prev, sample]);
        setProgress((faceSamples.length + 1) * 5); // 5% per sample
        console.log("Sample added, new count:", faceSamples.length + 1);
      } else {
        console.error("Failed to capture sample");
        toast.error("Failed to capture image, please try again");
      }
      
      // Continue capturing if still in capturing state
      if (isCapturing) {
        setTimeout(captureNextSample, 1500);
      }
    }, 2000);
  };

  // Start face capture process
  const startCapture = () => {
    console.log("Starting face capture process");
    setIsCapturing(true);
    setProgress(0);
    setFaceSamples([]);
    startCamera().then(() => {
      // Start capturing after a short delay to ensure camera is ready
      setTimeout(captureNextSample, 2000);
    });
  };

  // Reset the capture process
  const resetCapture = () => {
    console.log("Resetting capture process");
    setIsCapturing(false);
    setProgress(0);
    setFaceSamples([]);
    setCurrentDirection("center");
    stopCamera();
  };

  // Finish the capture process
  const finishCapture = () => {
    console.log("Finishing capture with", faceSamples.length, "samples");
    setIsCapturing(false);
    
    // Combine all face samples into one data structure
    const faceData = JSON.stringify({
      timestamp: new Date().toISOString(),
      samples: faceSamples,
      processingInfo: {
        imageSize: FACE_IMAGE_SIZE,
        format: "PNG"
      }
    });
    
    toast.success("Face enrollment completed successfully!");
    onComplete(faceData);
    
    // Clean up camera
    stopCamera();
  };

  // Setup camera when component mounts and cleanup when unmounts
  useEffect(() => {
    return () => {
      // Ensure camera is stopped when component unmounts
      console.log("Component unmounting, cleaning up camera");
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
