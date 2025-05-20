
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import FaceCapture from '@/components/FaceCapture/FaceCapture';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.avatar || '');

  const handleCapture = (imageSrc: string) => {
    setProfileImage(imageSrc);
    setShowFaceCapture(false);
    toast({
      title: 'Face updated',
      description: 'Your facial profile has been updated successfully',
    });
  };

  const handleUpdateProfile = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and update your personal information
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user?.name} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact administrator for help.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue={user?.role} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" defaultValue="Engineering" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" defaultValue="Software Developer" />
              </div>
              
              <Button 
                onClick={handleUpdateProfile}
                type="button"
                className="w-full bg-brand-600 hover:bg-brand-700 mt-4"
              >
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Facial Recognition Profile</CardTitle>
            <CardDescription>Update your facial recognition data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4">
              {!showFaceCapture && (
                <>
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-brand-100 mb-4">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => setShowFaceCapture(true)}
                    variant="outline"
                  >
                    Update Face Data
                  </Button>
                  
                  <div className="text-sm text-center text-gray-500 mt-4">
                    <p>Your facial data is used for attendance verification.</p>
                    <p>Make sure your face is well lit and clearly visible when updating.</p>
                  </div>
                </>
              )}
              
              {showFaceCapture && (
                <div className="w-full">
                  <FaceCapture onCapture={handleCapture} />
                  <Button
                    onClick={() => setShowFaceCapture(false)}
                    variant="outline"
                    className="mt-2 w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Update your password and security preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            
            <Button type="button" className="bg-brand-600 hover:bg-brand-700">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
