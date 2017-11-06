using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.MatchDetails
{
    public class MatchDetailsAbility
    {
        [JsonProperty("ability")]
        public int AbilityId { get; set; }
        [JsonProperty("time")]
        public int Time { get; set; }
        [JsonProperty("level")]
        public int Level { get; set; }
    }
}
