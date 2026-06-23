import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name = '';
  email = '';
  company = '';
  password = '';
  agreeTerms = false;

  errorMessage = '';
  isLoading = false;

  constructor(private router: Router) {}

  onSubmit() {
    this.errorMessage = '';

    if (!this.name) {
      this.errorMessage = 'Please enter your full name.';
      return;
    }
    if (!this.email) {
      this.errorMessage = 'Please enter your email.';
      return;
    }
    if (!this.company) {
      this.errorMessage = 'Please enter your company name.';
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
    if (!this.agreeTerms) {
      this.errorMessage = 'You must agree to the Terms and Conditions.';
      return;
    }

    this.isLoading = true;

    // Simulate Register call
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }, 1500);
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
