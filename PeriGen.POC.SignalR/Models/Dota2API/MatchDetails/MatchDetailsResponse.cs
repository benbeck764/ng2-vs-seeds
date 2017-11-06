using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.MatchDetails
{
    public class MatchDetailsResponse
    {
        [JsonProperty("result")]
        public MatchDetailsResult Result { get; set; }
    }
}
