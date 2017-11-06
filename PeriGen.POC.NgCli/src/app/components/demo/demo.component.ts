import { Component, OnInit } from '@angular/core';
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { ChannelService, ConnectionState, ChannelEvent } from "../../services/channel.service";
import { MatchesService, Match, Player } from "../../services/matches.service";

@Component({
  selector: 'pg-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit {

  connectionState$: Observable<string>;
  private channel: string = "TestChannel";
  private eventName: string = "Dota2MatchDetails";
  private jsonMatches: string = "";

  constructor(private _channelService: ChannelService, private _matchesService: MatchesService) {
    this.connectionState$ = this._channelService.connectionState$
      .map((state: ConnectionState) => { return ConnectionState[state]; });

    this._channelService.error$.subscribe(
      (error: any) => { console.warn(error); },
      (error: any) => { console.error("errors$ error", error); }
    );

    this._channelService.starting$.subscribe(
      () => { console.log("signalr service has been started"); },
      () => { console.warn("signalr service failed to start!"); }
    );
  }

  ngOnInit() {
    // Start the SignalR connection
    this._channelService.start();

    this._channelService.sub(this.channel).subscribe(
      (x: ChannelEvent) => {
        switch (x.Name) {
          case this.eventName: { this.handleEvent(x); }
        }
      },
      (error: any) => {
        console.warn("Attempt to join channel failed!", error);
      }
    );

    this._matchesService.getLatestMatches()
      .subscribe((matches: Match[]) => { matches.forEach(match => {
        console.log(match);
      });
    });
  }

  handleEvent(event: ChannelEvent) {
    let date = new Date();
    if (event && event.Data && event.Data !== "") {
      console.log(JSON.stringify(event.Data.toString()));
      this.jsonMatches = `${date.toLocaleTimeString()} : ${JSON.stringify(event.Data)}\n` + this.jsonMatches;
    }   
  }
}
