using System.Threading.Tasks;
using System.Web.Http;
using PeriGen.POC.SignalR.DotaApi;

namespace PeriGen.POC.SignalR.Controllers
{
    [RoutePrefix("api/matches")]
    public class MatchesController : ApiController
    { 
        [Route("latestmatches")]
        [HttpGet]
        public async Task<IHttpActionResult> GetLastTenSecondsOfMatches()
        {
            await ApiCaller.GetMatches();
            return Ok();
        }
    }
}