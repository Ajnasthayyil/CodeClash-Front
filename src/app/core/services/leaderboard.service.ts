import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface LeaderboardUserDto {
  id: string;
  username: string;
  email: string;
  elo: number;
  country: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private apiUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/leaderboard';

  constructor(private http: HttpClient) {}

  getLeaderboard(): Observable<ApiResponse<LeaderboardUserDto[]>> {
    return this.http.get<ApiResponse<LeaderboardUserDto[]>>(this.apiUrl);
  }
}
