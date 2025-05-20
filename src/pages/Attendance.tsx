
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';

// Mock data
const attendanceData = [
  { date: '2025-05-15', checkIn: '09:05 AM', checkOut: '05:10 PM', status: 'present', hours: '8:05' },
  { date: '2025-05-16', checkIn: '08:55 AM', checkOut: '05:00 PM', status: 'present', hours: '8:05' },
  { date: '2025-05-17', checkIn: '09:20 AM', checkOut: '05:15 PM', status: 'late', hours: '7:55' },
  { date: '2025-05-18', checkIn: null, checkOut: null, status: 'absent', hours: '0:00' },
  { date: '2025-05-19', checkIn: '08:50 AM', checkOut: '05:05 PM', status: 'present', hours: '8:15' },
  { date: '2025-05-20', checkIn: '09:00 AM', checkOut: null, status: 'present', hours: '--' },
];

const Attendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Find attendance data for selected date
  const selectedDateString = date?.toISOString().split('T')[0];
  const selectedAttendance = attendanceData.find(item => item.date === selectedDateString);
  
  // Highlight dates with attendance data
  const getDayClassName = (day: Date) => {
    const dateString = day.toISOString().split('T')[0];
    const attendance = attendanceData.find(item => item.date === dateString);
    
    if (!attendance) return '';
    
    if (attendance.status === 'present') return 'bg-green-100 text-green-800 rounded-full';
    if (attendance.status === 'late') return 'bg-amber-100 text-amber-800 rounded-full';
    if (attendance.status === 'absent') return 'bg-red-100 text-red-800 rounded-full';
    
    return '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">
          View and manage your attendance records
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              classNames={{
                day_today: "bg-brand-100 text-brand-700",
                day_selected: "bg-brand-600 text-white hover:bg-brand-600 hover:text-white focus:bg-brand-600 focus:text-white",
                day: (date) => getDayClassName(date),
              }}
            />
            
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Late</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Absent</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Attendance Details</CardTitle>
            <CardDescription>
              {selectedDateString || 'Select a date to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAttendance ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Check In</p>
                    <p className="text-lg font-medium">
                      {selectedAttendance.checkIn || 'Not recorded'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Check Out</p>
                    <p className="text-lg font-medium">
                      {selectedAttendance.checkOut || 'Not recorded'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <div className="flex items-center">
                    <span 
                      className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                        selectedAttendance.status === 'present' ? 'bg-green-100 text-green-800' :
                        selectedAttendance.status === 'late' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedAttendance.status.charAt(0).toUpperCase() + selectedAttendance.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500 mb-1">Total Hours</p>
                  <p className="text-lg font-medium">{selectedAttendance.hours}</p>
                </div>
                
                {selectedAttendance.status === 'absent' && (
                  <Button className="w-full bg-brand-600 hover:bg-brand-700">
                    Request Leave Approval
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-500">Select a date from the calendar to view attendance details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Attendance;
