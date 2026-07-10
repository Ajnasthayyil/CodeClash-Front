import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private apiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<AdminUserRecordDto[]> {
    return this.http.get<ApiResponse<AdminUserRecordDto[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  toggleUserStatus(userId: string): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${userId}/toggle-status`, {}).pipe(
      map(res => res.data)
    );
  }

  sendNotification(payload: { userId?: string, title: string, message: string, type?: string }): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/notify`, payload).pipe(
      map(res => res.data)
    );
  }
}

