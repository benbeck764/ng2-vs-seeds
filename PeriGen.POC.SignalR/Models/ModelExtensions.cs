using Newtonsoft.Json;

namespace PeriGen.POC.SignalR.Models
{
    public static class ModelExtensions
    {
        public static string ToJson(this object obj)
        {
            return obj == null ? "" : JsonConvert.SerializeObject(obj);
        }
    }
}