import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface LeaderboardUserDto {
  username: string;
  profileImageUrl: string;
  totalPoints: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private apiUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/leaderboard';

  constructor(private http: HttpClient) {}

  getLeaderboard(): Observable<LeaderboardUserDto[]> {
    return this.http.get<LeaderboardUserDto[]>(this.apiUrl);
  }
}
