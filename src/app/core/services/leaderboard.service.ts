import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LeaderboardUserDto {
  id: string;
  username: string;
  totalPoints: number;
  rating: number;
  favLanguage: string;
  battles: number;
  wins: number;
  losses: number;
}

export interface MyStatsDto {
  id: string;
  username: string;
  totalPoints: number;
  rating: number;
  rank: number;
  totalPlayers: number;
  battles: number;
  wins: number;
  losses: number;
  favLanguage: string;
  languageBreakdown: { [lang: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private apiUrl = `${environment.apiUrl}/leaderboard`;

  constructor(private http: HttpClient) {}

  getLeaderboard(language?: string, scope?: string): Observable<LeaderboardUserDto[]> {
    let params = new HttpParams();
    if (language && language !== 'All') params = params.set('language', language.toLowerCase());
    if (scope) params = params.set('scope', scope);
    return this.http.get<LeaderboardUserDto[]>(this.apiUrl, { params });
  }

  getMyStats(): Observable<MyStatsDto> {
    return this.http.get<MyStatsDto>(`${this.apiUrl}/me`);
  }

  getRecentBattles(): Observable<LeaderboardUserDto[]> {
    return this.http.get<LeaderboardUserDto[]>(`${this.apiUrl}/recent-battles`);
  }
}
