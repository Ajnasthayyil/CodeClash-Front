import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface SubmissionSummary {
  id: string;
  userName: string;
  problemTitle: string;
  language: string;
  status: string;
  executionTimeMs?: number;
  memoryUsedBytes?: number;
  createdAt: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SubmissionResponseDto {
  submissionId: string;
  status: string;
  passed: number;
  total: number;
  executionTime: number;
  memory: number;
  testCases: any[];
  compileOutput?: string;
}

export interface Result<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionsService {
  private apiUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/submissions';

  constructor(private http: HttpClient) {}

  getSubmissions(pageNumber: number = 1, pageSize: number = 20, search?: string): Observable<PaginatedList<SubmissionSummary>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedList<SubmissionSummary>>(this.apiUrl, { params });
  }

  submitCode(problemId: string, language: string, sourceCode: string): Observable<Result<SubmissionResponseDto>> {
    const payload = {
      problemId,
      language,
      sourceCode
    };
    return this.http.post<Result<SubmissionResponseDto>>(this.apiUrl, payload, { withCredentials: true });
  }
}
