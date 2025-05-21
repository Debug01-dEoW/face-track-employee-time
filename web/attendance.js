
document.addEventListener("DOMContentLoaded", function() {
  // Load initial data
  loadAttendanceData();
  loadEmployeeOptions();
  
  // Set up filter button
  const filterBtn = document.getElementById('filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', function() {
      loadAttendanceData();
    });
  }
});

// Load attendance data
function loadAttendanceData() {
  eel.get_attendance_records()(function(records) {
    const attendanceTable = document.getElementById('attendance-table');
    if (!attendanceTable) return;
    
    attendanceTable.innerHTML = '';
    
    // Apply filters if they exist
    const dateFilter = document.getElementById('date-filter');
    const employeeFilter = document.getElementById('employee-filter');
    
    let filteredRecords = records;
    
    // Filter by date if selected
    if (dateFilter && dateFilter.value) {
      const filterDate = dateFilter.value; // YYYY-MM-DD
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = record.timestamp.split('T')[0];
        return recordDate === filterDate;
      });
    }
    
    // Filter by employee if selected
    if (employeeFilter && employeeFilter.value) {
      filteredRecords = filteredRecords.filter(record => {
        return record.employeeId === employeeFilter.value;
      });
    }
    
    // Sort records by timestamp (newest first)
    filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (filteredRecords.length === 0) {
      const row = attendanceTable.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 3;
      cell.textContent = "No attendance records found";
      cell.style.textAlign = "center";
      cell.style.padding = "20px";
      return;
    }
    
    filteredRecords.forEach(record => {
      const row = attendanceTable.insertRow();
      
      const nameCell = row.insertCell(0);
      const timeCell = row.insertCell(1);
      const typeCell = row.insertCell(2);
      
      nameCell.textContent = record.employeeName;
      timeCell.textContent = formatDateTime(record.timestamp);
      
      // Add styling based on check-in/check-out
      if (record.type === "IN") {
        typeCell.innerHTML = '<span class="badge success">IN</span>';
      } else {
        typeCell.innerHTML = '<span class="badge warning">OUT</span>';
      }
    });
  });
}

// Load employee options for filter dropdown
function loadEmployeeOptions() {
  const employeeFilter = document.getElementById('employee-filter');
  if (!employeeFilter) return;
  
  // First option already exists (All Employees)
  
  eel.eel_get_employees()(function(employees) {
    employees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = employee.name;
      employeeFilter.appendChild(option);
    });
  });
}

// Expose additional functions for Eel if they don't already exist
if (typeof eel !== 'undefined' && !eel.get_attendance_records) {
  // Add missing function to the mock Eel object
  eel.get_attendance_records = function() {
    return function(callback) {
      eel.get_attendance_records()(callback);
    };
  };
}
