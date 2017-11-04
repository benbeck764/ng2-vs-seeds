import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { NavmenuComponent } from './components/navmenu/navmenu.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChartsComponent } from './components/charts/charts.component';

@NgModule({
  declarations: [
    AppComponent,
    NavmenuComponent,
    DashboardComponent,
    ChartsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
