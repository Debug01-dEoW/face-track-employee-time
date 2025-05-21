
document.addEventListener("DOMContentLoaded", function() {
    // Load departments and populate the dropdown
    loadDepartments();
    
    // Load employees when the page loads
    loadEmployees();
    
    // Set up search button
    document.getElementById('search-btn').addEventListener('click', function() {
        searchEmployees();
    });
    
    // Set up reset button
    document.getElementById('reset-btn').addEventListener('click', function() {
        document.getElementById('search-input').value = '';
        document.getElementById('department-filter').value = '';
        document.getElementById('face-data-filter').value = '';
        loadEmployees();
    });
    
    // Add employee button
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', function() {
            showAddEmployeeForm();
        });
    }
});

// Load departments for dropdown
function loadDepartments() {
    eel.get_departments()(function(departments) {
        const departmentSelect = document.getElementById('department-filter');
        if (!departmentSelect) return;
        
        // Clear current options
        departmentSelect.innerHTML = '<option value="">All Departments</option>';
        
        // Add departments
        departments.forEach(function(dept) {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            departmentSelect.appendChild(option);
        });
    });
}

// Load all employees
function loadEmployees() {
    // Show loading state
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '<div class="loading-indicator">Loading employees...</div>';
    
    eel.get_employees()(function(response) {
        if (response.success) {
            displayEmployees(response.employees);
        } else {
            employeesList.innerHTML = `<div class="error-message">Error: ${response.error || 'Could not load employees'}</div>`;
        }
    });
}

// Search employees with filters
function searchEmployees() {
    const searchTerm = document.getElementById('search-input').value;
    const departmentFilter = document.getElementById('department-filter').value;
    const faceDataFilter = document.getElementById('face-data-filter').value;
    
    // Show loading state
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '<div class="loading-indicator">Searching...</div>';
    
    eel.search_employees(searchTerm, departmentFilter, faceDataFilter)(function(response) {
        if (response.success) {
            displayEmployees(response.employees);
        } else {
            employeesList.innerHTML = `<div class="error-message">Error: ${response.error || 'Search failed'}</div>`;
        }
    });
}

// Display employees in the list
function displayEmployees(employees) {
    const employeesList = document.getElementById('employees-list');
    
    // Clear current list
    employeesList.innerHTML = '';
    
    if (employees.length === 0) {
        employeesList.innerHTML = '<div class="no-results">No employees found</div>';
        return;
    }
    
    // Create employee cards
    employees.forEach(function(employee) {
        const card = document.createElement('div');
        card.className = 'employee-card';
        
        const hasFaceData = employee.hasFaceData ? 
            '<span class="face-badge has-face">Face Data ✓</span>' : 
            '<span class="face-badge no-face">No Face Data</span>';
        
        card.innerHTML = `
            <div class="employee-name">${employee.name}</div>
            <div class="employee-details">
                <span class="department">${employee.department}</span>
                <span class="position">${employee.position}</span>
            </div>
            <div class="face-status">
                ${hasFaceData}
            </div>
            <div class="employee-actions">
                <button class="btn edit-btn" data-name="${employee.name}">Edit</button>
                <button class="btn ${employee.hasFaceData ? 'view-face-btn' : 'enroll-face-btn'}" 
                    data-name="${employee.name}">
                    ${employee.hasFaceData ? 'View Face Data' : 'Enroll Face'}
                </button>
            </div>
        `;
        
        // Add event listeners
        const enrollBtn = card.querySelector('.enroll-face-btn, .view-face-btn');
        if (enrollBtn) {
            enrollBtn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                if (employee.hasFaceData) {
                    alert(`View face data for ${name} (Feature coming soon)`);
                } else {
                    window.open(`/web/enroll_face.html?name=${encodeURIComponent(name)}`, '_blank');
                }
            });
        }
        
        employeesList.appendChild(card);
    });
}

// Show the add employee form
function showAddEmployeeForm() {
    // Implementation depends on your UI approach
    alert("Add employee form (Feature coming soon)");
}
