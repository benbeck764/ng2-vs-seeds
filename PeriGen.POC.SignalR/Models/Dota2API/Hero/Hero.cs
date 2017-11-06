using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.Hero
{
    public class Hero
    {
        [JsonProperty("id")]
        public int Id { get; set; }
        [JsonProperty("name")]
        public string Name { get; set; }
        [JsonProperty("localized_name")]
        public string LocalizedName { get; set; }
    }
}
