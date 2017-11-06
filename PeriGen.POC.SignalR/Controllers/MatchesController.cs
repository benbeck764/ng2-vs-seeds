using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using Microsoft.AspNet.SignalR;
using PeriGen.POC.SignalR.DotaApi;
using PeriGen.POC.SignalR.Hub;

namespace PeriGen.POC.SignalR.Controllers
{
    [RoutePrefix("api/matches")]
    public class MatchesController : ApiController
    {
        private readonly IHubContext _context;
        private const string Channel = "TestChannel";

        public MatchesController()
        {
            _context = GlobalHost.ConnectionManager.GetHubContext<EventHub>();
        }

        [Route("latestmatches")]
        [HttpGet]
        public async Task<IHttpActionResult> GetLastTenSecondsOfMatches()
        {
            for (var i = 0; i < 10; i++)
            {
                var matches = await ApiCaller.GetLastTenSecondsOfMatches();
                foreach (var match in matches)
                {
                    _context.Clients.Group(Channel).OnEvent("TestChannel", new ChannelEvent
                    {
                        ChannelName = "TestChannel",
                        Name = "Dota2MatchDetails",
                        Data = match
                    });
                }

                Thread.Sleep(1000);
            }

            return Ok();
        }
    }
}