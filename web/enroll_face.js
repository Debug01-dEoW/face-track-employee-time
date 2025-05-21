
document.addEventListener("DOMContentLoaded", function() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const employeeName = urlParams.get('name') || 'Unknown';
    const employeeId = urlParams.get('id') || '0';
    const department = urlParams.get('dept') || 'Not Specified';
    const position = urlParams.get('pos') || 'Not Specified';
    
    // Update the UI with employee info
    document.getElementById('employee-name').textContent = employeeName;
    document.getElementById('employee-department').textContent = department;
    document.getElementById('employee-position').textContent = position;
    
    // Set up buttons
    const startEnrollmentBtn = document.getElementById('start-enrollment');
    const stopEnrollmentBtn = document.getElementById('stop-enrollment');
    const retryEnrollmentBtn = document.getElementById('retry-enrollment');
    
    if (startEnrollmentBtn) {
        startEnrollmentBtn.addEventListener('click', function() {
            startFaceEnrollment(employeeName);
        });
    }
    
    if (stopEnrollmentBtn) {
        stopEnrollmentBtn.addEventListener('click', function() {
            stopFaceEnrollment();
        });
    }
    
    if (retryEnrollmentBtn) {
        retryEnrollmentBtn.addEventListener('click', function() {
            resetEnrollment();
        });
    }
});

// Global variables
let videoStream = null;
let enrollmentActive = false;
let faceSamples = [];
let currentSampleIndex = 0;
const directions = [
    "center", "slightly right", "right", "slightly left", "left",
    "slightly up", "up", "slightly down", "down",
    "right up", "right down", "left up", "left down",
    "slight smile", "big smile", "neutral"
];
const totalSamples = directions.length;
let captureInterval = null;

// Start face enrollment
async function startFaceEnrollment(username) {
    // First check if Eel is ready
    try {
        // Notify Python that enrollment is starting
        const response = await eel.eel_start_face_enrollment(username)();
        
        if (!response.success) {
            showError(response.error || "Failed to initialize enrollment process");
            return;
        }
        
        await startCamera();
        startCapturing(username);
    } catch (error) {
        console.error("Error starting enrollment:", error);
        showError("Failed to communicate with backend. Please ensure the Python service is running.");
    }
}

// Start camera
async function startCamera() {
    try {
        // Update UI
        document.getElementById('enrollment-status').textContent = "Starting camera...";
        
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
        document.getElementById('start-enrollment').style.display = 'none';
        document.getElementById('stop-enrollment').style.display = 'inline-block';
        document.getElementById('enrollment-status').textContent = 'Camera ready';
        
        // Play the video
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
    } catch (error) {
        console.error('Error starting camera:', error);
        showError('Could not access camera. Please check permissions.');
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
    
    // Update UI
    document.getElementById('start-enrollment').style.display = 'inline-block';
    document.getElementById('stop-enrollment').style.display = 'none';
    document.getElementById('enrollment-status').textContent = 'Camera off';
}

// Start capturing face samples
function startCapturing(username) {
    if (enrollmentActive) return;
    
    enrollmentActive = true;
    faceSamples = [];
    currentSampleIndex = 0;
    
    // Update UI
    updateProgress(0);
    document.getElementById('directions-prompt').textContent = `Look ${directions[0]}`;
    document.getElementById('enrollment-status').textContent = "Starting face capture...";
    
    // Capture the first image after a short delay
    setTimeout(() => captureNextSample(username), 2000);
}

// Capture next face sample
async function captureNextSample(username) {
    if (!enrollmentActive || currentSampleIndex >= totalSamples) {
        finishEnrollment(username);
        return;
    }
    
    try {
        // Update UI with current direction
        document.getElementById('directions-prompt').textContent = `Look ${directions[currentSampleIndex]}`;
        document.getElementById('enrollment-status').textContent = `Capturing sample ${currentSampleIndex + 1} of ${totalSamples}`;
        
        // Capture image from video
        const imageData = captureImage();
        
        if (!imageData) {
            showError("Failed to capture image");
            return;
        }
        
        // Send to backend for processing
        const result = await eel.eel_save_face_snapshot(imageData, currentSampleIndex)();
        
        if (result.success) {
            faceSamples.push(result.filename);
            currentSampleIndex++;
            
            // Update progress
            const progressPercent = (currentSampleIndex / totalSamples) * 100;
            updateProgress(progressPercent);
            
            // Schedule next capture
            if (currentSampleIndex < totalSamples) {
                setTimeout(() => captureNextSample(username), 1000);
            } else {
                finishEnrollment(username);
            }
        } else {
            // If face detection failed, retry after a delay
            document.getElementById('enrollment-status').textContent = `${result.error}. Please reposition your face.`;
            setTimeout(() => captureNextSample(username), 2000);
        }
    } catch (error) {
        console.error("Error capturing sample:", error);
        showError("Error capturing face sample");
    }
}

// Capture a single image from video
function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    if (!video || !canvas || !videoStream) {
        return null;
    }
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image as data URL
    return canvas.toDataURL('image/jpeg', 0.9);
}

// Update progress bar and text
function updateProgress(percent) {
    document.getElementById('progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-text').textContent = `${Math.round(percent)}%`;
}

// Finish enrollment process
async function finishEnrollment(username) {
    try {
        document.getElementById('enrollment-status').textContent = "Processing face samples...";
        
        // Process all collected samples
        const result = await eel.eel_process_face_samples(username)();
        
        if (result.success) {
            // Show success UI
            document.getElementById('enrollment-result').style.display = 'block';
            document.getElementById('enrollment-success').style.display = 'block';
            document.getElementById('sample-count').textContent = `${result.samples} face samples collected`;
            document.getElementById('enrollment-status').textContent = "Enrollment completed successfully";
            
            // Store success in local storage for the main app to read
            localStorage.setItem('face_enrollment_result', JSON.stringify({
                success: true,
                name: username,
                samples: result.samples,
                timestamp: new Date().toISOString()
            }));
        } else {
            showError(result.error || "Failed to process face samples");
        }
    } catch (error) {
        console.error("Error finishing enrollment:", error);
        showError("Error processing face samples");
    } finally {
        // Clean up resources
        stopFaceEnrollment();
    }
}

// Stop enrollment process
function stopFaceEnrollment() {
    enrollmentActive = false;
    
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }
    
    stopCamera();
    
    // Reset UI
    document.getElementById('directions-prompt').textContent = "Position your face in the frame";
    document.getElementById('enrollment-status').textContent = "Enrollment stopped";
    document.getElementById('start-enrollment').style.display = 'inline-block';
    document.getElementById('stop-enrollment').style.display = 'none';
}

// Show error message
function showError(message) {
    document.getElementById('enrollment-result').style.display = 'block';
    document.getElementById('enrollment-success').style.display = 'none';
    document.getElementById('enrollment-failure').style.display = 'block';
    document.getElementById('failure-reason').textContent = message;
    document.getElementById('enrollment-status').textContent = "Enrollment failed";
    
    // Store failure in local storage for the main app to read
    localStorage.setItem('face_enrollment_result', JSON.stringify({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    }));
    
    // Stop enrollment process
    stopFaceEnrollment();
}

// Reset enrollment state
function resetEnrollment() {
    // Hide error message
    document.getElementById('enrollment-result').style.display = 'none';
    document.getElementById('enrollment-failure').style.display = 'none';
    
    // Reset progress
    updateProgress(0);
    
    // Show start button
    document.getElementById('start-enrollment').style.display = 'inline-block';
    document.getElementById('enrollment-status').textContent = "Ready to start";
}
