document.addEventListener('DOMContentLoaded', function() {
    // Set up theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('light-theme');
            
            if (document.body.classList.contains('light-theme')) {
                themeToggleBtn.textContent = '☀️';
                localStorage.setItem('theme', 'light');
            } else {
                themeToggleBtn.textContent = '🌙';
                localStorage.setItem('theme', 'dark');
            }
        });
        
        // Check saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeToggleBtn.textContent = '☀️';
        }
    }
    
    // Other common functionality
    console.log('FaceTrack system initialized');
    
    // Check for Python backend availability
    if (typeof eel !== 'undefined') {
        console.log('Eel framework detected - Python backend is available');
    } else {
        console.warn('Eel framework not detected - Python backend may not be available');
        // We could show a warning here if needed
    }
});

// Utility function to format dates
function formatDateTime(isoString) {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    
    // Format: YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Utility function to show error messages
function showError(message, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="error-message">${message}</div>`;
    } else {
        alert(message);
    }
}
