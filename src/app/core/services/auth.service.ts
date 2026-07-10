import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export interface UserDto {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/auth';
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {}

  register(payload: any): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/register`, {
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      phoneNumber: payload.phoneNumber
    });
  }

  login(payload: any): Observable<ApiResponse<AuthResponseDto>> {
    return this.http.post<ApiResponse<AuthResponseDto>>(`${this.apiUrl}/login`, {
      emailOrUsername: payload.email,
      password: payload.password
    }, { withCredentials: true }).pipe(
      tap(res => {
        try {
          if (res && res.success && res.data) {
            const authData = res.data;
            this.accessToken = authData.accessToken;

            // Build initials
            const parts = authData.user.fullName.trim().split(/\s+/);
            let initials = 'NC';
            if (parts.length >= 2) {
              initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            } else if (parts.length === 1 && parts[0].length > 0) {
              initials = parts[0][0].toUpperCase();
            }

            // Build the currentUser object and save to local storage
            const currentUser = {
              id: authData.user.userId,
              name: authData.user.fullName,
              email: authData.user.email,
              phoneNumber: payload.phoneNumber || '',
              username: authData.user.username,
              role: authData.user.role,
              initials: initials
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Save tokens to browser cookies
            this.setCookie('token', authData.accessToken, 7);
            this.setCookie('refreshToken', authData.refreshToken, 7);
          }
        } catch (e) {
          console.error('Error inside AuthService.login tap:', e);
          throw e;
        }
      })
    );
  }

  refresh(): Observable<ApiResponse<AuthResponseDto>> {
    return this.http.post<ApiResponse<AuthResponseDto>>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => {
        if (res && res.success && res.data) {
          this.accessToken = res.data.accessToken;
          this.setCookie('token', res.data.accessToken, 7);
          this.setCookie('refreshToken', res.data.refreshToken, 7);
        }
      })
    );
  }

  logout(): Observable<ApiResponse<any>> {
    const accessToken = this.accessToken || '';
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/logout`, {}, { headers, withCredentials: true }).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }

  clearSession(): void {
    this.accessToken = null;
    this.deleteCookie('token');
    this.deleteCookie('refreshToken');
    localStorage.removeItem('currentUser');
  }

  get isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = this.getCookie('token');
    }
    return this.accessToken;
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  getProfile(): Observable<ApiResponse<any>> {
    const profileUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/profile';
    return this.http.get<ApiResponse<any>>(profileUrl);
  }

  updateProfile(payload: { fullName: string; phoneNumber: string; username: string }): Observable<ApiResponse<any>> {
    const profileUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/profile';
    return this.http.put<ApiResponse<any>>(profileUrl, payload);
  }

  uploadProfileImage(file: File): Observable<ApiResponse<string>> {
    const uploadUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/profile/image';
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(uploadUrl, formData);
  }

  deleteAccount(): Observable<ApiResponse<any>> {
    const profileUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/profile';
    return this.http.delete<ApiResponse<any>>(profileUrl);
  }

  // ─── Token and Cookie Helpers ──────────────────────────────────────────

  setAuthTokens(token: string, refreshToken: string): void {
    this.accessToken = token;
    this.setCookie('token', token, 7);
    this.setCookie('refreshToken', refreshToken, 7);
  }

  setCookie(name: string, value: string, days: number): void {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    // Secure Cookie Flag integration (Secure, SameSite=Lax, Path=/)
    document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax; Secure`;
  }

  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  deleteCookie(name: string): void {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
  }
}
