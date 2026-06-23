import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  
  errorMessage = '';
  isLoading = false;

  constructor(private router: Router) {}

  onSubmit() {
    this.errorMessage = '';
    
    // Quick validation
    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }
    if (!this.password) {
      this.errorMessage = 'Please enter your password.';
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;

    // Simulate login API call
    setTimeout(() => {
      this.isLoading = false;
      // Redirect to dashboard on mock success
      this.router.navigate(['/dashboard']);
    }, 1500);
  }

  loginWithSocial(provider: string) {
    this.isLoading = true;
    this.errorMessage = '';
    
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }, 1200);
  }
}
