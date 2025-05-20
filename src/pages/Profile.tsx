
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { User as UserIcon, Mail, Building, Clock, Calendar } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: "Engineering",
    position: "Software Engineer",
    phone: "+1 (555) 123-4567",
    joinDate: "January 15, 2025",
    address: "123 Main St, Anytown, CA 94123"
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = () => {
    // In a real app, this would send the data to an API
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      department: "Engineering",
      position: "Software Engineer",
      phone: "+1 (555) 123-4567",
      joinDate: "January 15, 2025",
      address: "123 Main St, Anytown, CA 94123"
    });
  };
  
  // Mock data for attendance statistics
  const attendanceStats = {
    present: 42,
    late: 5,
    absent: 3,
    totalDays: 50,
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your personal information
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-3xl">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user?.name}</CardTitle>
            <CardDescription>{profileData.position}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span>{profileData.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-500" />
                <span>{profileData.department}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span>Joined: {profileData.joinDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attendance" className="pt-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-gray-500">Working Days</div>
                    <div className="mt-1 text-2xl font-bold">{attendanceStats.totalDays}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-gray-500">Present</div>
                    <div className="mt-1 text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-gray-500">Late</div>
                    <div className="mt-1 text-2xl font-bold text-amber-600">{attendanceStats.late}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-gray-500">Absent</div>
                    <div className="mt-1 text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Attendance rate: {Math.round((attendanceStats.present / attendanceStats.totalDays) * 100)}%
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${(attendanceStats.present / attendanceStats.totalDays) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
