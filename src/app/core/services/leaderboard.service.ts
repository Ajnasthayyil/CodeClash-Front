import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface LeaderboardUserDto {
  username: string;
  profileImageUrl: string;
  totalPoints: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private apiUrl = `${environment.apiUrl}/leaderboard`;

  constructor(private http: HttpClient) {}

  getLeaderboard(): Observable<LeaderboardUserDto[]> {
    return this.http.get<LeaderboardUserDto[]>(this.apiUrl);
  }
}
