
// Theme toggle functionality
document.addEventListener("DOMContentLoaded", function() {
  // Check for saved theme preference or respect OS preference
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  // Apply theme
  if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-toggle-btn').textContent = '☀️';
  }
  
  // Set up theme toggle button
  document.getElementById('theme-toggle-btn').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    this.textContent = isDarkMode ? '☀️' : '🌙';
  });
});

// Format date and time
function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

// Format date only
function formatDate(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Count today's check-ins
function countTodayCheckins(attendanceRecords) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  return attendanceRecords.filter(record => {
    const recordDate = record.timestamp.split('T')[0];
    return recordDate === today;
  }).length;
}

// Dashboard stats loader
function loadDashboardStats() {
  // Only run on dashboard page
  if (!document.getElementById('total-employees')) {
    return;
  }
  
  // Load employee count
  eel.eel_get_employees()(function(employees) {
    document.getElementById('total-employees').textContent = employees.length;
  });
  
  // Load attendance records
  eel.get_attendance_records()(function(records) {
    document.getElementById('total-attendance').textContent = records.length;
    document.getElementById('today-checkins').textContent = countTodayCheckins(records);
    
    // Update recent activity
    const recentActivityTable = document.getElementById('recent-activity-table');
    if (recentActivityTable) {
      recentActivityTable.innerHTML = '';
      
      // Sort records by timestamp (newest first) and take top 5
      const recentRecords = records
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
      
      if (recentRecords.length === 0) {
        const row = recentActivityTable.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 3;
        cell.textContent = "No recent activity";
        cell.style.textAlign = "center";
        cell.style.padding = "20px";
      } else {
        recentRecords.forEach(record => {
          const row = recentActivityTable.insertRow();
          const nameCell = row.insertCell(0);
          const timeCell = row.insertCell(1);
          const typeCell = row.insertCell(2);
          
          nameCell.textContent = record.employeeName;
          timeCell.textContent = formatDateTime(record.timestamp);
          typeCell.textContent = record.type;
          
          // Add styling based on check-in/check-out
          if (record.type === "IN") {
            typeCell.innerHTML = '<span class="badge success">IN</span>';
          } else {
            typeCell.innerHTML = '<span class="badge warning">OUT</span>';
          }
        });
      }
    }
  });
}

// Expose Python function for JavaScript
// This will be set up by Eel in the Python backend
if (typeof eel === 'undefined') {
  // Mock implementation for testing without Eel
  console.warn("Eel not found, using mock implementation");
  
  window.eel = {
    eel_get_employees: function() {
      return function(callback) {
        setTimeout(() => callback([
          { id: "1", name: "John Doe", department: "IT", position: "Developer", samples: 20 },
          { id: "2", name: "Jane Smith", department: "HR", position: "Manager", samples: 15 }
        ]), 100);
      };
    },
    get_attendance_records: function() {
      return function(callback) {
        setTimeout(() => callback([
          { id: "1", employeeId: "1", employeeName: "John Doe", timestamp: new Date().toISOString(), type: "IN" }
        ]), 100);
      };
    },
    eel_enroll_face: function() {
      return function(callback) {
        setTimeout(() => callback({ success: true, samples: 20 }), 1000);
      };
    },
    eel_recognize_face: function() {
      return function(callback) {
        setTimeout(() => callback({ 
          success: true, 
          person: { id: "1", name: "John Doe", confidence: 0.92 } 
        }), 1000);
      };
    },
  };
}
