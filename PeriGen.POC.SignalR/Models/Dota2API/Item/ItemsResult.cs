using System.Collections.Generic;
using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models.Dota2API.Item
{
    public class ItemsResult
    {
        [JsonProperty("items")]
        public List<Dota2API.Item.Item> Items { get; set; }
    }
}
