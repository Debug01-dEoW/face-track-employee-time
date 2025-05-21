
document.addEventListener("DOMContentLoaded", function() {
  // Set up camera buttons
  const startCameraBtn = document.getElementById('start-camera');
  const stopCameraBtn = document.getElementById('stop-camera');
  const takeSnapshotBtn = document.getElementById('take-snapshot');
  
  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', function() {
      startCamera();
    });
  }
  
  if (stopCameraBtn) {
    stopCameraBtn.addEventListener('click', function() {
      stopCamera();
    });
  }
  
  if (takeSnapshotBtn) {
    takeSnapshotBtn.addEventListener('click', function() {
      recognizeFace();
    });
  }
});

// Global variables
let videoStream = null;
let recognitionActive = false;

// Start camera
async function startCamera() {
  try {
    // Request camera access
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
    
    // Update UI
    document.getElementById('start-camera').style.display = 'none';
    document.getElementById('stop-camera').style.display = 'inline-block';
    document.getElementById('take-snapshot').style.display = 'inline-block';
    document.getElementById('recognition-status').textContent = 'Camera active. Position your face and click "Recognize Face"';
    
    // Hide any previous results
    document.getElementById('recognition-result').style.display = 'none';
    document.getElementById('recognition-success').style.display = 'none';
    document.getElementById('recognition-failure').style.display = 'none';
    
    // Play the video
    video.onloadedmetadata = () => {
      video.play();
    };
  } catch (error) {
    console.error('Error starting camera:', error);
    alert('Could not access camera. Please check permissions.');
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
  
  // Update UI
  document.getElementById('start-camera').style.display = 'inline-block';
  document.getElementById('stop-camera').style.display = 'none';
  document.getElementById('take-snapshot').style.display = 'none';
  document.getElementById('recognition-status').textContent = 'Camera off';
}

// Recognize face
function recognizeFace() {
  if (!videoStream || recognitionActive) return;
  
  recognitionActive = true;
  
  // Update status
  document.getElementById('recognition-status').textContent = 'Processing...';
  document.getElementById('take-snapshot').disabled = true;
  
  // Capture frame
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Get image data as base64
  const imageData = canvas.toDataURL('image/jpeg', 0.8);
  
  // Hide previous results
  document.getElementById('recognition-result').style.display = 'none';
  
  // Call Python function to recognize face
  eel.eel_recognize_face(imageData)(function(response) {
    recognitionActive = false;
    document.getElementById('take-snapshot').disabled = false;
    
    if (!response.success) {
      document.getElementById('recognition-status').textContent = `Error: ${response.error}`;
      return;
    }
    
    // Show result container
    document.getElementById('recognition-result').style.display = 'block';
    
    if (response.detected) {
      if (response.recognized && response.person) {
        // Match found
        document.getElementById('recognition-success').style.display = 'block';
        document.getElementById('recognition-failure').style.display = 'none';
        
        const name = response.person.name;
        const details = response.person.details || {};
        
        document.getElementById('recognized-name').textContent = name;
        document.getElementById('recognition-time').textContent = new Date().toLocaleTimeString();
        document.getElementById('recognition-status').textContent = `Welcome, ${name}!`;
        
        // If we have additional details, display them
        if (document.getElementById('employee-details')) {
          let detailsHtml = `
            <div class="detail-item"><span>Name:</span> ${name}</div>
          `;
          
          if (details.department) {
            detailsHtml += `<div class="detail-item"><span>Department:</span> ${details.department}</div>`;
          }
          
          if (details.position) {
            detailsHtml += `<div class="detail-item"><span>Position:</span> ${details.position}</div>`;
          }
          
          document.getElementById('employee-details').innerHTML = detailsHtml;
          document.getElementById('employee-details').style.display = 'block';
        }
        
        // Record attendance in local storage for display on dashboard
        const attendanceRecord = {
          employeeName: name,
          timestamp: new Date().toISOString(),
          type: "IN"
        };
        
        let recentActivity = JSON.parse(localStorage.getItem('recent_activity') || '[]');
        recentActivity.unshift(attendanceRecord);
        if (recentActivity.length > 10) recentActivity = recentActivity.slice(0, 10);
        localStorage.setItem('recent_activity', JSON.stringify(recentActivity));
        
      } else {
        // No match
        document.getElementById('recognition-success').style.display = 'none';
        document.getElementById('recognition-failure').style.display = 'block';
        document.getElementById('recognition-status').textContent = 'No matching face found';
        
        if (document.getElementById('employee-details')) {
          document.getElementById('employee-details').style.display = 'none';
        }
      }
    } else {
      // No face detected
      document.getElementById('recognition-success').style.display = 'none';
      document.getElementById('recognition-failure').style.display = 'block';
      document.getElementById('recognition-failure').querySelector('h3').textContent = 'No Face Detected';
      document.getElementById('recognition-failure').querySelector('p').textContent = 'Please position your face in the frame and try again.';
      document.getElementById('recognition-status').textContent = 'No face detected';
      
      if (document.getElementById('employee-details')) {
        document.getElementById('employee-details').style.display = 'none';
      }
    }
  });
}
