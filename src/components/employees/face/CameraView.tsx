
import { useEffect } from "react";
import { User } from "lucide-react";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  currentDirection: string;
}

const CameraView = ({ videoRef, isCapturing, currentDirection }: CameraViewProps) => {
  useEffect(() => {
    // Ensure video plays when loaded
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.onloadedmetadata = () => {
        videoElement.play().catch(err => {
          console.error("Error playing video:", err);
        });
      };
    }
  }, [videoRef]);

  return (
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
            muted // Adding muted attribute to help with autoplay policies
            className="w-full h-auto"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 text-center">
            <p className="font-medium">Please look {currentDirection}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
