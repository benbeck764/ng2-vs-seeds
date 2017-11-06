using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PeriGen.POC.SignalR.Models;
using PeriGen.POC.SignalR.Models.Dota2API.Hero;
using PeriGen.POC.SignalR.Models.Dota2API.Item;
using PeriGen.POC.SignalR.Models.Dota2API.MatchDetails;
using PeriGen.POC.SignalR.Models.Dota2API.MatchHistory;

namespace PeriGen.POC.SignalR.DotaApi
{
    public static class ApiCaller
    {
        public static string DevKey { get; } = "F99837D4DF07828F1C85C71700B0F9BD";
        public static string AccountId { get; } = "111871881";
        public static int NumHeroes { get; } = 112;
        public static string Format { get; } = "JSON";
        public static string Language { get; } = "en";

        public static string MatchHistoryUri { get; } = "https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v001/";
        public static string MatchDetailsUri { get; } = "https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v001/";
        public static string HeroesInfoUri { get; } = "https://api.steampowered.com/IEconDOTA2_570/GetHeroes/v1/";
        public static string ItemsInfoUri { get; } = "http://api.steampowered.com/IEconDOTA2_570/GetGameItems/v1";

        public static string HeroImagesUri { get; } = "http://cdn.dota2.com/apps/dota2/images/heroes/";
        public static string ItemImagesUri { get; } = "http://cdn.dota2.com/apps/dota2/images/items/";

        public static async Task<List<MatchHistoryMatch>> GetLastTenSecondsOfMatches()
        {
            var utcNow = DateTimeOffset.UtcNow;
            var utcTenSecondsAgo = DateTimeOffset.UtcNow.AddSeconds(-10);
            var start = utcTenSecondsAgo.ToUnixTimeSeconds();
            var end = utcNow.ToUnixTimeSeconds();

            var apiUrlMatchHistory = MatchHistoryUri + $"?key={DevKey}" + $"&format={Format}" + $"&date_min={start}" + $"&date_max={end}";
            var requestMatchHistory = HttpManager.InitHttpRequest(HttpMethod.Get, null, apiUrlMatchHistory);
            var responseMatchHistory = await HttpManager.SendRequest(requestMatchHistory);
            var jsonResultMatchHistory = await HttpManager.GetResult(responseMatchHistory);

            var matchHistoryResponse = JsonConvert.DeserializeObject<MatchHistoryResponse>(jsonResultMatchHistory);

            return matchHistoryResponse.Result.Matches;
        }
    }
}