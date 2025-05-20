
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Search } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock employees data
const employees = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
  { id: "3", name: "Robert Johnson", email: "robert@example.com" },
  { id: "4", name: "Emily Davis", email: "emily@example.com" },
];

const formSchema = z.object({
  employeeId: z.string({
    required_error: "Please select an employee",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  status: z.string({
    required_error: "Please select attendance status",
  }),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

const ManualAttendance = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      checkInTime: "09:00",
      checkOutTime: "17:00",
    },
  });

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // In a real app, this would send to an API
    console.log(values);
    
    // Add to recent entries
    const entry = {
      id: Date.now().toString(),
      employeeName: employees.find(e => e.id === values.employeeId)?.name,
      date: format(values.date, "MMM dd, yyyy"),
      status: values.status,
      checkIn: values.checkInTime,
      checkOut: values.checkOutTime,
      timestamp: new Date(),
    };
    
    setRecentEntries([entry, ...recentEntries.slice(0, 4)]);
    
    // Show success message
    toast({
      title: "Attendance recorded",
      description: `Successfully recorded ${entry.status} for ${entry.employeeName} on ${entry.date}`,
    });
    
    // Reset form
    form.reset({
      ...values,
      employeeId: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manual Attendance Entry</h1>
        <p className="text-muted-foreground">
          Record attendance manually for employees
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record Attendance</CardTitle>
            <CardDescription>
              Use this form to manually register attendance for an employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="mb-4">
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredEmployees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} ({employee.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendance Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="half-day">Half Day</SelectItem>
                          <SelectItem value="leave">Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("status") !== "absent" && form.watch("status") !== "leave" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="checkInTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-in Time</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-gray-500" />
                              <Input
                                type="time"
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="checkOutTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-out Time</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-gray-500" />
                              <Input
                                type="time"
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full">
                  Record Attendance
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>
              The most recent attendance records you've added
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEntries.length > 0 ? (
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="mr-4">
                      <span className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${
                        entry.status === 'present' ? 'bg-green-500' : 
                        entry.status === 'late' ? 'bg-amber-500' : 
                        entry.status === 'half-day' ? 'bg-blue-500' : 
                        entry.status === 'leave' ? 'bg-purple-500' : 'bg-red-500'
                      }`}>
                        {entry.employeeName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entry.employeeName}</p>
                      <p className="text-sm text-gray-500">
                        {entry.date} • 
                        <span className={`ml-1 ${
                          entry.status === 'present' ? 'text-green-600' : 
                          entry.status === 'late' ? 'text-amber-600' : 
                          entry.status === 'half-day' ? 'text-blue-600' : 
                          entry.status === 'leave' ? 'text-purple-600' : 'text-red-600'
                        }`}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    {entry.status !== 'absent' && entry.status !== 'leave' && (
                      <div className="text-right text-sm text-gray-500">
                        <div>{entry.checkIn} - {entry.checkOut}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No recent entries yet. Records will appear here after you add them.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManualAttendance;
