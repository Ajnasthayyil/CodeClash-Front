import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res) {
          this.successMessage = (res as any)?.message || 'A verification link and OTP code have been sent to your email.';
          
          // Redirect to reset password page after short delay
          setTimeout(() => {
            this.router.navigate(['/auth/reset-password'], { state: { email: this.email } });
          }, 2000);
        } else {
          this.errorMessage = (res as any)?.message || 'Failed to send reset link.';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred while sending reset link.';
        }
      }
    });
  }
}
