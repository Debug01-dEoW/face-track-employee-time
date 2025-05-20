
interface EnrollmentInstructionsProps {
  isCapturing: boolean;
}

const EnrollmentInstructions = ({ isCapturing }: EnrollmentInstructionsProps) => {
  return (
    <div className="text-sm text-muted-foreground">
      <p>
        {isCapturing 
          ? "Please follow the on-screen instructions and keep your face visible."
          : "We'll capture 20 images of your face from different angles to ensure accurate recognition."}
      </p>
    </div>
  );
};

export default EnrollmentInstructions;
