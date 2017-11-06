using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.Hero
{
    public class HeroesResponse
    {
        [JsonProperty("result")]
        public HeroesResult Result { get; set; }
    }
}
