function checkPasswordStrength() {
    const password = document.getElementById('password')?.value || '';
    const meter = document.getElementById('strengthMeter');
    const text = document.getElementById('strengthText');
    if (!meter || !text) return;
    let score = 0;
    if (password.length >= 6) score += 1;  
    if (password.length >= 8) score += 1;
    
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1; 
    if (/\d/.test(password)) score += 1;  
    if (/[^A-Za-z0-9]/.test(password)) score += 1; 
    let level = '';
    let color = '';
    let width = 0;
    
    if (score <= 1) {
        level = 'Weak';
        color = '#dc3545';  
        width = 25;
    } else if (score === 2) {
        level = 'Fair';
        color = '#fd7e14'; 
        width = 50;
    } else if (score === 3) {
        level = 'Good';
        color = '#ffc107';
        width = 75;
    } else {
        level = 'Strong';
        color = '#28a745';
        width = 100;
    }
    meter.style.width = width + '%';
    meter.style.background = color;
    text.textContent = `Password strength: ${level}`;
}
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;
    const icon = passwordInput.nextElementSibling?.querySelector('i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
function handleFormSubmit(e) {
    const form = e.target;
    const submitButton = form.querySelector('.btn');
    if (!submitButton) return;
    const originalText = submitButton.innerHTML;
    const wasDisabled = submitButton.disabled;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitButton.disabled = true;
    setTimeout(() => {
        submitButton.innerHTML = originalText;
        submitButton.disabled = wasDisabled;
    }, 3000);
}
function hideAlert(alertElement) {
    alertElement.style.opacity = '0';
    alertElement.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 500);
}
function setupInputAnimations() {
    const inputs = document.querySelectorAll('.input-with-icon input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}
function setupSocialButtons() {
    const socialButtons = document.querySelectorAll('.btn-social');
    socialButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });
}
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}
function isValidPassword(password) {
    return password.length >= 6;
}
function initializePage() {
    console.log('Initializing auth page...');
    setupInputAnimations();
    if (document.querySelector('.btn-social')) {
        setupSocialButtons();
    }
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.style.display !== 'none') {
                hideAlert(alert);
            }
        }, 5000);
    });
    console.log('Auth page initialized!');
}
document.addEventListener('DOMContentLoaded', initializePage);
window.passwordUtils = {
    checkPasswordStrength,
    togglePassword,
    isValidEmail,
    isValidPassword
};