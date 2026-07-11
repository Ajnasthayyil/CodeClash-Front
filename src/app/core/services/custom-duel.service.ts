import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSearchResultDto {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
}

export interface CustomDuelRoomDto {
  id: string;
  roomCode: string;
  status: string;
  hostUserId: string;
  hostUsername: string;
  friendUserId: string;
  friendUsername: string;
  isHostReady: boolean;
  isFriendReady: boolean;
  selectedProblemId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomDuelService {
  private apiUrl = `${environment.apiUrl}/customduel`;
  private usersUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  searchUsers(query: string): Observable<UserSearchResultDto[]> {
    return this.http.get<UserSearchResultDto[]>(`${this.usersUrl}/search`, {
      params: { query }
    });
  }

  inviteFriend(hostUserId: string, friendUserId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invite`, { hostUserId, friendUserId });
  }

  acceptInvitation(roomId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/accept`, { roomId });
  }

  declineInvitation(roomId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/decline`, { roomId });
  }

  getRoomDetails(roomId: string): Observable<CustomDuelRoomDto> {
    return this.http.get<CustomDuelRoomDto>(`${this.apiUrl}/${roomId}`);
  }

  setPlayerReady(roomId: string, userId: string, isReady: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ready`, { roomId, userId, isReady });
  }

  startDuel(roomId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/start`, { roomId });
  }
}
