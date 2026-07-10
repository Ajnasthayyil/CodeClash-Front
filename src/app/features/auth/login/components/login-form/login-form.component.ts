import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
  email = '';
  password = '';
  rememberMe = false;
  
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  githubLoginUrl = `${environment.apiUrl}/auth/github-login`;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'blocked') {
        this.errorMessage = 'the admin blocked the user please contect to admin';
      }
    });
  }

  onSubmit() {
    this.errorMessage = '';
    
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

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          const user = this.authService.getCurrentUser();
          if (user && user.role === 'Admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = (res as any)?.message || 'Login failed.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err);
        if (err.status === 0) {
          this.errorMessage = 'Could not connect to the API server. Please ensure the backend is running.';
        } else if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An unexpected server error occurred during login. Please try again.';
        }
      }
    });
  }

  loginWithSocial(provider: string) {
    this.isLoading = true;
    this.errorMessage = '';
    
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }, 1200);
  }

  loginWithGithub() {
    window.location.href = `${environment.apiUrl}/auth/github-login`;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
