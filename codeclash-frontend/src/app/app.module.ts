import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MatchmakingComponent } from './features/matchmaking/matchmaking.component';
import { CodingArenaComponent } from './features/coding-arena/coding-arena.component';
import { LeaderboardComponent } from './features/leaderboard/leaderboard.component';
import { TournamentComponent } from './features/tournament/tournament.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminComponent } from './features/admin/admin.component';

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
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    MatchmakingComponent,
    CodingArenaComponent,
    LeaderboardComponent,
    TournamentComponent,
    ProfileComponent,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
