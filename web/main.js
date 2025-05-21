
// Common JavaScript functions for the FaceTrack web interface

// Handle theme toggling
document.addEventListener("DOMContentLoaded", function() {
    // Initialize theme from localStorage
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(currentTheme);
    
    // Set up theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        themeToggleBtn.addEventListener('click', function() {
            toggleTheme();
        });
    }
    
    // Handle console messages from Eel
    if (window.eel) {
        eel.expose(console.log);
        eel.expose(console.error);
    }
});

// Toggle between light and dark theme
function toggleTheme() {
    if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        localStorage.setItem('theme', 'light');
        if (document.getElementById('theme-toggle-btn')) {
            document.getElementById('theme-toggle-btn').textContent = '🌙';
        }
    } else {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (document.getElementById('theme-toggle-btn')) {
            document.getElementById('theme-toggle-btn').textContent = '☀️';
        }
    }
}

// Format a date string
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Helper function to show an alert/notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Helper function to add CSS styles for notifications if not already present
function addNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.innerHTML = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 5px;
                color: white;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
                z-index: 1000;
            }
            .notification.show {
                opacity: 1;
                transform: translateY(0);
            }
            .notification.info {
                background-color: #3498db;
            }
            .notification.success {
                background-color: #2ecc71;
            }
            .notification.error {
                background-color: #e74c3c;
            }
            .notification.warning {
                background-color: #f39c12;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize notification styles
addNotificationStyles();
