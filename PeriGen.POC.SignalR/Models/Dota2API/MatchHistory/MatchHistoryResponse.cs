using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.MatchHistory
{
    public class MatchHistoryResponse
    {
        [JsonProperty("result")]
        public MatchHistoryResult Result { get; set; }
    }
}
