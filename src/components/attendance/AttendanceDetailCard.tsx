
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface Attendance {
  date: Date;
  status: string;
  checkIn: string;
  checkOut: string;
}

interface AttendanceDetailCardProps {
  date: Date | undefined;
  selectedDateAttendance: Attendance | undefined;
}

export const AttendanceDetailCard = ({ date, selectedDateAttendance }: AttendanceDetailCardProps) => {
  return (
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
  );
};
