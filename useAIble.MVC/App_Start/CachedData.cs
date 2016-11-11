using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using useAIble.Core.Contracts;
using useAIble.Core.Contracts.Repositories;
using useAIble.Core.IoC;
using useAIble.Core.Models;

namespace useAIble.MVC
{
    public static class CachedData
    {
        public static void Init()
        {
            OrganizationDBNames = new Dictionary<int, string>();

            var orgRepo = Ioc.Get<IOrganizationRepository>();
            var orgs = orgRepo.Get();
            if (orgs != null)
            {
                OrganizationDBNames = orgs.ToDictionary(a => a.Id, a => a.DatabaseName);
            }

            // temp for users
            OrganizationUsers = new Dictionary<int, User>();

            var userRepo = Ioc.Get<IUserRepository>();
            var users = userRepo.Get();
            if (users != null)
            {
                OrganizationUsers = users.ToDictionary(a => a.Id, a => a);
            }
        }

        public static IDictionary<int, string> OrganizationDBNames { get; set; }
        public static IDictionary<int, User> OrganizationUsers { get; set; }
    }
}