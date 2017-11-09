using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
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

        public static async Task<List<MatchHistoryMatch>> GetMatches()
        {
            var utcNow = DateTimeOffset.UtcNow;
            var utcOneDayAgo = DateTimeOffset.UtcNow.AddDays(-1);
            var start = utcOneDayAgo.ToUnixTimeMilliseconds();
            var end = utcNow.ToUnixTimeMilliseconds();

            var apiUrlMatchHistory = MatchHistoryUri + $"?key={DevKey}" + $"&format={Format}" + $"&date_min={start}" + $"&date_max={end}";
            var requestMatchHistory = HttpManager.InitHttpRequest(HttpMethod.Get, null, apiUrlMatchHistory);
            var responseMatchHistory = await HttpManager.SendRequest(requestMatchHistory);
            var jsonResultMatchHistory = await HttpManager.GetResult(responseMatchHistory);

            var matchHistoryResponse = JsonConvert.DeserializeObject<MatchHistoryResponse>(jsonResultMatchHistory);

            return matchHistoryResponse.Result.Matches;
        }
    }
}