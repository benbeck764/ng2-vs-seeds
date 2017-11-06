using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.Item
{
    public class ItemsResponse
    {
        [JsonProperty("result")]
        public ItemsResult Result { get; set; }
    }
}
