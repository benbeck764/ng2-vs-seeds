import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }     from '@angular/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app/app.component';
import { NavmenuComponent } from './components/navmenu/navmenu.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChartsComponent } from './components/charts/charts.component';
import { RealtimeComponent } from './components/realtime/realtime.component';
import { TaskComponent } from './components/realtime/task/task.component';
import { DemoComponent } from './components/demo/demo.component';

import { ChannelService, ChannelConfig, SignalrWindow} from './services/channel.service';
import { MatchesService } from './services/matches.service';
import { DataStorageService } from "./services/data-storage.service";

import { HeartrateComponent } from './components/heartrate/heartrate.component';
import { TimesliderComponent } from './components/timeslider/timeslider.component';
import { ParentComponent } from './components/parent/parent.component';
import { StorageComponent } from './components/storage/storage.component';
import { SliderHoverDirective } from './directives/slider-hover.directive';

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
    TaskComponent,
    DemoComponent,
    HeartrateComponent,
    TimesliderComponent,
    ParentComponent,
    StorageComponent,
    SliderHoverDirective
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    ChannelService,
    { provide: SignalrWindow, useValue: window },
    { provide: 'channel.config', useValue: channelConfig },
    MatchesService,
    DataStorageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
