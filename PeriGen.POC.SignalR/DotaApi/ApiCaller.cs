using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using PeriGen.POC.SignalR.Hub;
using PeriGen.POC.SignalR.Models.Dota2API.MatchHistory;

namespace PeriGen.POC.SignalR.DotaApi
{
    public static class ApiCaller
    {
        private static readonly IHubContext Context;
        private const string Channel = "TestChannel";

        static ApiCaller()
        {
            Context = GlobalHost.ConnectionManager.GetHubContext<EventHub>();
        }

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

        public static async Task GetMatches()
        {
            //var apiUrlMatchHistory = MatchHistoryUri + $"?key={DevKey}" + $"&format={Format}" + $"&account_id={AccountId}" + $"&matches_requested={100}" + $"start_at_match_id={matchId}";
            var apiUrlBensApi = "http://ben-test-api.azurewebsites.net/api/matches";
            var requestMatchHistory = HttpManager.InitHttpRequest(HttpMethod.Get, null, apiUrlBensApi);
            var responseMatchHistory = await HttpManager.SendRequest(requestMatchHistory);
            var jsonResultMatchHistory = await HttpManager.GetResult(responseMatchHistory);

            var matches = JsonConvert.DeserializeObject<List<MatchHistoryMatch>>(jsonResultMatchHistory).OrderBy(m => m.MatchId).ToList();

            for (var i = 0; i < matches.Count; i = i + 50)
            {
                var takenMatches = matches.Skip(i).Take(50);
                Context.Clients.Group(Channel).OnEvent("TestChannel", new ChannelEvent
                {
                    ChannelName = "TestChannel",
                    Name = "Dota2MatchDetails",
                    Data = takenMatches
                });
                System.Threading.Thread.Sleep(3000);
            }
        }
    }
}