
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

// Mock data for attendance
const attendanceData = [
  { date: new Date(2025, 4, 1), status: 'present', checkIn: '08:52 AM', checkOut: '05:10 PM' },
  { date: new Date(2025, 4, 2), status: 'present', checkIn: '08:45 AM', checkOut: '05:05 PM' },
  { date: new Date(2025, 4, 3), status: 'late', checkIn: '09:15 AM', checkOut: '05:30 PM' },
  { date: new Date(2025, 4, 6), status: 'present', checkIn: '08:50 AM', checkOut: '05:15 PM' },
  { date: new Date(2025, 4, 7), status: 'present', checkIn: '08:55 AM', checkOut: '05:00 PM' },
  { date: new Date(2025, 4, 8), status: 'absent', checkIn: '', checkOut: '' },
  { date: new Date(2025, 4, 9), status: 'present', checkIn: '08:49 AM', checkOut: '05:05 PM' },
  { date: new Date(2025, 4, 10), status: 'present', checkIn: '08:47 AM', checkOut: '05:10 PM' },
  { date: new Date(2025, 4, 13), status: 'late', checkIn: '09:20 AM', checkOut: '05:35 PM' },
  { date: new Date(2025, 4, 14), status: 'present', checkIn: '08:50 AM', checkOut: '05:15 PM' },
  { date: new Date(2025, 4, 15), status: 'present', checkIn: '08:45 AM', checkOut: '05:05 PM' },
  { date: new Date(2025, 4, 16), status: 'present', checkIn: '08:52 AM', checkOut: '05:20 PM' },
  { date: new Date(2025, 4, 17), status: 'present', checkIn: '08:48 AM', checkOut: '05:10 PM' },
];

// Monthly summary statistics
const monthlyStats = {
  present: 10,
  late: 2,
  absent: 1,
  totalWorkingDays: 13
};

// Chart data
const chartData = [
  { name: 'Week 1', onTime: 4, late: 1, absent: 0 },
  { name: 'Week 2', onTime: 4, late: 0, absent: 1 },
  { name: 'Week 3', onTime: 2, late: 1, absent: 0 },
  { name: 'Week 4', onTime: 0, late: 0, absent: 0 },
];

const Attendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // FIX: Convert the modifyDay function to a string or use a different component prop
  const getDayClass = (day: Date): string => {
    const found = attendanceData.find(
      (item) => item.date.toDateString() === day.toDateString()
    );
    
    if (!found) return "";
    
    switch (found.status) {
      case 'present':
        return "bg-green-100 text-green-800 rounded-full";
      case 'late':
        return "bg-amber-100 text-amber-800 rounded-full";
      case 'absent':
        return "bg-red-100 text-red-800 rounded-full";
      default:
        return "";
    }
  };
  
  // Custom modifiers object
  const modifiers = {
    present: (date: Date) => {
      return attendanceData.some(
        (item) => item.date.toDateString() === date.toDateString() && item.status === 'present'
      );
    },
    late: (date: Date) => {
      return attendanceData.some(
        (item) => item.date.toDateString() === date.toDateString() && item.status === 'late'
      );
    },
    absent: (date: Date) => {
      return attendanceData.some(
        (item) => item.date.toDateString() === date.toDateString() && item.status === 'absent'
      );
    },
  };
  
  // Custom modifiers styles
  const modifiersStyles = {
    present: { backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 'bold' },
    late: { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' },
    absent: { backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' },
  };
  
  // Find attendance for selected date
  const selectedDateAttendance = attendanceData.find(
    (item) => date && item.date.toDateString() === date.toDateString()
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground">
          Track and monitor your attendance history
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
              />
              
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Present</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-amber-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Late</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Absent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Selected Date Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateAttendance ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {date?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <Badge variant={
                    selectedDateAttendance.status === 'present' ? 'default' :
                    selectedDateAttendance.status === 'late' ? 'secondary' : 'destructive'
                  }>
                    {selectedDateAttendance.status.charAt(0).toUpperCase() + selectedDateAttendance.status.slice(1)}
                  </Badge>
                </div>
                
                {selectedDateAttendance.status !== 'absent' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-gray-500">Check-in Time</div>
                      <div className="mt-1 flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-lg font-bold">{selectedDateAttendance.checkIn}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-gray-500">Check-out Time</div>
                      <div className="mt-1 flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-lg font-bold">{selectedDateAttendance.checkOut}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedDateAttendance.status === 'absent' && (
                  <div className="py-8 text-center text-gray-500">
                    No attendance record for this date
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                {date ? 'No record found for selected date' : 'Please select a date'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">Working Days</div>
              <div className="mt-1 text-2xl font-bold">{monthlyStats.totalWorkingDays}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">Present</div>
              <div className="mt-1 text-2xl font-bold text-green-600">{monthlyStats.present}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">Late</div>
              <div className="mt-1 text-2xl font-bold text-amber-600">{monthlyStats.late}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-gray-500">Absent</div>
              <div className="mt-1 text-2xl font-bold text-red-600">{monthlyStats.absent}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                onTime: { color: '#22c55e' },
                late: { color: '#f59e0b' },
                absent: { color: '#ef4444' },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="onTime" name="On Time" fill="var(--color-onTime)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="var(--color-late)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="var(--color-absent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
