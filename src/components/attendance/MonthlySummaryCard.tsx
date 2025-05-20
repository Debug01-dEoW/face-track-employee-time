
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlySummaryProps {
  monthlyStats: {
    present: number;
    late: number;
    absent: number;
    totalWorkingDays: number;
  };
}

export const MonthlySummaryCard = ({ monthlyStats }: MonthlySummaryProps) => {
  return (
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
  );
};
