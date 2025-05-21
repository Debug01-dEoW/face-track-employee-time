
import LoginForm from '@/components/Auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Camera, User } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("password");

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleFaceLogin = () => {
    toast.info("Face login module", {
      description: "Face recognition login is available via the web version. Please use the web interface to use face login."
    });
    
    // Open the web version in a new tab
    window.open('/web/checkin.html', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-brand-600 mb-2">Attendance system</h1>
        <p className="text-gray-600">Employee Facial Attendance System</p>
      </div>
      
      <div className="w-full max-w-md mx-auto">
        <Tabs defaultValue="password" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="password">Password Login</TabsTrigger>
            <TabsTrigger value="face">Face Recognition</TabsTrigger>
          </TabsList>
          
          <TabsContent value="password">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="face">
            <Card>
              <CardHeader>
                <CardTitle>Face Recognition Login</CardTitle>
                <CardDescription>
                  Authenticate using your face
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                  <Camera className="h-10 w-10 text-gray-500" />
                </div>
                <p className="text-center text-gray-500 mb-6">
                  Use facial recognition to quickly sign in to your account.
                </p>
                <Button onClick={handleFaceLogin} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Face Recognition
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Our facial recognition technology provides secure and convenient authentication.
        </p>
      </div>
    </div>
  );
};

export default Login;
