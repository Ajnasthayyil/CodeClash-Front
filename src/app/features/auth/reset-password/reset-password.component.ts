import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  email = '';
  otp = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { email: string };
    
    if (state && state.email) {
      this.email = state.email;
    } else if (history.state && history.state.email) {
      this.email = history.state.email;
    }

    if (!this.email) {
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP.';
      return;
    }
    if (!this.password || this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword({ email: this.email, otp: this.otp, password: this.password }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.success) {
          this.successMessage = res.message || 'Password reset successfully. Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          this.errorMessage = res.message || 'Failed to reset password.';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred during password reset.';
        }
      }
    });
  }

  resendOtp() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.success) {
          this.successMessage = 'A new OTP has been sent to your email.';
        } else {
          this.errorMessage = res.message || 'Failed to resend OTP.';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred while resending OTP.';
        }
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
