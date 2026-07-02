import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { ButtonComponent } from './shared/button/button.component';
import { InputComponent } from './shared/input/input.component';
import { CardComponent } from './shared/card/card.component';
import { ModalComponent } from './shared/modal/modal.component';
import { TableComponent } from './shared/table/table.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { HomeComponent } from './features/home/home.component';
import { HeroSectionComponent } from './features/home/components/hero-section/hero-section.component';
import { FeatureCardsComponent } from './features/home/components/feature-cards/feature-cards.component';
import { StatsComponent } from './features/home/components/stats/stats.component';
import { TestimonialsComponent } from './features/home/components/testimonials/testimonials.component';
import { FooterComponent } from './features/home/components/footer/footer.component';
import { LoginComponent } from './features/auth/login/login.component';
import { LoginFormComponent } from './features/auth/login/components/login-form/login-form.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { RegisterFormComponent } from './features/auth/register/components/register-form/register-form.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { OTPVerificationComponent } from './features/auth/otp/otp-verification.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MatchmakingComponent } from './features/matchmaking/matchmaking.component';
import { CodingArenaComponent } from './features/coding-arena/coding-arena.component';
import { LeaderboardComponent } from './features/leaderboard/leaderboard.component';
import { TournamentComponent } from './features/tournament/tournament.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminComponent } from './features/admin/admin.component';
import { ProblemsComponent } from './features/problems/problems.component';
import { MarketComponent } from './features/market/market.component';
import { PracticeArenaComponent } from './features/practice-arena/practice-arena.component';
import { NotificationBellComponent } from './shared/notifications/notification-bell/notification-bell.component';
import { NotificationListComponent } from './shared/notifications/notification-list/notification-list.component';
import { ToastComponent } from './shared/notifications/toast/toast.component';
import { MatchResultComponent } from './features/matchmaking/match-result/match-result.component';
import { DashboardAnalyticsComponent } from './features/admin/dashboard-analytics/dashboard-analytics.component';
import { UserManagementComponent } from './features/admin/user-management/user-management.component';
import { ContestManagementComponent } from './features/admin/contest-management/contest-management.component';
import { SubmissionMonitorComponent } from './features/admin/submission-monitor/submission-monitor.component';
import { AdminProfileComponent } from './features/admin/profile/admin-profile.component';
import { PageNotFoundComponent } from './shared/page-not-found/page-not-found.component';
import { AiAnalysisComponent } from './features/ai-analysis/ai-analysis.component';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { AuthSuccessComponent } from './features/auth/auth-success/auth-success.component';

export function initializeApp(authService: AuthService) {
  return () => new Promise<void>((resolve) => {
    authService.refresh().subscribe({
      next: () => resolve(),
      error: () => resolve()
    });
  });
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    SidebarComponent,
    ButtonComponent,
    InputComponent,
    CardComponent,
    ModalComponent,
    TableComponent,
    MainLayoutComponent,
    AuthLayoutComponent,
    HomeComponent,
    HeroSectionComponent,
    FeatureCardsComponent,
    StatsComponent,
    TestimonialsComponent,
    FooterComponent,
    LoginComponent,
    LoginFormComponent,
    RegisterComponent,
    RegisterFormComponent,
    ForgotPasswordComponent,
    OTPVerificationComponent,
    DashboardComponent,
    MatchmakingComponent,
    CodingArenaComponent,
    LeaderboardComponent,
    TournamentComponent,
    ProfileComponent,
    AdminComponent,
    ProblemsComponent,
    MarketComponent,
    PracticeArenaComponent,
    NotificationBellComponent,
    NotificationListComponent,
    ToastComponent,
    MatchResultComponent,
    DashboardAnalyticsComponent,
    UserManagementComponent,
    ContestManagementComponent,
    SubmissionMonitorComponent,
    AdminProfileComponent,
    PageNotFoundComponent,
    AiAnalysisComponent,
    AuthSuccessComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
