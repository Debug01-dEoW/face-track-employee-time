
import { useState } from 'react';
import { AttendanceCalendarCard } from '@/components/attendance/AttendanceCalendarCard';
import { AttendanceDetailCard } from '@/components/attendance/AttendanceDetailCard';
import { MonthlySummaryCard } from '@/components/attendance/MonthlySummaryCard';
import { AttendanceTrendsChart } from '@/components/attendance/AttendanceTrendsChart';
import { attendanceData, monthlyStats, chartData } from '@/components/attendance/attendanceUtils';

const Attendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
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
        <AttendanceCalendarCard 
          date={date}
          setDate={setDate}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
        />
        
        <AttendanceDetailCard 
          date={date}
          selectedDateAttendance={selectedDateAttendance}
        />
      </div>
      
      <MonthlySummaryCard monthlyStats={monthlyStats} />
      
      <AttendanceTrendsChart chartData={chartData} />
    </div>
  );
};

export default Attendance;
