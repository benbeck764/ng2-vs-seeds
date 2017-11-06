using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.MatchHistory
{
    public class MatchHistoryPlayer
    {
        [JsonProperty("accountId")]
        public long AccountId { get; set; }
        [JsonProperty("playerSlot")]
        public int PlayerSlot { get; set; }
        [JsonProperty("heroId")]
        public int HeroId { get; set; }
    }
}
