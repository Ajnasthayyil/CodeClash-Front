import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.scss']
})
export class RegisterFormComponent {
  name = '';
  email = '';
  phoneNumber = '';
  designation = '';
  password = '';
  confirmPassword = '';
  agreeTerms = false;

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit() {
    this.errorMessage = '';

    if (!this.name) {
      this.errorMessage = 'Please enter your full name.';
      return;
    }
    const nameRegex = /^[a-zA-Z\s'\-]+$/;
    if (!nameRegex.test(this.name)) {
      this.errorMessage = 'Full name may only contain letters, spaces, hyphens, and apostrophes.';
      return;
    }

    if (!this.email) {
      this.errorMessage = 'Please enter your email.';
      return;
    }
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address containing only lowercase letters.';
      return;
    }

    if (!this.phoneNumber) {
      this.errorMessage = 'Please enter your phone number.';
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.phoneNumber)) {
      this.errorMessage = 'Phone number must be exactly 10 digits and contain only numbers.';
      return;
    }

    if (!this.designation) {
      this.errorMessage = 'Please enter your designation.';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Please set a secure password.';
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    if (!this.confirmPassword) {
      this.errorMessage = 'Please confirm your password.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.agreeTerms) {
      this.errorMessage = 'You must agree to the Terms and Conditions.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';

    const payload = {
      fullName: this.name,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      phoneNumber: this.phoneNumber,
      designation: this.designation
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = res.message || 'Account created successfully! Please check your email to verify your account.';
          // Clear inputs on success
          this.name = '';
          this.email = '';
          this.phoneNumber = '';
          this.designation = '';
          this.password = '';
          this.confirmPassword = '';
          this.agreeTerms = false;
        } else {
          this.errorMessage = res.message || 'Registration failed.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'Could not connect to the API server. Please ensure the backend is running at http://localhost:5126.';
        } else if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An unexpected server error occurred during registration. Please try again.';
        }
      }
    });
  }

  registerWithSocial(provider: string) {
    this.isLoading = true;
    this.errorMessage = '';
    
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }, 1200);
  }
}
