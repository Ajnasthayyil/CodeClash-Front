import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


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

  getUsers(): Observable<AdminUserRecordDto[]> {
    return this.http.get<AdminUserRecordDto[]>(this.apiUrl);
  }

  toggleUserStatus(userId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${userId}/toggle-status`, {});
  }

  sendNotification(payload: { userId?: string, title: string, message: string, type?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/notify`, payload);
  }
}
