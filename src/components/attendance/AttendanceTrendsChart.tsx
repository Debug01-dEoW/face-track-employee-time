
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ChartDataItem {
  name: string;
  onTime: number;
  late: number;
  absent: number;
}

interface AttendanceTrendsChartProps {
  chartData: ChartDataItem[];
}

export const AttendanceTrendsChart = ({ chartData }: AttendanceTrendsChartProps) => {
  return (
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
  );
};
