// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateLoginForm()) {
            submitLogin();
        }
    });

    // Real-time validation
    usernameInput.addEventListener('blur', function() {
        validateUsername(this.value);
    });

    passwordInput.addEventListener('blur', function() {
        validatePassword(this.value);
    });

    // Form validation
    function validateLoginForm() {
        let isValid = true;
        
        if (!validateUsername(usernameInput.value)) {
            isValid = false;
        }
        
        if (!validatePassword(passwordInput.value)) {
            isValid = false;
        }
        
        return isValid;
    }

    function validateUsername(username) {
        const errorElement = document.getElementById('usernameError');
        
        if (!username || username.length < 3) {
            showError('usernameError', 'Username must be at least 3 characters long');
            return false;
        }
        
        clearError('usernameError');
        return true;
    }

    function validatePassword(password) {
        const errorElement = document.getElementById('passwordError');
        
        if (!password || password.length < 6) {
            showError('passwordError', 'Password must be at least 6 characters long');
            return false;
        }
        
        clearError('passwordError');
        return true;
    }

    function showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function clearError(fieldId) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Submit login
    async function submitLogin() {
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

        try {
            const loginData = {
                identifier: usernameInput.value.trim(),
                password: passwordInput.value,
                rememberMe: rememberMeCheckbox.checked
            };

            const result = await authenticateUser(loginData);
            
            if (result.user) {
                const userRecord = {
                    username: result.user.username,
                    email: result.user.email,
                    phone: result.user.phone,
                    gender: result.user.gender,
                    loginTime: result.user.lastLogin
                };

                if (loginData.rememberMe) {
                    localStorage.setItem('mangaVerseRememberedUser', JSON.stringify({
                        username: userRecord.username,
                        savedAt: Date.now()
                    }));
                }

                localStorage.setItem('mangaVerseUser', JSON.stringify(userRecord));
                
                showSuccessMessage('Login successful! Welcome back to MangaVerse!');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else if (result.error) {
                showError('passwordError', result.error);
            } else {
                showError('passwordError', 'Login failed. Please try again.');
            }

        } catch (error) {
            console.error('Login error:', error);
            showError('passwordError', error.message || 'Login failed. Please try again.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    async function authenticateUser(loginData) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernameOrEmail: loginData.identifier,
                    password: loginData.password
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                return { error: data.message || 'Invalid username or password' };
            }

            return { user: data.user };
        } catch (err) {
            console.error('Authentication request failed:', err);
            throw new Error('Unable to reach the server. Please ensure it is running.');
        }
    }

    function showSuccessMessage(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message show';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(successMessage);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    }

    // Add CSS for success message animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});
