import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.scss']
})
export class OTPVerificationComponent {
  otpCode = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private router: Router) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otpCode) {
      this.errorMessage = 'Please enter the verification code.';
      return;
    }
    if (this.otpCode.length !== 6) {
      this.errorMessage = 'The verification code must be exactly 6 digits.';
      return;
    }

    this.isLoading = true;

    // Simulate OTP verification call
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Verification successful! Redirecting you to login...';
      
      // Redirect to login after short delay
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
    }, 1500);
  }

  resendCode() {
    this.errorMessage = '';
    this.successMessage = 'A new 6-digit code has been successfully resent.';
  }
}
