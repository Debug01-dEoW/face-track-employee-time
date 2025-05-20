
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { User } from 'lucide-react';

// Mock data
const employeesData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', position: 'Software Engineer', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', position: 'Marketing Manager', status: 'active' },
  { id: 3, name: 'Robert Johnson', email: 'robert@example.com', department: 'Engineering', position: 'Senior Developer', status: 'active' },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', department: 'HR', position: 'HR Specialist', status: 'active' },
  { id: 5, name: 'Michael Wilson', email: 'michael@example.com', department: 'Finance', position: 'Financial Analyst', status: 'inactive' },
  { id: 6, name: 'Sarah Brown', email: 'sarah@example.com', department: 'Design', position: 'UI/UX Designer', status: 'active' },
];

const Employees = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  const filteredEmployees = employeesData.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage employee records and attendance
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex-1">
            <CardTitle>Employee List</CardTitle>
            <CardDescription>Manage your organization's employees</CardDescription>
          </div>
          <Button className="bg-brand-600 hover:bg-brand-700">
            Add Employee
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-gray-50 p-3 font-medium text-sm">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Department</div>
              <div className="col-span-2">Position</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="divide-y">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <div key={employee.id} className="grid grid-cols-12 items-center p-3">
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <span>{employee.name}</span>
                    </div>
                    <div className="col-span-3">{employee.email}</div>
                    <div className="col-span-2">{employee.department}</div>
                    <div className="col-span-2">{employee.position}</div>
                    <div className="col-span-1">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No employees found matching your search
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;
