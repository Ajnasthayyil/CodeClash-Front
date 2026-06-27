import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { OTPVerificationComponent } from './features/auth/otp/otp-verification.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CodingArenaComponent } from './features/coding-arena/coding-arena.component';
import { ProfileComponent } from './features/profile/profile.component';
import { LeaderboardComponent } from './features/leaderboard/leaderboard.component';
import { ProblemsComponent } from './features/problems/problems.component';
import { MarketComponent } from './features/market/market.component';
import { PracticeArenaComponent } from './features/practice-arena/practice-arena.component';
import { MatchmakingComponent } from './features/matchmaking/matchmaking.component';
import { TournamentComponent } from './features/tournament/tournament.component';
import { MatchResultComponent } from './features/matchmaking/match-result/match-result.component';
import { AdminComponent } from './features/admin/admin.component';
import { DashboardAnalyticsComponent } from './features/admin/dashboard-analytics/dashboard-analytics.component';
import { UserManagementComponent } from './features/admin/user-management/user-management.component';
import { ContestManagementComponent } from './features/admin/contest-management/contest-management.component';
import { SubmissionMonitorComponent } from './features/admin/submission-monitor/submission-monitor.component';
import { AdminProfileComponent } from './features/admin/profile/admin-profile.component';
import { PageNotFoundComponent } from './shared/page-not-found/page-not-found.component';
import { AiAnalysisComponent } from './features/ai-analysis/ai-analysis.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'leaderboard', component: LeaderboardComponent },
      { path: 'problems', component: ProblemsComponent },
      { path: 'market', component: MarketComponent },
      { path: 'arena', component: MatchmakingComponent },
      { path: 'arena/battle', component: CodingArenaComponent },
      { path: 'arena/result', component: MatchResultComponent },
      { path: 'arena/analysis', component: AiAnalysisComponent },
      { path: 'problems/solve/:id', component: PracticeArenaComponent },
      { path: 'tournament', component: TournamentComponent },
      {
        path: 'admin',
        component: AdminComponent,
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardAnalyticsComponent },
          { path: 'users', component: UserManagementComponent },
          { path: 'contests', component: ContestManagementComponent },
          { path: 'submissions', component: SubmissionMonitorComponent },
          { path: 'profile', component: AdminProfileComponent }
        ]
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'otp', component: OTPVerificationComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
