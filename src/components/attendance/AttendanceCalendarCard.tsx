
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';

interface AttendanceCalendarCardProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  modifiers: {
    present: (date: Date) => boolean;
    late: (date: Date) => boolean;
    absent: (date: Date) => boolean;
  };
  modifiersStyles: {
    present: { backgroundColor: string; color: string; fontWeight: string };
    late: { backgroundColor: string; color: string; fontWeight: string };
    absent: { backgroundColor: string; color: string; fontWeight: string };
  };
}

export const AttendanceCalendarCard = ({ date, setDate, modifiers, modifiersStyles }: AttendanceCalendarCardProps) => {
  return (
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
  );
};
