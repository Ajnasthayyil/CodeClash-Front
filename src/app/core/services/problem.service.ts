import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface ProblemSummaryDto {
  problemId: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  isActive: boolean;
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface TestCaseDto {
  id: string;
  input: string | null;
  expectedOutput: string | null;
  isHidden: boolean;
  orderIndex: number;
}

export interface ProblemDetailDto {
  problemId: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  statementMarkdown: string;
  constraints: string[];
  allowedLanguages: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  testCases: TestCaseDto[];
}

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProblemService {
  private apiUrl = 'https://codeclash-ccf0fvekfsfedham.southindia-01.azurewebsites.net/api/v1/problems';

  constructor(private http: HttpClient) {}

  getProblems(
    pageNumber: number = 1,
    pageSize: number = 20,
    difficulty?: string,
    category?: string,
    search?: string
  ): Observable<ApiResponse<PaginatedList<ProblemSummaryDto>>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (difficulty && difficulty !== 'All') {
      params = params.set('difficulty', difficulty);
    }
    if (category && category !== 'All') {
      params = params.set('category', category);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ApiResponse<PaginatedList<ProblemSummaryDto>>>(this.apiUrl, { params });
  }

  getProblemById(problemId: string): Observable<ApiResponse<ProblemDetailDto>> {
    return this.http.get<ApiResponse<ProblemDetailDto>>(`${this.apiUrl}/${problemId}`);
  }

  createProblem(payload: any): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.apiUrl, payload);
  }

  updateProblem(problemId: string, payload: any): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/${problemId}`, payload);
  }

  toggleProblemStatus(problemId: string): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${problemId}/toggle-status`, {});
  }

  deleteProblem(problemId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${problemId}`);
  }
}
