
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Clock, UserIcon, Users, Clock as ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data for department attendance
const departmentData = [
  { name: 'Engineering', present: 92, late: 5, absent: 3 },
  { name: 'Marketing', present: 88, late: 7, absent: 5 },
  { name: 'Design', present: 90, late: 8, absent: 2 },
  { name: 'Sales', present: 85, late: 10, absent: 5 },
  { name: 'HR', present: 95, late: 3, absent: 2 },
];

// Mock data for trends
const trendData = [
  { month: 'Jan', attendance: 95, late: 4, overtime: 12 },
  { month: 'Feb', attendance: 92, late: 7, overtime: 10 },
  { month: 'Mar', attendance: 94, late: 5, overtime: 15 },
  { month: 'Apr', attendance: 91, late: 8, overtime: 13 },
  { month: 'May', attendance: 93, late: 6, overtime: 11 },
];

// Mock data for today's attendance
const todayAttendanceData = [
  { name: 'Present', value: 42, color: '#22c55e' },
  { name: 'Late', value: 8, color: '#f59e0b' },
  { name: 'Absent', value: 5, color: '#ef4444' },
];

// Mock data for overtime hours
const overtimeData = [
  { name: 'Week 1', engineering: 24, marketing: 18, design: 12, sales: 15, hr: 8 },
  { name: 'Week 2', engineering: 20, marketing: 15, design: 10, sales: 17, hr: 6 },
  { name: 'Week 3', engineering: 28, marketing: 20, design: 15, sales: 12, hr: 9 },
  { name: 'Week 4', engineering: 26, marketing: 22, design: 18, sales: 14, hr: 7 },
];

// Recent activity logs
const activityLogs = [
  { id: 1, user: 'John Doe', action: 'checked in', time: '08:45 AM', department: 'Engineering' },
  { id: 2, user: 'Jane Smith', action: 'requested leave', time: '09:10 AM', department: 'Marketing' },
  { id: 3, user: 'Robert Johnson', action: 'checked out', time: '05:55 PM', department: 'Engineering' },
  { id: 4, user: 'Emily Davis', action: 'marked absent', time: 'System', department: 'Design' },
  { id: 5, user: 'Michael Wilson', action: 'approved overtime', time: '06:30 PM', department: 'HR' },
];

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [department, setDepartment] = useState("all");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive attendance and workforce insights
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">55</div>
            <p className="text-xs text-muted-foreground">
              +3 since last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              +2% from previous month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Check-in
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8:52 AM</div>
            <p className="text-xs text-muted-foreground">
              2 minutes earlier than last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overtime Hours
            </CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">187h</div>
            <p className="text-xs text-muted-foreground">
              -5% from previous month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
          <TabsTrigger value="department">Department Analysis</TabsTrigger>
          <TabsTrigger value="overtime">Overtime Analysis</TabsTrigger>
        </TabsList>
        
        {/* Attendance Trends Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends Over Time</CardTitle>
              <CardDescription>
                Monthly attendance, late arrivals and overtime trends
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ChartContainer
                config={{
                  attendance: { color: '#22c55e' },
                  late: { color: '#f59e0b' },
                  overtime: { color: '#6366f1' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="var(--color-attendance)" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="late" name="Late %" stroke="var(--color-late)" strokeWidth={2} />
                    <Line type="monotone" dataKey="overtime" name="Overtime Hours" stroke="var(--color-overtime)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Data shows improvement in attendance rates and reduction in late arrivals over time.
              </p>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>
                  Real-time attendance status for today
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ChartContainer
                  config={{
                    Present: { color: '#22c55e' },
                    Late: { color: '#f59e0b' },
                    Absent: { color: '#ef4444' },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={todayAttendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {todayAttendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
              <CardFooter className="justify-between">
                <div>
                  <p className="text-sm font-medium">Total Employees Today: 55</p>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest system activity logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{log.user}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.action} · {log.department}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View All Logs
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Department Analysis Tab */}
        <TabsContent value="department" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Attendance Analysis</CardTitle>
              <CardDescription>
                Comparative analysis of attendance metrics across departments
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ChartContainer
                config={{
                  present: { color: '#22c55e' },
                  late: { color: '#f59e0b' },
                  absent: { color: '#ef4444' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="present" name="Present %" fill="var(--color-present)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="Late %" fill="var(--color-late)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="Absent %" fill="var(--color-absent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>
                Detailed department-wise attendance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Total Employees</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Punctuality</TableHead>
                    <TableHead>Avg. Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Engineering</TableCell>
                    <TableCell>18</TableCell>
                    <TableCell>92%</TableCell>
                    <TableCell>95%</TableCell>
                    <TableCell>8:48 AM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Marketing</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>88%</TableCell>
                    <TableCell>93%</TableCell>
                    <TableCell>8:52 AM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Design</TableCell>
                    <TableCell>9</TableCell>
                    <TableCell>90%</TableCell>
                    <TableCell>92%</TableCell>
                    <TableCell>8:55 AM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sales</TableCell>
                    <TableCell>11</TableCell>
                    <TableCell>85%</TableCell>
                    <TableCell>90%</TableCell>
                    <TableCell>9:02 AM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">HR</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>95%</TableCell>
                    <TableCell>97%</TableCell>
                    <TableCell>8:45 AM</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                Export Department Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Overtime Analysis Tab */}
        <TabsContent value="overtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Hours by Department</CardTitle>
              <CardDescription>
                Weekly overtime distribution across departments
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ChartContainer
                config={{
                  engineering: { color: '#6366f1' },
                  marketing: { color: '#ec4899' },
                  design: { color: '#f97316' },
                  sales: { color: '#14b8a6' },
                  hr: { color: '#8b5cf6' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overtimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="engineering" name="Engineering" fill="var(--color-engineering)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="marketing" name="Marketing" fill="var(--color-marketing)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="design" name="Design" fill="var(--color-design)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sales" name="Sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hr" name="HR" fill="var(--color-hr)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Engineering consistently has the highest overtime hours, while HR has the lowest.
              </p>
            </CardFooter>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Overtime Employees</CardTitle>
                <CardDescription>
                  Employees with most overtime hours this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>% Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">John Doe</TableCell>
                      <TableCell>Engineering</TableCell>
                      <TableCell>12.5</TableCell>
                      <TableCell className="text-green-600">+15%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Jane Smith</TableCell>
                      <TableCell>Marketing</TableCell>
                      <TableCell>10.8</TableCell>
                      <TableCell className="text-green-600">+5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Robert Johnson</TableCell>
                      <TableCell>Engineering</TableCell>
                      <TableCell>9.5</TableCell>
                      <TableCell className="text-red-600">-8%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Emily Davis</TableCell>
                      <TableCell>Sales</TableCell>
                      <TableCell>8.2</TableCell>
                      <TableCell className="text-green-600">+12%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Overtime Cost Analysis</CardTitle>
                <CardDescription>
                  Financial impact of overtime hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Total Overtime Hours</div>
                  <div className="mt-1 text-2xl font-bold">187 hours</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Estimated Overtime Cost</div>
                  <div className="mt-1 text-2xl font-bold">$5,425</div>
                  <p className="text-xs text-muted-foreground">Based on average hourly rates</p>
                </div>
                
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Cost vs Budget</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-lg font-bold">85%</span>
                    <span className="text-xs text-green-600">Under budget</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Generate Cost Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
