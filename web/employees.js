document.addEventListener("DOMContentLoaded", function() {
  // Load employees when page loads
  loadEmployees();
  
  // Initialize modal functionality
  const modal = document.getElementById('employee-modal');
  const addEmployeeBtn = document.getElementById('add-employee-btn');
  const closeModalBtn = document.querySelector('.close-modal');
  
  if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', function() {
      openModal();
    });
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
      closeModal();
    });
  }
  
  // Close modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
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
});

// Global variables for face capture
let isCapturing = false;
let faceSamples = [];
let captureProgress = 0;
let currentDirectionIndex = 0;
let videoStream = null;
let captureInterval = null;

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
        <button class="danger-btn delete-btn" data-id="${employee.id}">Delete</button>
      `;
      
      // Set up delete button
      const deleteBtn = actionsCell.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', function() {
        if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
          deleteEmployee(employee.id);
        }
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
