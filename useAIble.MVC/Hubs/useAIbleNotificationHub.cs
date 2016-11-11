using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using useAIble.MVC.Models;
using useAIble.Core.Models;
using useAIble.Core.IoC;
using useAIble.Core.Contracts;
using useAIble.Core.Contracts.Repositories;

namespace useAIble.MVC.Hubs
{
    [HubName("useAIbleNotificationHub")]
    public class useAIbleNotificationHub : Hub
    {
        public static ConcurrentDictionary<string, string> hubUsers = new ConcurrentDictionary<string, string>();
        public static ConcurrentDictionary<string, string> hubUserGroups = new ConcurrentDictionary<string, string>();

        private readonly IOrganizationRepository org;
        private readonly IUserRepository user;

        public useAIbleNotificationHub()
        {
            org = Ioc.Get<IOrganizationRepository>();
            user = Ioc.Get<IUserRepository>();
        }

        public Task JoinOrganization(string org)
        {          
            return Groups.Add(Context.ConnectionId, org);
        }

        public Task RemoveOrganization(string connID, string org)
        {
            return Groups.Remove(connID, org);
        }

        public void NotifyAll(string message, string type)
        {
            Clients.All.useAIbleNotification(message,type);
        }

        public void ProgressOrg(string databaseName, string id, double valueDecimal, string text) //ProgressVM progress)
        {
            var o = org.GetOrganizationByDbName(databaseName);
            if (o != null)
            {
                Clients.Group(o.Name).progress(new ProgressVM() { Id = id, ValueDecimal = valueDecimal, Text = text });
                //System.Diagnostics.Debug.WriteLine("progress for {0}: Id - {1}, Value: {2}, Text: {3)", o.Name, progress.Id, progress.ValueDecimal, progress.Text);
                System.Diagnostics.Debug.WriteLine("progress for {0}: Id: {1}, Value: {2}, Text: {3})", o.Name, id, valueDecimal, text);
            }
        }

        public void ProgressUser(int userId, string id, double valueDecimal, string text) //ProgressVM progress)
        {
            var u = user.GetById(userId);
            string connId;
            if (u != null)
            {
                if (hubUsers.TryGetValue(u.Username, out connId))
                {
                    Clients.Client(connId).progress(new ProgressVM() { Id = id, ValueDecimal = valueDecimal, Text = text });
                }
            }
        }

        public void UpdateChart()
        {
            Clients.All.getChartData("");
        }

        //public void Progress(int id, ProgressVM progress, dynamic result, bool toOrg = true)
        //{
        //    if (toOrg)
        //    {
        //        var o = org.GetById(id);
        //        //var group = org.GetById(id).Name;
        //        if (o != null)
        //        {
        //            Clients.Group(o.Name).progress(progress, result);
        //        }
        //    }
        //    else
        //    {
        //        var u = user.GetById(id);
        //        string connId;
        //        if (u != null)
        //        {
        //            if (hubUsers.TryGetValue(u.Username, out connId))
        //            {
        //                Clients.Client(connId).progress(progress, result);
        //            }
        //        }
        //    }
        //}

        public void NotifyAllUsersInOrg(string databaseName, string message, string type)
        {
            var o = org.GetOrganizationByDbName(databaseName);
            if (o != null)
            {
                Clients.Group(o.Name).useAIbleNotification(message, type);
                System.Diagnostics.Debug.WriteLine("notification for {0}: Message: {1}, Type: {2}", o.Name, message, type);
            }
        }

        public void NotifyUser(int userId, string message, string type)
        {
            var u = user.GetById(userId);
            string connId;
            if (u != null)
            {
                if (hubUsers.TryGetValue(u.Username, out connId))
                {
                    Clients.Client(connId).useAIbleNotification(message, type);
                }
            }

        }

        public void NotifyUsers(List<int> userIDs, string message, string type)
        {
            var list = new List<string>();
            foreach (int s in userIDs)
            {
                var u = user.GetById(s);
                list.Add(u.Username);
            }

            var connIDs = new List<string>();
            foreach (var item in list)
            {
                string connID;
                hubUsers.TryGetValue(item, out connID);
                connIDs.Add(connID);
            }

            Clients.Clients(connIDs).useAIbleNotification(message, type);
        }

        public override Task OnConnected()
        {
            if (!String.IsNullOrEmpty(Context.User.Identity.Name))
            {
                hubUsers.TryAdd(Context.User.Identity.Name, Context.ConnectionId);

                var userGroups = user.GetByUsernameDetailed(Context.User.Identity.Name);
                foreach (var g in userGroups.Organizations)
                {
                    JoinOrganization(g.Name);
                }
            }
            return base.OnConnected();
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            string key = "";

            hubUsers.TryRemove(Context.User.Identity.Name, out key);
            var userGroups = user.GetByUsernameDetailed(Context.User.Identity.Name);
            if (userGroups != null)
            {
                foreach (var g in userGroups.Organizations)
                {
                    RemoveOrganization(Context.ConnectionId, g.Name);
                }
            }

            return base.OnDisconnected(stopCalled);
        }

        public override Task OnReconnected()
        {
            string connectionId;
            if (!hubUsers.TryGetValue(Context.ConnectionId, out connectionId))
            {
                hubUsers.TryAdd(Context.User.Identity.Name, Context.ConnectionId);
            }
            return base.OnReconnected();
        }


    }
}