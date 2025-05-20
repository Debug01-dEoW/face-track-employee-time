
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  isCapturing: boolean;
}

const ProgressIndicator = ({ progress, isCapturing }: ProgressIndicatorProps) => {
  if (!isCapturing) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progress</span>
        <span>{Math.min(100, progress)}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
};

export default ProgressIndicator;
