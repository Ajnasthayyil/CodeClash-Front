import { Component } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.isLoading = true;

    // Simulate password recovery reset call
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'A verification link and OTP code have been sent to your email.';
      
      // Redirect to OTP verification page after short delay
      setTimeout(() => {
        this.router.navigate(['/auth/otp']);
      }, 2000);
    }, 1500);
  }
}
