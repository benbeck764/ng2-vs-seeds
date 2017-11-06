using System.Collections.Generic;
using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.MatchHistory
{
    public class MatchHistoryMatch
    {
        [JsonProperty("matchId")]
        public long MatchId { get; set; }
        [JsonProperty("matchSeqNum")]
        public long MatchSeqNum { get; set; }
        [JsonProperty("lobbyType")]
        public int LobbyType { get; set; }
        [JsonProperty("radiantTeamId")]
        public int RadiantTeamId { get; set; }
        [JsonProperty("direTeamId")]
        public int DireTeamId { get; set; }
        [JsonProperty("players")]
        public List<MatchHistoryPlayer> Players { get; set; }

    }
}
