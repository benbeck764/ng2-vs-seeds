import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { ChartsComponent } from "./components/charts/charts.component";
import { RealtimeComponent } from "./components/realtime/realtime.component";
import { DemoComponent } from "./components/demo/demo.component";
import { HeartrateComponent } from "./components/heartrate/heartrate.component";
import { ParentComponent } from "./components/parent/parent.component"; 

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'charts', component: ChartsComponent },
  { path: 'realtime', component: RealtimeComponent },
  { path: 'demo', component: DemoComponent },
  { path: 'heartrate', component: ParentComponent },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
