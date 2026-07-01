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

  constructor(private http: HttpClient) {}

  register(payload: any): Observable<ApiResponse<string>> {
    // Cache the entered designation so it can be restored on profile mapping after login
    if (payload.designation) {
      localStorage.setItem('last_designation', payload.designation);
    }
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
        if (res && res.success && res.data) {
          const authData = res.data;
          localStorage.setItem('accessToken', authData.accessToken);

          // Build initials
          const parts = authData.user.fullName.trim().split(/\s+/);
          let initials = 'NC';
          if (parts.length >= 2) {
            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          } else if (parts.length === 1 && parts[0].length > 0) {
            initials = parts[0][0].toUpperCase();
          }

          // Recover the designation cache or default to Senior Software Engineer
          const designation = localStorage.getItem('last_designation') || 'Senior Software Engineer';

          // Build the currentUser object and save to local storage
          const currentUser = {
            id: authData.user.userId,
            name: authData.user.fullName,
            email: authData.user.email,
            phoneNumber: payload.phoneNumber || '1234567890',
            designation: designation,
            username: authData.user.username,
            role: authData.user.role,
            initials: initials
          };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
      })
    );
  }

  refresh(): Observable<ApiResponse<AuthResponseDto>> {
    return this.http.post<ApiResponse<AuthResponseDto>>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => {
        if (res && res.success && res.data) {
          localStorage.setItem('accessToken', res.data.accessToken);
        }
      })
    );
  }

  logout(): Observable<ApiResponse<any>> {
    const accessToken = localStorage.getItem('accessToken') || '';
    
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('last_designation');
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }
}
