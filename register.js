// Registration Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const registerBtn = document.getElementById('registerBtn');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    const birthDateInput = document.getElementById('birthDate');

    // Set maximum birth date to 18 years ago
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    birthDateInput.max = maxDate.toISOString().split('T')[0];

    // Password strength checker
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        updatePasswordStrength(strength);
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });

    // Confirm password validation
    confirmPasswordInput.addEventListener('input', function() {
        validatePasswordMatch();
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitForm();
        }
    });

    // Password strength checker function
    function checkPasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        strength = Object.values(checks).filter(Boolean).length;
        return { strength, checks };
    }

    // Update password strength indicator
    function updatePasswordStrength(strengthData) {
        const { strength, checks } = strengthData;
        const percentage = (strength / 5) * 100;
        
        strengthBar.style.setProperty('--width', percentage + '%');
        strengthBar.querySelector('::after').style.width = percentage + '%';
        
        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['#ff4757', '#ffa502', '#ffa502', '#2ed573', '#2ed573'];
        
        strengthText.textContent = strengthLevels[strength - 1] || 'Very Weak';
        strengthText.style.color = colors[strength - 1] || '#ff4757';
        
        // Update the actual bar
        const afterElement = strengthBar.querySelector('::after');
        if (afterElement) {
            afterElement.style.width = percentage + '%';
        } else {
            // Create the after element if it doesn't exist
            const style = document.createElement('style');
            style.textContent = `
                .strength-bar::after {
                    width: ${percentage}% !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Field validation
    function validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        clearError(fieldName);

        switch (fieldName) {
            case 'username':
                if (value.length < 3) {
                    errorMessage = 'Username must be at least 3 characters long';
                    isValid = false;
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    errorMessage = 'Username can only contain letters, numbers, and underscores';
                    isValid = false;
                }
                break;

            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;

            case 'phone':
                if (!/^\+?[0-9\-\s]{7,15}$/.test(value)) {
                    errorMessage = 'Please enter a valid phone number';
                    isValid = false;
                }
                break;

            case 'password':
                const passwordStrength = checkPasswordStrength(value);
                if (value.length < 8) {
                    errorMessage = 'Password must be at least 8 characters long';
                    isValid = false;
                } else if (passwordStrength.strength < 3) {
                    errorMessage = 'Password is too weak. Please include uppercase, lowercase, numbers, and symbols';
                    isValid = false;
                }
                break;

            case 'confirmPassword':
                if (value !== passwordInput.value) {
                    errorMessage = 'Passwords do not match';
                    isValid = false;
                }
                break;

            case 'fullName':
                if (value.length < 2) {
                    errorMessage = 'Full name must be at least 2 characters long';
                    isValid = false;
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    errorMessage = 'Full name can only contain letters and spaces';
                    isValid = false;
                }
                break;

            case 'birthDate':
                const birthDate = new Date(value);
                const age = (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
                if (age < 13) {
                    errorMessage = 'You must be at least 13 years old to register';
                    isValid = false;
                }
                break;

            case 'readingLevel':
                if (!value) {
                    errorMessage = 'Please select your reading level';
                    isValid = false;
                }
                break;

            case 'gender':
                if (!value) {
                    errorMessage = 'Please select your gender';
                    isValid = false;
                }
                break;

            case 'terms':
                if (!field.checked) {
                    errorMessage = 'You must agree to the terms and conditions';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            showError(fieldName, errorMessage);
        }

        return isValid;
    }

    // Validate password match
    function validatePasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            showError('confirmPassword', 'Passwords do not match');
            return false;
        } else {
            clearError('confirmPassword');
            return true;
        }
    }

    // Show error message
    function showError(fieldName, message) {
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Clear error message
    function clearError(fieldName) {
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Validate entire form
    function validateForm() {
        let isFormValid = true;
        
        // Validate all required fields
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        // Validate password match
        if (!validatePasswordMatch()) {
            isFormValid = false;
        }

        // Validate at least one genre is selected
        const genreCheckboxes = document.querySelectorAll('input[name="genres"]:checked');
        if (genreCheckboxes.length === 0) {
            showError('genres', 'Please select at least one favorite genre');
            isFormValid = false;
        } else {
            clearError('genres');
        }

        return isFormValid;
    }

    // Submit form
    async function submitForm() {
        // Show loading state
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<div class="loading"></div> Creating Account...';

        try {
            // Collect form data
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                gender: formData.get('gender'),
                fullName: formData.get('fullName'),
                birthDate: formData.get('birthDate'),
                readingLevel: formData.get('readingLevel'),
                genres: Array.from(document.querySelectorAll('input[name="genres"]:checked')).map(cb => cb.value),
                newsletter: formData.get('newsletter') === 'on',
                joinDate: new Date().toISOString()
            };

            // Send to backend to write to Excel
            await sendToServer(userData);

            // Show success message
            showSuccessMessage();
            
            // Reset form
            form.reset();
            
            // Redirect to login or dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            showError('general', 'Registration failed. Please try again.');
        } finally {
            // Reset button state
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }

    // Send to backend server to persist in Excel
    async function sendToServer(userData) {
        const payload = {
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            gender: userData.gender,
            password: userData.password,
            fullName: userData.fullName,
            birthDate: userData.birthDate,
            readingLevel: userData.readingLevel,
            genres: userData.genres,
            newsletter: userData.newsletter
        };

        const resp = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success) {
            throw new Error(data.message || 'Failed to save registration');
        }

        // Also save minimal session locally
        localStorage.setItem('mangaVerseUser', JSON.stringify({
            username: userData.username,
            loginTime: new Date().toISOString()
        }));
    }

    // Show success message
    function showSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message show';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Account created successfully! Welcome to MangaVerse!
        `;
        
        form.insertBefore(successMessage, form.firstChild);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    }

    // Add smooth scrolling for form errors
    function scrollToFirstError() {
        const firstError = document.querySelector('.error-message.show');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Add input animations
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // Add genre selection animation
    const genreCheckboxes = document.querySelectorAll('.genre-checkbox input[type="checkbox"]');
    genreCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('.genre-checkbox');
            if (this.checked) {
                label.style.background = 'rgba(255, 107, 107, 0.2)';
                label.style.borderColor = '#ff6b6b';
            } else {
                label.style.background = 'rgba(255, 255, 255, 0.05)';
                label.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
        });
    });
});
