import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface AdminUserRecordDto {
  id: string;
  username: string;
  email: string;
  elo: number;
  role: 'Admin' | 'User';
  status: 'Active' | 'Suspended';
  joinDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private apiUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/admin/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<ApiResponse<AdminUserRecordDto[]>> {
    return this.http.get<ApiResponse<AdminUserRecordDto[]>>(this.apiUrl);
  }

  toggleUserStatus(userId: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${userId}/toggle-status`, {});
  }
}
