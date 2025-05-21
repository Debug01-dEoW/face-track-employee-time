
document.addEventListener("DOMContentLoaded", function() {
    // Initialize theme toggle
    initThemeToggle();
});

function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            
            // Update button text
            if (document.body.classList.contains('dark-theme')) {
                themeToggleBtn.textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            } else {
                themeToggleBtn.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            }
        });
    }
    
    // Apply saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggleBtn) {
            themeToggleBtn.textContent = '☀️';
        }
    }
}

// Format a date and time in a user-friendly way
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const now = new Date();
    
    // Format date component
    let dateStr;
    if (date.toDateString() === now.toDateString()) {
        dateStr = 'Today';
    } else if (date.toDateString() === new Date(now - 86400000).toDateString()) {
        dateStr = 'Yesterday';
    } else {
        dateStr = date.toLocaleDateString();
    }
    
    // Format time component
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${dateStr} at ${timeStr}`;
}

// Dashboard stats loading
function loadDashboardStats() {
    // Get the dashboard elements
    const totalEmployees = document.getElementById('total-employees');
    const todayCheckins = document.getElementById('today-checkins');
    const totalAttendance = document.getElementById('total-attendance');
    const recentActivityTable = document.getElementById('recent-activity-table');
    
    // Bail out if not on dashboard page
    if (!totalEmployees && !todayCheckins && !totalAttendance && !recentActivityTable) {
        return;
    }
    
    // Employees count
    eel.eel_get_employees()(function(employees) {
        if (totalEmployees) {
            totalEmployees.textContent = employees.length;
        }
    });
    
    // Attendance records
    eel.get_attendance_records()(function(records) {
        if (totalAttendance) {
            totalAttendance.textContent = records.length;
        }
        
        // Count today's check-ins
        if (todayCheckins) {
            const today = new Date().toISOString().split('T')[0];
            const todaysRecords = records.filter(record => {
                return record.timestamp.split('T')[0] === today;
            });
            
            todayCheckins.textContent = todaysRecords.length;
        }
        
        // Update recent activity
        if (recentActivityTable) {
            recentActivityTable.innerHTML = '';
            
            // Sort records by timestamp (newest first)
            records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Get most recent 5 records
            const recentRecords = records.slice(0, 5);
            
            if (recentRecords.length === 0) {
                const row = recentActivityTable.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 3;
                cell.textContent = "No activity recorded yet";
                cell.style.textAlign = "center";
                cell.style.padding = "10px";
                return;
            }
            
            recentRecords.forEach(record => {
                const row = recentActivityTable.insertRow();
                
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
        }
    });
    
    // Also check if we have recent activity in local storage from face recognition
    // This is for real-time updates before they are saved to the backend
    const recentLocalActivity = JSON.parse(localStorage.getItem('recent_activity') || '[]');
    if (recentLocalActivity.length > 0 && recentActivityTable) {
        // Clear existing content
        recentActivityTable.innerHTML = '';
        
        // Add the recent local activity
        recentLocalActivity.slice(0, 5).forEach(activity => {
            const row = recentActivityTable.insertRow(0); // Insert at the top
            
            const nameCell = row.insertCell(0);
            const timeCell = row.insertCell(1);
            const typeCell = row.insertCell(2);
            
            nameCell.textContent = activity.employeeName;
            timeCell.textContent = formatDateTime(activity.timestamp);
            
            // Add styling based on check-in/check-out
            if (activity.type === "IN") {
                typeCell.innerHTML = '<span class="badge success">IN</span>';
            } else {
                typeCell.innerHTML = '<span class="badge warning">OUT</span>';
            }
        });
    }
}

// Utility function to check if a file exists
async function fileExists(filePath) {
    try {
        const response = await fetch(filePath, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Check if haarcascade file exists and download if needed
async function checkRequiredFiles() {
    const cascadeFile = 'user data/haarcascade_frontalface_default.xml';
    const exists = await fileExists(cascadeFile);
    
    if (!exists) {
        // For a real application, you would download it here
        console.warn('Face detection model file is missing: ' + cascadeFile);
        
        // Add an alert to the page if on check-in or enrollment page
        if (window.location.pathname.includes('checkin.html') || 
            window.location.pathname.includes('employees.html')) {
            const alert = document.createElement('div');
            alert.className = 'alert warning';
            alert.innerHTML = `
                <p><strong>Warning:</strong> The face detection model file is missing. 
                Please download <code>haarcascade_frontalface_default.xml</code> from 
                <a href="https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml" target="_blank">OpenCV GitHub</a> 
                and place it in the 'user data' directory.</p>
            `;
            
            // Insert at top of main content
            const main = document.querySelector('main');
            if (main && main.firstChild) {
                main.insertBefore(alert, main.firstChild);
            }
        }
    }
}

// Initialize after all other resources are loaded
window.addEventListener('load', function() {
    checkRequiredFiles();
});
