import { Injectable } from '@angular/core';
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";

export class Player {
  account_id: number;
  player_slot: number;
  hero_id: number;
}

export class Match {
  match_id: number;
  match_seq_num: number;
  lobby_type: number;
  radiant_team_id: number;
  dire_team_id: number;
  players: Player[];
}

@Injectable()
export class MatchesService {

  private getLatestMatchesUri: string = "http://localhost:56682/api/matches/latestmatches";

  constructor(private _http: Http) { }

  getLatestMatches(): Observable<Response> {
    return this._http.get(this.getLatestMatchesUri);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
