import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }     from '@angular/http';
import { NgModule } from '@angular/core';

import "rxjs/add/operator/map";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { NavmenuComponent } from './components/navmenu/navmenu.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChartsComponent } from './components/charts/charts.component';
import { RealtimeComponent } from './components/realtime/realtime.component';
import { TaskComponent } from './components/realtime/task/task.component';

import { ChannelService, ChannelConfig, SignalrWindow} from './services/channel.service';

let channelConfig = new ChannelConfig();
channelConfig.url = "http://localhost:56682/signalr";
channelConfig.hubName = "EventHub";

@NgModule({
  declarations: [
    AppComponent,
    NavmenuComponent,
    DashboardComponent,
    ChartsComponent,
    RealtimeComponent,
    TaskComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    AppRoutingModule
  ],
  providers: [
    ChannelService,
    { provide: SignalrWindow, useValue: window },
    { provide: 'channel.config', useValue: channelConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
