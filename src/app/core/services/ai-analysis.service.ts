import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiAnalysisResponse {
  summary: string;
  mistake: string | null;
  hint: string;
  optimization: string;
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
  codeQualityScore: number;
  readabilityScore: number;
  bestPractices: string[];
  learningResources: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiAnalysisService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  analyzeSubmission(submissionId: string): Observable<AiAnalysisResponse> {
    return this.http.post<AiAnalysisResponse>(`${this.apiUrl}/ai/analyze`, { submissionId });
  }
}
