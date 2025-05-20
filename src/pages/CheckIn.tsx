
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FaceCapture from '@/components/FaceCapture/FaceCapture';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CheckIn = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [lastAction, setLastAction] = useState<'check-in' | 'check-out' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
  };
  
  const handleCheckIn = async () => {
    // Simulation of processing
    setCheckingIn(true);
    
    // Simulate server processing with slight delay
    setTimeout(() => {
      setConfirmed(true);
      setLastAction('check-in');
      setCheckingIn(false);
      
      // Show success message
      toast({
        title: 'Check-in successful!',
        description: `You checked in at ${new Date().toLocaleTimeString()}`,
      });
    }, 2000);
  };
  
  const handleCheckOut = async () => {
    // Simulation of processing
    setCheckingIn(true);
    
    // Simulate server processing with slight delay
    setTimeout(() => {
      setConfirmed(true);
      setLastAction('check-out');
      setCheckingIn(false);
      
      // Show success message
      toast({
        title: 'Check-out successful!',
        description: `You checked out at ${new Date().toLocaleTimeString()}`,
      });
    }, 2000);
  };
  
  const resetProcess = () => {
    setCapturedImage(null);
    setConfirmed(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Check In/Out</h1>
        <p className="text-muted-foreground">
          Use facial recognition to record your attendance
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {!confirmed && (
            <Card>
              <CardHeader>
                <CardTitle>Facial Recognition</CardTitle>
                <CardDescription>
                  Position your face in the frame and capture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FaceCapture onCapture={handleCapture} />
              </CardContent>
            </Card>
          )}
          
          {confirmed && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {lastAction === 'check-in' ? 'Check-in Confirmed' : 'Check-out Confirmed'}
                </CardTitle>
                <CardDescription>
                  {lastAction === 'check-in' 
                    ? 'You have successfully checked in for today' 
                    : 'You have successfully checked out for today'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-xl font-semibold text-center">
                  {new Date().toLocaleTimeString()}
                </p>
                <p className="text-gray-500 mb-6">
                  {new Date().toLocaleDateString()}
                </p>
                <Button 
                  onClick={resetProcess}
                  variant="outline"
                >
                  Record Another
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Today's Status</CardTitle>
              <CardDescription>Your attendance record for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="bg-brand-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className={`text-sm ${lastAction === 'check-in' ? 'text-green-600' : lastAction === 'check-out' ? 'text-gray-600' : 'text-amber-600'}`}>
                    {lastAction === 'check-in' 
                      ? '✅ Checked In' 
                      : lastAction === 'check-out' 
                        ? '🏁 Checked Out'
                        : '⚠️ Not Checked In'}
                  </p>
                </div>
              </div>
              
              <div className="grid gap-2">
                <h3 className="font-medium">Schedule</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500">Expected Check-in</p>
                    <p className="font-medium">09:00 AM</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500">Expected Check-out</p>
                    <p className="font-medium">05:00 PM</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleCheckIn}
                  disabled={!capturedImage || checkingIn || lastAction === 'check-in'}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  {checkingIn ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Check In'}
                </Button>
                
                <Button
                  onClick={handleCheckOut}
                  disabled={!capturedImage || checkingIn || lastAction === 'check-out' || !lastAction}
                  variant="outline"
                >
                  {checkingIn ? 'Processing...' : 'Check Out'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
