
document.addEventListener("DOMContentLoaded", function() {
  // Load employees when page loads
  loadEmployees();
  
  // Initialize modal functionality
  const modal = document.getElementById('employee-modal');
  const faceEnrollmentModal = document.getElementById('face-enrollment-modal');
  const addEmployeeBtn = document.getElementById('add-employee-btn');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  
  if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', function() {
      openModal();
    });
  }
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      closeModal();
      closeFaceEnrollmentModal();
    });
  });
  
  // Close modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
    if (event.target === faceEnrollmentModal) {
      closeFaceEnrollmentModal();
    }
  });
  
  // Set up employee form submission
  const employeeForm = document.getElementById('employee-form');
  if (employeeForm) {
    employeeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveEmployee();
    });
  }
  
  // Set up face capture functionality
  const startCaptureBtn = document.getElementById('start-capture');
  const resetCaptureBtn = document.getElementById('reset-capture');
  
  if (startCaptureBtn) {
    startCaptureBtn.addEventListener('click', function() {
      startFaceCapture();
    });
  }
  
  if (resetCaptureBtn) {
    resetCaptureBtn.addEventListener('click', function() {
      resetFaceCapture();
    });
  }
  
  // Set up face enrollment functionality
  const startEnrollmentBtn = document.getElementById('start-enrollment');
  const stopEnrollmentBtn = document.getElementById('stop-enrollment');
  
  if (startEnrollmentBtn) {
    startEnrollmentBtn.addEventListener('click', startFaceEnrollment);
  }
  
  if (stopEnrollmentBtn) {
    stopEnrollmentBtn.addEventListener('click', stopFaceEnrollment);
  }
});

// Global variables for face capture
let isCapturing = false;
let faceSamples = [];
let captureProgress = 0;
let currentDirectionIndex = 0;
let videoStream = null;
let captureInterval = null;

// Global variables for face enrollment
let enrollmentStream = null;
let enrollmentActive = false;
let enrollmentDirections = [
  "center", "slightly right", "right", 
  "slightly left", "left", 
  "slightly up", "up", 
  "slightly down", "down",
  "right up", "right down", 
  "left up", "left down",
  "center", // Center shot for better accuracy
  "slight smile", "big smile", 
  "neutral", "slight frown", "eyebrows raised"
];
let enrollmentProgress = 0;
let currentDirection = "";
let enrollmentIndex = 0;
let enrollmentEmployee = null;

// Load employees
function loadEmployees() {
  eel.eel_get_employees()(function(employees) {
    const employeesTable = document.getElementById('employees-table');
    if (!employeesTable) return;
    
    employeesTable.innerHTML = '';
    
    if (employees.length === 0) {
      const row = employeesTable.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 6;
      cell.textContent = "No employees registered";
      cell.style.textAlign = "center";
      cell.style.padding = "20px";
      return;
    }
    
    employees.forEach(employee => {
      const row = employeesTable.insertRow();
      
      const idCell = row.insertCell(0);
      const nameCell = row.insertCell(1);
      const deptCell = row.insertCell(2);
      const posCell = row.insertCell(3);
      const samplesCell = row.insertCell(4);
      const actionsCell = row.insertCell(5);
      
      idCell.textContent = employee.id;
      nameCell.textContent = employee.name;
      deptCell.textContent = employee.department || '-';
      posCell.textContent = employee.position || '-';
      samplesCell.textContent = employee.samples || 0;
      
      actionsCell.innerHTML = `
        <button class="secondary-btn face-btn" data-id="${employee.id}" data-name="${employee.name}" data-dept="${employee.department || ''}" data-pos="${employee.position || ''}">Enroll Face</button>
        <button class="danger-btn delete-btn" data-id="${employee.id}">Delete</button>
      `;
      
      // Set up delete button
      const deleteBtn = actionsCell.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', function() {
        if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
          deleteEmployee(employee.id);
        }
      });
      
      // Set up face enrollment button
      const faceBtn = actionsCell.querySelector('.face-btn');
      faceBtn.addEventListener('click', function() {
        openFaceEnrollmentModal(employee.id, employee.name, employee.department, employee.position);
      });
    });
  });
}

// Delete employee
function deleteEmployee(employeeId) {
  // Call Eel function
  eel.delete_employee(employeeId)(function(response) {
    if (response) {
      alert('Employee deleted successfully');
      loadEmployees(); // Refresh list
    } else {
      alert('Failed to delete employee');
    }
  });
}

// Open modal
function openModal() {
  document.getElementById('employee-modal').style.display = 'block';
  
  // Reset form
  document.getElementById('employee-form').reset();
  
  // Reset face capture
  resetFaceCapture();
}

// Close modal
function closeModal() {
  document.getElementById('employee-modal').style.display = 'none';
  
  // Stop camera if it's running
  if (videoStream) {
    stopCamera();
  }
}

// Open face enrollment modal
function openFaceEnrollmentModal(employeeId, name, department, position) {
  const modal = document.getElementById('face-enrollment-modal');
  if (!modal) return;
  
  // Store employee data
  enrollmentEmployee = {
    id: employeeId,
    name: name,
    department: department,
    position: position
  };
  
  // Update UI
  const nameElement = document.getElementById('enrollment-employee-name');
  if (nameElement) {
    nameElement.textContent = name;
  }
  
  // Reset progress
  enrollmentProgress = 0;
  enrollmentIndex = 0;
  const progressBar = document.getElementById('enrollment-progress-bar');
  const progressPercent = document.getElementById('enrollment-progress-percent');
  if (progressBar) progressBar.style.width = '0%';
  if (progressPercent) progressPercent.textContent = '0%';
  
  // Reset instructions
  const instructions = document.getElementById('enrollment-instructions');
  if (instructions) {
    instructions.textContent = 'Click "Start Enrollment" to begin face capture';
  }
  
  // Reset direction
  const direction = document.getElementById('enrollment-direction');
  if (direction) {
    direction.textContent = '';
  }
  
  // Show start button, hide stop button
  const startBtn = document.getElementById('start-enrollment');
  const stopBtn = document.getElementById('stop-enrollment');
  if (startBtn) startBtn.style.display = 'inline-block';
  if (stopBtn) stopBtn.style.display = 'none';
  
  // Show modal
  modal.style.display = 'block';
  
  // Initialize with Python backend
  eel.eel_start_face_enrollment(name)();
}

// Close face enrollment modal
function closeFaceEnrollmentModal() {
  const modal = document.getElementById('face-enrollment-modal');
  if (!modal) return;
  
  // Stop camera if it's running
  if (enrollmentStream) {
    stopEnrollmentCamera();
  }
  
  // Hide modal
  modal.style.display = 'none';
  
  // Reset enrollment state
  enrollmentActive = false;
  enrollmentEmployee = null;
}

// Start face enrollment
function startFaceEnrollment() {
  if (enrollmentActive || !enrollmentEmployee) return;
  
  enrollmentActive = true;
  enrollmentProgress = 0;
  enrollmentIndex = 0;
  
  // Show stop button, hide start button
  document.getElementById('start-enrollment').style.display = 'none';
  document.getElementById('stop-enrollment').style.display = 'inline-block';
  
  // Update UI
  document.getElementById('enrollment-instructions').textContent = 'Please follow the directions to capture your face from different angles';
  
  // Start camera
  startEnrollmentCamera().then(() => {
    // Start capture sequence
    captureNextEnrollmentSample();
  }).catch(error => {
    alert(`Could not start camera: ${error.message}`);
    stopFaceEnrollment();
  });
}

// Stop face enrollment
function stopFaceEnrollment() {
  enrollmentActive = false;
  
  // Stop camera
  stopEnrollmentCamera();
  
  // Reset UI
  document.getElementById('start-enrollment').style.display = 'inline-block';
  document.getElementById('stop-enrollment').style.display = 'none';
  document.getElementById('enrollment-instructions').textContent = 'Click "Start Enrollment" to begin face capture';
  document.getElementById('enrollment-direction').textContent = '';
  
  // Reset progress
  enrollmentProgress = 0;
  const progressBar = document.getElementById('enrollment-progress-bar');
  const progressPercent = document.getElementById('enrollment-progress-percent');
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
}

// Start enrollment camera
async function startEnrollmentCamera() {
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
    enrollmentStream = stream;
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (error) {
    console.error('Error starting camera:', error);
    throw error;
  }
}

// Stop enrollment camera
function stopEnrollmentCamera() {
  if (!enrollmentStream) return;
  
  const tracks = enrollmentStream.getTracks();
  tracks.forEach(track => track.stop());
  enrollmentStream = null;
  
  const video = document.getElementById('enrollment-video');
  if (video) {
    video.srcObject = null;
  }
}

// Capture next enrollment sample
function captureNextEnrollmentSample() {
  if (!enrollmentActive || !enrollmentEmployee) return;
  
  // If we've captured all samples, finish enrollment
  if (enrollmentIndex >= enrollmentDirections.length) {
    finishEnrollment();
    return;
  }
  
  // Set current direction
  currentDirection = enrollmentDirections[enrollmentIndex];
  document.getElementById('enrollment-direction').textContent = `Please look ${currentDirection}`;
  
  // Wait a moment for user to adjust position
  setTimeout(() => {
    // Capture frame
    const video = document.getElementById('enrollment-video');
    const canvas = document.getElementById('enrollment-canvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Save to Python backend
    eel.eel_save_face_snapshot(imageData, enrollmentIndex)(function(response) {
      if (response.success) {
        // Update progress
        enrollmentIndex++;
        enrollmentProgress = (enrollmentIndex / enrollmentDirections.length) * 100;
        
        const progressBar = document.getElementById('enrollment-progress-bar');
        const progressPercent = document.getElementById('enrollment-progress-percent');
        
        progressBar.style.width = `${enrollmentProgress}%`;
        progressPercent.textContent = `${Math.round(enrollmentProgress)}%`;
        
        // Continue with next sample if still active
        if (enrollmentActive) {
          setTimeout(captureNextEnrollmentSample, 1500);
        }
      } else {
        alert(`Error saving face snapshot: ${response.error}`);
        stopFaceEnrollment();
      }
    });
  }, 2000);
}

// Finish enrollment
function finishEnrollment() {
  if (!enrollmentEmployee) return;
  
  // Process samples with Python backend
  eel.eel_process_face_samples(enrollmentEmployee.name)(function(response) {
    if (response.success) {
      alert(`Face enrollment completed successfully!\n${response.samples} face samples processed.`);
      closeFaceEnrollmentModal();
      loadEmployees(); // Refresh employee list to show updated face samples
    } else {
      alert(`Error processing face samples: ${response.error}`);
      stopFaceEnrollment();
    }
  });
}

// Save employee
function saveEmployee() {
  const employeeId = document.getElementById('emp-id').value.trim();
  const name = document.getElementById('emp-name').value.trim();
  const department = document.getElementById('emp-department').value.trim();
  const position = document.getElementById('emp-position').value.trim();
  
  if (!employeeId || !name) {
    alert('Employee ID and Name are required');
    return;
  }
  
  if (faceSamples.length === 0) {
    alert('Face enrollment is required. Please capture face samples.');
    return;
  }
  
  // Prepare face data
  const faceData = JSON.stringify({
    samples: faceSamples,
    timestamp: new Date().toISOString()
  });
  
  // Call Eel function to enroll face
  eel.eel_enroll_face(employeeId, name, faceData, department, position)(function(response) {
    if (response.success) {
      alert(`Employee ${name} enrolled successfully with ${response.samples} face samples`);
      closeModal();
      loadEmployees(); // Refresh list
    } else {
      alert(`Failed to enroll: ${response.error}`);
    }
  });
}

// Start face capture
function startFaceCapture() {
  if (isCapturing) return;
  
  isCapturing = true;
  faceSamples = [];
  captureProgress = 0;
  currentDirectionIndex = 0;
  
  document.getElementById('start-capture').style.display = 'none';
  document.getElementById('reset-capture').style.display = 'inline-block';
  document.getElementById('progress-container').style.display = 'block';
  
  // Start camera
  startCamera().then(() => {
    // Update instructions
    document.getElementById('capture-instructions').textContent = 'Look at the camera and follow the instructions';
    document.getElementById('current-direction').textContent = `Please look ${directions[0]}`;
    
    // Start capture sequence after a delay
    setTimeout(captureNextSample, 2000);
  }).catch(error => {
    alert(`Could not start camera: ${error.message}`);
    resetFaceCapture();
  });
}

// Reset face capture
function resetFaceCapture() {
  isCapturing = false;
  
  document.getElementById('start-capture').style.display = 'inline-block';
  document.getElementById('reset-capture').style.display = 'none';
  document.getElementById('progress-container').style.display = 'none';
  document.getElementById('capture-instructions').textContent = 'Click "Start Capture" to begin face enrollment';
  document.getElementById('current-direction').textContent = '';
  
  // Reset progress bar
  document.getElementById('progress-percent').textContent = '0%';
  document.getElementById('progress-bar-inner').style.width = '0%';
  
  if (videoStream) {
    stopCamera();
  }
  
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
}

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });
    
    const video = document.getElementById('video');
    video.srcObject = stream;
    videoStream = stream;
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (error) {
    console.error('Error starting camera:', error);
    throw error;
  }
}

// Stop camera
function stopCamera() {
  if (!videoStream) return;
  
  const tracks = videoStream.getTracks();
  tracks.forEach(track => track.stop());
  videoStream = null;
  
  const video = document.getElementById('video');
  video.srcObject = null;
}

// Capture next sample
function captureNextSample() {
  if (!isCapturing) return;
  
  // Set current direction
  const currentDirection = directions[currentDirectionIndex];
  document.getElementById('current-direction').textContent = `Please look ${currentDirection}`;
  
  // Wait a moment for user to adjust position
  setTimeout(() => {
    // Capture frame
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    faceSamples.push(imageData);
    
    // Update progress
    currentDirectionIndex++;
    captureProgress = (currentDirectionIndex / directions.length) * 100;
    
    document.getElementById('progress-percent').textContent = `${Math.round(captureProgress)}%`;
    document.getElementById('progress-bar-inner').style.width = `${captureProgress}%`;
    
    // Check if we're done
    if (currentDirectionIndex >= directions.length) {
      // We have all samples
      document.getElementById('capture-instructions').textContent = 'Face enrollment complete!';
      document.getElementById('current-direction').textContent = '';
      
      // Stop capture but keep camera on
      isCapturing = false;
      return;
    }
    
    // Continue with next sample
    setTimeout(captureNextSample, 1500);
  }, 1000);
}

// Directions for face capture
const directions = [
  "center", "slightly right", "right", 
  "slightly left", "left", 
  "slightly up", "up", 
  "slightly down", "down",
  "right up", "right down", 
  "left up", "left down",
  "center", // Center shot for better accuracy
  "slight smile", "big smile", 
  "neutral", "slight frown", "eyebrows raised"
];
