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
            var matches = await ApiCaller.GetMatches();
            //foreach (var match in matches)
            //{
            //    _context.Clients.Group(Channel).OnEvent("TestChannel", new ChannelEvent
            //    {
            //        ChannelName = "TestChannel",
            //        Name = "Dota2MatchDetails",
            //        Data = match
            //    });
            //}

            // TODO -- Batch these or send individually via socket!?
            _context.Clients.Group(Channel).OnEvent("TestChannel", new ChannelEvent
            {
                ChannelName = "TestChannel",
                Name = "Dota2MatchDetails",
                Data = matches
            });

            return Ok();
        }
    }
}