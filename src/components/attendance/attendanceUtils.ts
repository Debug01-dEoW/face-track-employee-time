
// Mock data for attendance
export const attendanceData = [
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
export const monthlyStats = {
  present: 10,
  late: 2,
  absent: 1,
  totalWorkingDays: 13
};

// Chart data
export const chartData = [
  { name: 'Week 1', onTime: 4, late: 1, absent: 0 },
  { name: 'Week 2', onTime: 4, late: 0, absent: 1 },
  { name: 'Week 3', onTime: 2, late: 1, absent: 0 },
  { name: 'Week 4', onTime: 0, late: 0, absent: 0 },
];
