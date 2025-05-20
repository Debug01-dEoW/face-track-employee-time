import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { User, Edit, Trash2, Plus, Camera } from 'lucide-react';
import EmployeeFormDialog from '@/components/employees/EmployeeFormDialog';
import DeleteConfirmationDialog from '@/components/employees/DeleteConfirmationDialog';
import FaceEnrollment from '@/components/employees/FaceEnrollment';
import { toast } from 'sonner';
import { hasFaceData, saveFaceData, removeFaceData } from '@/services/FaceDatabase';

// Employee data type
interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  status: "active" | "inactive";
}

// Initial mock data
const initialEmployeesData: Employee[] = [
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
  const [employeesData, setEmployeesData] = useState<Employee[]>(initialEmployeesData);
  
  // Dialog states
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [faceEnrollmentOpen, setFaceEnrollmentOpen] = useState(false);
  
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

  // Add new employee
  const handleAddEmployee = (data: Omit<Employee, 'id'>) => {
    const newId = Math.max(...employeesData.map(e => e.id)) + 1;
    const newEmployee = { id: newId, ...data };
    setEmployeesData([...employeesData, newEmployee]);
  };

  // Edit employee
  const handleEditEmployee = (data: Omit<Employee, 'id'>) => {
    if (!selectedEmployee) return;
    
    const updatedEmployees = employeesData.map(employee => 
      employee.id === selectedEmployee.id ? { ...employee, ...data } : employee
    );
    
    setEmployeesData(updatedEmployees);
    setSelectedEmployee(null);
  };

  // Delete employee
  const handleDeleteEmployee = () => {
    if (!selectedEmployee) return;
    
    // Also remove face data if it exists
    removeFaceData(selectedEmployee.id);
    
    const updatedEmployees = employeesData.filter(
      employee => employee.id !== selectedEmployee.id
    );
    
    setEmployeesData(updatedEmployees);
    setSelectedEmployee(null);
  };

  // Open add employee dialog
  const openAddDialog = () => {
    setSelectedEmployee(null);
    setEmployeeFormOpen(true);
  };

  // Open edit employee dialog
  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeFormOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };
  
  // Open face enrollment dialog
  const openFaceEnrollment = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFaceEnrollmentOpen(true);
  };
  
  // Handle face enrollment completion
  const handleFaceEnrollmentComplete = (faceData: string) => {
    if (!selectedEmployee) return;
    
    // Save face data
    const success = saveFaceData({
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      department: selectedEmployee.department,
      position: selectedEmployee.position,
      faceData
    });
    
    if (success) {
      toast.success(`Face data for ${selectedEmployee.name} saved successfully`);
    } else {
      toast.error("Failed to save face data");
    }
    
    setFaceEnrollmentOpen(false);
  };

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
          <Button 
            className="bg-brand-600 hover:bg-brand-700"
            onClick={openAddDialog}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Employee
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
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            <div className="divide-y">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <div key={employee.id} className="grid grid-cols-12 items-center p-3">
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="flex items-center">
                        {employee.name}
                        {hasFaceData(employee.id) && (
                          <span className="ml-2 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                            Face Enrolled
                          </span>
                        )}
                      </span>
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
                    <div className="col-span-1 text-right flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openFaceEnrollment(employee)}
                        title="Enroll face"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(employee)}
                        title="Edit employee"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openDeleteDialog(employee)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete employee"
                      >
                        <Trash2 className="h-4 w-4" />
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

      {/* Employee Form Dialog */}
      <EmployeeFormDialog
        employee={selectedEmployee || undefined}
        open={employeeFormOpen}
        onOpenChange={setEmployeeFormOpen}
        onSubmit={selectedEmployee ? handleEditEmployee : handleAddEmployee}
      />

      {/* Delete Confirmation Dialog */}
      {selectedEmployee && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteEmployee}
          employeeName={selectedEmployee.name}
          employeeId={selectedEmployee.id}
        />
      )}
      
      {/* Face Enrollment Dialog */}
      {selectedEmployee && (
        <div className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center ${faceEnrollmentOpen ? 'block' : 'hidden'}`}>
          <div className="max-w-2xl w-full p-4">
            <FaceEnrollment
              employeeId={selectedEmployee.id}
              employeeName={selectedEmployee.name}
              onComplete={handleFaceEnrollmentComplete}
              onCancel={() => setFaceEnrollmentOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
