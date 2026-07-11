import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    const token = this.authService.getAccessToken();
    
    if (token) {
      authReq = this.addTokenHeader(req, token);
    }

    return next.handle(authReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/refresh')) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    const currentToken = this.authService.getAccessToken();
    const requestToken = request.headers.get('Authorization')?.replace('Bearer ', '');

    // If the current token in the authService is already different from the one used in the failed request,
    // it means another request has already successfully refreshed the token. Just retry with the new token.
    if (currentToken && requestToken && currentToken !== requestToken) {
      return next.handle(this.addTokenHeader(request, currentToken));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refresh().pipe(
        switchMap((res) => {
          this.isRefreshing = false;
          
          if (res && res.success && res.data?.accessToken) {
            const accessToken = res.data.accessToken;
            this.refreshTokenSubject.next(accessToken);
            return next.handle(this.addTokenHeader(request, accessToken));
          }

          // If refresh token fails to get new token
          this.authService.clearSession();
          this.router.navigate(['/auth/login']);
          return throwError(() => new Error('Session expired. Please log in again.'));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.clearSession();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }
}
