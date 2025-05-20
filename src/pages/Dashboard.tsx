
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { User, Users, Clock, Calendar } from "lucide-react";

// Mock data
const stats = {
  totalEmployees: 15,
  presentToday: 12,
  lateToday: 2,
  absentToday: 1,
  averageTime: "09:02 AM"
};

const recentActivity = [
  { id: 1, name: "John Doe", action: "checked in", time: "08:45 AM", status: "on-time" },
  { id: 2, name: "Jane Smith", action: "checked in", time: "09:10 AM", status: "late" },
  { id: 3, name: "Robert Johnson", action: "checked in", time: "08:55 AM", status: "on-time" },
  { id: 4, name: "Emily Davis", action: "checked in", time: "09:15 AM", status: "late" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's your attendance overview.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Total Employees" : "My Working Hours"}
            </CardTitle>
            {isAdmin ? <Users className="h-4 w-4 text-muted-foreground" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAdmin ? stats.totalEmployees : "160h / 168h"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "+2 since last month" : "This month"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Present Today" : "Days Present"}
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAdmin ? stats.presentToday : "19/21"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? `${stats.presentToday}/${stats.totalEmployees} employees` : "This month"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Late Today" : "Late Check-ins"}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAdmin ? stats.lateToday : "2"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? `${((stats.lateToday / stats.totalEmployees) * 100).toFixed(1)}% of workforce` : "This month"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Average Check-in" : "Last Check-in"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAdmin ? stats.averageTime : "08:56 AM"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Today" : "Today, on time"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="mr-4">
                  <span className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${activity.status === 'on-time' ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {activity.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {activity.name} <span className="text-gray-500 font-normal">{activity.action}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Today at {activity.time}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={`px-2 py-1 text-xs rounded ${activity.status === 'on-time' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {activity.status === 'on-time' ? 'On Time' : 'Late'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
