import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from './auth.service';

// ── Request / Response DTOs (matches backend ChatRequest & ChatResponse) ──────
export interface ChatRequest {
  message: string;
  problemId?: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  sourcesUsed?: string[];
}

export interface ChatMessageDto {
  id?: string;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  sourcesUsed?: string[];
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly base = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/chatbot';

  constructor(private http: HttpClient) {}

  /**
   * POST /api/v1/chatbot/message
   * Send a message and get a RAG-powered reply.
   */
  sendMessage(req: ChatRequest): Observable<ChatResponse> {
    return this.http
      .post<ApiResponse<ChatResponse>>(`${this.base}/message`, req)
      .pipe(map(res => res.data as ChatResponse));
  }

  /**
   * GET /api/v1/chatbot/history/{sessionId}
   * Retrieve chat history for a given session.
   */
  getHistory(sessionId: string, limit = 50): Observable<ChatMessageDto[]> {
    return this.http
      .get<ApiResponse<ChatMessageDto[]>>(`${this.base}/history/${sessionId}?limit=${limit}`)
      .pipe(map(res => res.data as ChatMessageDto[]));
  }
}
