
interface EnrollmentInstructionsProps {
  isCapturing: boolean;
}

const EnrollmentInstructions = ({ isCapturing }: EnrollmentInstructionsProps) => {
  return (
    <div className="text-sm text-muted-foreground">
      {isCapturing ? (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
          <p className="font-medium">Instructions:</p>
          <p>Please follow the on-screen directions and keep your face clearly visible in the frame.</p>
          <p className="mt-1">Turn your head slowly as instructed and hold for a moment when prompted.</p>
          <p className="mt-1">Each image will be processed into a 50×50 pixel normalized format.</p>
        </div>
      ) : (
        <div>
          <p>
            We'll capture 20 images of your face from different angles to ensure accurate recognition.
            Make sure you're in a well-lit environment with your face clearly visible.
          </p>
          <p className="mt-1">
            Images will be processed and standardized for optimal facial recognition performance.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnrollmentInstructions;
