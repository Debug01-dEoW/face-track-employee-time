
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
  
  // Call Eel function to recognize face
  eel.eel_recognize_face(imageData)(function(response) {
    recognitionActive = false;
    document.getElementById('take-snapshot').disabled = false;
    
    if (!response.success) {
      document.getElementById('recognition-status').textContent = `Error: ${response.error}`;
      return;
    }
    
    // Show result container
    document.getElementById('recognition-result').style.display = 'block';
    
    if (response.person) {
      // Match found
      document.getElementById('recognition-success').style.display = 'block';
      document.getElementById('recognition-failure').style.display = 'none';
      
      document.getElementById('recognized-name').textContent = response.person.name;
      document.getElementById('recognition-time').textContent = new Date().toLocaleTimeString();
      document.getElementById('recognition-status').textContent = `Welcome, ${response.person.name}!`;
    } else {
      // No match
      document.getElementById('recognition-success').style.display = 'none';
      document.getElementById('recognition-failure').style.display = 'block';
      document.getElementById('recognition-status').textContent = 'No matching face found';
    }
  });
}
