import { Injectable } from '@angular/core';
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";

export class Player {
  accountId: number;
  playerSlot: number;
  heroId: number;
}

export class Match {
  matchId: number;
  matchSeqNum: number;
  lobbyType: number;
  radiantTeamId: number;
  direTeamId: number;
  players: Player[];
}

@Injectable()
export class MatchesService {

  private getLatestMatchesUri: string = "http://localhost:56682/api/matches/latestmatches";

  constructor(private _http: Http) {
    
  }

  getLatestMatches(): Observable<Match[]> {
    return this._http.get(this.getLatestMatchesUri)
      .map(matches => matches.json() as Match[])
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
