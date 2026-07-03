import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface DashboardStatsDto {
  totalUsers: number;
  activeMatches: number;
  submissionRate: number;
  systemLoad: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/admin/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<ApiResponse<DashboardStatsDto>> {
    return this.http.get<ApiResponse<DashboardStatsDto>>(`${this.apiUrl}/stats`, { withCredentials: true });
  }
}
