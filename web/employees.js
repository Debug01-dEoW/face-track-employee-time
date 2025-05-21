document.addEventListener("DOMContentLoaded", function() {
    // Load and display employees
    loadEmployees();
    
    // Setup modal functionality
    setupModal();
    
    // Setup form submission
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Setup face enrollment
    setupFaceEnrollment();
    
    // Setup search and filters
    setupSearchAndFilters();
});

// Global variables for face enrollment
let enrollmentActive = false;
let capturedSamples = 0;
let maxSamples = 10;
let allEmployees = []; // Store all employees for filtering

// Setup search and filters
function setupSearchAndFilters() {
    const searchInput = document.getElementById('employee-search');
    const searchBtn = document.getElementById('search-btn');
    const departmentFilter = document.getElementById('department-filter');
    const faceDataFilter = document.getElementById('face-data-filter');
    const resetBtn = document.getElementById('reset-filters');
    
    // Search on input
    searchInput.addEventListener('input', applyFilters);
    
    // Search on button click
    searchBtn.addEventListener('click', applyFilters);
    
    // Filter on select change
    departmentFilter.addEventListener('change', applyFilters);
    faceDataFilter.addEventListener('change', applyFilters);
    
    // Reset filters
    resetBtn.addEventListener('click', function() {
        searchInput.value = '';
        departmentFilter.value = '';
        faceDataFilter.value = '';
        applyFilters();
    });
}

// Apply all filters and search
function applyFilters() {
    const searchTerm = document.getElementById('employee-search').value.toLowerCase();
    const departmentValue = document.getElementById('department-filter').value;
    const faceDataValue = document.getElementById('face-data-filter').value;
    
    const filteredEmployees = allEmployees.filter(employee => {
        // Search term filter
        const nameMatch = employee.name.toLowerCase().includes(searchTerm);
        const idMatch = employee.id.toLowerCase().includes(searchTerm);
        const departmentMatch = (employee.department || '').toLowerCase().includes(searchTerm);
        const positionMatch = (employee.position || '').toLowerCase().includes(searchTerm);
        const searchMatch = nameMatch || idMatch || departmentMatch || positionMatch;
        
        // Department filter
        const deptMatch = !departmentValue || (employee.department === departmentValue);
        
        // Face data filter
        let faceMatch = true;
        if (faceDataValue === 'yes') {
            faceMatch = (employee.samples && employee.samples > 0);
        } else if (faceDataValue === 'no') {
            faceMatch = (!employee.samples || employee.samples <= 0);
        }
        
        return searchMatch && deptMatch && faceMatch;
    });
    
    displayEmployees(filteredEmployees);
    
    // Show/hide no results message
    const noResults = document.getElementById('no-results');
    if (filteredEmployees.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
    }
}

// Display employees in table
function displayEmployees(employees) {
    const employeesTable = document.getElementById('employees-table');
    if (!employeesTable) return;
    
    // Clear existing table rows
    employeesTable.innerHTML = '';
    
    // Populate table
    employees.forEach(employee => {
        const row = document.createElement('tr');
        
        // Check how many face samples are stored
        let faceSamples = employee.samples || 0;
        
        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${employee.department || ''}</td>
            <td>${employee.position || ''}</td>
            <td>
                ${faceSamples > 0 ? 
                    `<span class="badge success">${faceSamples} samples</span>` : 
                    '<span class="badge warning">No face data</span>'}
            </td>
            <td>
                <div class="actions">
                    <button class="btn-edit" data-id="${employee.id}">Edit</button>
                    <button class="btn-delete" data-id="${employee.id}">Delete</button>
                    <button class="btn-enroll" data-id="${employee.id}" data-name="${employee.name}">
                        ${faceSamples > 0 ? 'Re-enroll Face' : 'Enroll Face'}
                    </button>
                </div>
            </td>
        `;
        
        employeesTable.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', handleEditClick);
    });
    
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', handleDeleteClick);
    });
    
    document.querySelectorAll('.btn-enroll').forEach(button => {
        button.addEventListener('click', handleEnrollClick);
    });
}

// Load employees from storage
function loadEmployees() {
    let employees = [];
    
    // Try to load from localStorage
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
        employees = JSON.parse(storedEmployees);
    } else {
        // If no employees in storage, use some sample data
        employees = [
            { id: '1001', name: 'John Doe', department: 'IT', position: 'Developer', samples: 5 },
            { id: '1002', name: 'Jane Smith', department: 'HR', position: 'Manager', samples: 0 },
        ];
        localStorage.setItem('employees', JSON.stringify(employees));
    }
    
    // Store all employees in global variable
    allEmployees = employees;
    
    // Display employees
    displayEmployees(employees);
    
    // Populate department filter with unique departments
    populateDepartmentFilter(employees);
}

// Populate department filter with unique departments
function populateDepartmentFilter(employees) {
    const departmentFilter = document.getElementById('department-filter');
    if (!departmentFilter) return;
    
    // Clear existing options except the first one
    while (departmentFilter.options.length > 1) {
        departmentFilter.remove(1);
    }
    
    // Get unique departments
    const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    
    // Add options
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        departmentFilter.appendChild(option);
    });
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('employee-modal');
    const enrollmentModal = document.getElementById('face-enrollment-modal');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    
    // When the user clicks the "Add Employee" button, open the modal
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', function() {
            // Reset form
            const form = document.getElementById('employee-form');
            if (form) form.reset();
            
            // Clear form ID (indicates this is a new employee, not an edit)
            form.dataset.employeeId = '';
            
            // Update modal title to "Add New Employee"
            document.querySelector('#employee-modal h2').textContent = 'Add New Employee';
            
            // Hide face capture container for new employees
            const faceCaptureContainer = document.getElementById('face-capture-container');
            if (faceCaptureContainer) faceCaptureContainer.style.display = 'none';
            
            // Show modal
            modal.style.display = 'block';
        });
    }
    
    // When the user clicks on close button, close the modal
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            if (enrollmentModal) enrollmentModal.style.display = 'none';
            
            // Stop any active video
            stopVideo();
        });
    });
    
    // When the user clicks anywhere outside of the modal, close it
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            stopVideo();
        }
        if (enrollmentModal && event.target == enrollmentModal) {
            enrollmentModal.style.display = 'none';
            stopVideo('enrollment-video');
        }
    });
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const form = event.target;
    const empId = form.elements['emp-id'].value;
    const empName = form.elements['emp-name'].value;
    const empDepartment = form.elements['emp-department'].value;
    const empPosition = form.elements['emp-position'].value;
    
    // Validate form
    if (!empId || !empName) {
        alert('Employee ID and Name are required');
        return;
    }
    
    // Get existing employees
    let employees = [];
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
        employees = JSON.parse(storedEmployees);
    }
    
    // Check if this is an edit (form has employeeId data attribute)
    const editId = form.dataset.employeeId;
    
    if (editId) {
        // Update existing employee
        const index = employees.findIndex(emp => emp.id === editId);
        if (index !== -1) {
            // Preserve face samples count if it exists
            const existingSamples = employees[index].samples || 0;
            
            employees[index] = {
                id: empId,
                name: empName,
                department: empDepartment,
                position: empPosition,
                samples: existingSamples
            };
        }
    } else {
        // Check if ID already exists
        if (employees.some(emp => emp.id === empId)) {
            alert('Employee ID already exists');
            return;
        }
        
        // Add new employee
        employees.push({
            id: empId,
            name: empName,
            department: empDepartment,
            position: empPosition,
            samples: 0
        });
    }
    
    // Save to localStorage
    localStorage.setItem('employees', JSON.stringify(employees));
    
    // Close modal and refresh employee list
    document.getElementById('employee-modal').style.display = 'none';
    
    // Update global allEmployees variable and redisplay
    allEmployees = employees;
    displayEmployees(employees);
    
    // Re-populate department filter with updated departments
    populateDepartmentFilter(employees);
}

// Handle edit button click
function handleEditClick(event) {
    const empId = event.target.dataset.id;
    
    // Get employee data
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const employee = employees.find(emp => emp.id === empId);
    
    if (employee) {
        // Fill form with employee data
        const form = document.getElementById('employee-form');
        form.elements['emp-id'].value = employee.id;
        form.elements['emp-name'].value = employee.name;
        form.elements['emp-department'].value = employee.department || '';
        form.elements['emp-position'].value = employee.position || '';
        
        // Store the employee ID in the form data attribute
        form.dataset.employeeId = employee.id;
        
        // Update modal title
        document.querySelector('#employee-modal h2').textContent = 'Edit Employee';
        
        // Show face capture container for existing employees
        const faceCaptureContainer = document.getElementById('face-capture-container');
        if (faceCaptureContainer) {
            faceCaptureContainer.style.display = 'block';
        }
        
        // Show modal
        document.getElementById('employee-modal').style.display = 'block';
    }
}

// Handle delete button click
function handleDeleteClick(event) {
    const empId = event.target.dataset.id;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this employee?')) {
        return;
    }
    
    // Get employees from storage
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    
    // Remove the employee
    const updatedEmployees = employees.filter(emp => emp.id !== empId);
    
    // Save updated list
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    
    // Refresh employee list
    loadEmployees();
}

// Handle face enrollment button click
function handleEnrollClick(event) {
    const empId = event.target.dataset.id;
    const empName = event.target.dataset.name;
    
    // Prepare enrollment modal
    const enrollmentModal = document.getElementById('face-enrollment-modal');
    const employeeNameElem = document.getElementById('enrollment-employee-name');
    
    if (enrollmentModal && employeeNameElem) {
        // Set employee name in modal
        employeeNameElem.textContent = `Employee: ${empName}`;
        
        // Store employee ID in modal
        enrollmentModal.dataset.employeeId = empId;
        
        // Show modal
        enrollmentModal.style.display = 'block';
        
        // Reset enrollment state
        capturedSamples = 0;
        updateEnrollmentProgress(0);
        
        // Reset instructions and directions
        document.getElementById('enrollment-instructions').textContent = "Click \"Start Enrollment\" to begin face capture";
        document.getElementById('enrollment-direction').textContent = "";
        
        // Show start button, hide stop button
        document.getElementById('start-enrollment').style.display = 'block';
        document.getElementById('stop-enrollment').style.display = 'none';
    }
}

// Setup face enrollment
function setupFaceEnrollment() {
    const startEnrollmentBtn = document.getElementById('start-enrollment');
    const stopEnrollmentBtn = document.getElementById('stop-enrollment');
    
    if (startEnrollmentBtn) {
        startEnrollmentBtn.addEventListener('click', startFaceEnrollment);
    }
    
    if (stopEnrollmentBtn) {
        stopEnrollmentBtn.addEventListener('click', stopFaceEnrollment);
    }
}

// Start face enrollment
async function startFaceEnrollment() {
    const enrollmentModal = document.getElementById('face-enrollment-modal');
    const employeeId = enrollmentModal.dataset.employeeId;
    const employeeName = document.getElementById('enrollment-employee-name').textContent.replace('Employee: ', '');
    
    // Initialize enrollment state
    enrollmentActive = true;
    capturedSamples = 0;
    maxSamples = 10;
    
    // Update UI
    document.getElementById('start-enrollment').style.display = 'none';
    document.getElementById('stop-enrollment').style.display = 'block';
    document.getElementById('enrollment-instructions').textContent = "Keep your face centered in the frame. Multiple poses will be captured automatically.";
    
    // Start the face enrollment process through Eel
    const response = await eel.eel_start_face_enrollment(employeeName)();
    
    if (response.success) {
        // Start camera
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            const video = document.getElementById('enrollment-video');
            video.srcObject = stream;
            
            // Play the video
            video.onloadedmetadata = () => {
                video.play();
                
                // Start capturing faces at intervals
                captureInterval = setInterval(() => {
                    if (capturedSamples >= maxSamples || !enrollmentActive) {
                        clearInterval(captureInterval);
                        if (enrollmentActive) {
                            finalizeFaceEnrollment(employeeName);
                        }
                        return;
                    }
                    
                    captureFaceSample();
                }, 1000); // Capture every second
            };
        } catch (error) {
            console.error('Error starting camera:', error);
            alert('Could not access camera. Please check permissions.');
            stopFaceEnrollment();
        }
    } else {
        alert('Error starting face enrollment: ' + (response.error || 'Unknown error'));
        stopFaceEnrollment();
    }
}

// Capture a face sample
function captureFaceSample() {
    const video = document.getElementById('enrollment-video');
    const canvas = document.getElementById('enrollment-canvas');
    
    if (!video || !canvas) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Set directions for different poses
    const directions = [
        "Look straight at the camera",
        "Turn slightly to the left",
        "Turn slightly to the right",
        "Tilt your head up slightly",
        "Tilt your head down slightly",
        "Normal position",
        "Smile",
        "Serious expression",
        "Slightly different angle",
        "Final pose - straight at camera"
    ];
    
    // Update direction text
    document.getElementById('enrollment-direction').textContent = directions[capturedSamples % directions.length];
    
    // Send to Python for processing
    eel.eel_save_face_snapshot(imageData, capturedSamples)(function(response) {
        if (response.success) {
            // Increment sample count
            capturedSamples++;
            
            // Update progress
            const progress = (capturedSamples / maxSamples) * 100;
            updateEnrollmentProgress(progress);
            
            if (capturedSamples >= maxSamples) {
                // Finalize enrollment when all samples are collected
                finalizeFaceEnrollment();
            }
        } else {
            console.error("Failed to save face sample:", response.error);
            // Don't increment capturedSamples on failure
        }
    });
}

// Update enrollment progress UI
function updateEnrollmentProgress(percent) {
    document.getElementById('enrollment-progress-percent').textContent = `${Math.round(percent)}%`;
    document.getElementById('enrollment-progress-bar').style.width = `${percent}%`;
}

// Finalize face enrollment process
async function finalizeFaceEnrollment() {
    // Stop capturing
    enrollmentActive = false;
    clearInterval(captureInterval);
    
    // Get employee information
    const enrollmentModal = document.getElementById('face-enrollment-modal');
    const employeeId = enrollmentModal.dataset.employeeId;
    const employeeName = document.getElementById('enrollment-employee-name').textContent.replace('Employee: ', '');
    
    // Get employee details
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const employee = employees.find(emp => emp.id === employeeId);
    
    // Update instructions
    document.getElementById('enrollment-instructions').textContent = "Processing face samples...";
    document.getElementById('enrollment-direction').textContent = "Please wait";
    
    // Process the face samples
    const result = await eel.eel_process_face_samples(employeeName)();
    
    if (result.success) {
        // Update employee record with sample count
        if (employee) {
            employee.samples = result.samples;
            localStorage.setItem('employees', JSON.stringify(employees));
        }
        
        // Update UI
        document.getElementById('enrollment-instructions').textContent = "Face enrollment successful!";
        document.getElementById('enrollment-direction').textContent = `${result.samples} face samples saved`;
        
        // Auto-close after a delay
        setTimeout(() => {
            enrollmentModal.style.display = 'none';
            stopVideo('enrollment-video');
            loadEmployees(); // Refresh employee list to show updated sample count
        }, 2000);
    } else {
        // Show error
        document.getElementById('enrollment-instructions').textContent = "Face enrollment failed";
        document.getElementById('enrollment-direction').textContent = result.error || "Unknown error";
        
        // Show restart button
        document.getElementById('start-enrollment').style.display = 'block';
        document.getElementById('stop-enrollment').style.display = 'none';
    }
}

// Stop face enrollment
function stopFaceEnrollment() {
    enrollmentActive = false;
    clearInterval(captureInterval);
    
    stopVideo('enrollment-video');
    
    // Update UI
    document.getElementById('start-enrollment').style.display = 'block';
    document.getElementById('stop-enrollment').style.display = 'none';
    document.getElementById('enrollment-instructions').textContent = "Enrollment stopped. Click \"Start Enrollment\" to try again.";
    document.getElementById('enrollment-direction').textContent = "";
}

// Stop video stream
function stopVideo(videoId = 'video') {
    const video = document.getElementById(videoId);
    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}
