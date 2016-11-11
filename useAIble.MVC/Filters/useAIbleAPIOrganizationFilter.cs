using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Http.Filters;
using System.Net.Http;
using useAIble.Core.Exceptions;
using useAIble.MVC.Api;
using useAIble.Core.IoC;
using useAIble.Core.Contracts;
using useAIble.Core.Contracts.Repositories;

namespace useAIble.MVC.Filters
{
    public class useAIbleAPIOrganizationFilter : ActionFilterAttribute
    {
        public override void OnActionExecuting(System.Web.Http.Controllers.HttpActionContext actionContext)
        {
            var arg = actionContext.ActionArguments.FirstOrDefault(a => a.Key == "orgId" && a.Value is Int32);
            if (arg.Key != null)
            {
                int orgId = Convert.ToInt32(arg.Value);
                string databaseName = null;
                if (!CachedData.OrganizationDBNames.TryGetValue(orgId, out databaseName))
                {
                    var orgRepo = Ioc.Get<IOrganizationRepository>();
                    var org = orgRepo.GetById(orgId);
                    if (org == null)
                    {
                        throw new HttpResponseException(actionContext.Request.CreateErrorResponse(System.Net.HttpStatusCode.NotFound, new DoesNotExistException("The organization ID does not exist")));
                    }
                    else
                    {
                        CachedData.OrganizationDBNames.Add(new KeyValuePair<int, string>(orgId, org.DatabaseName));
                    }
                }

                var controller = actionContext.ControllerContext.Controller as BaseApiController;
                if (controller != null)
                {
                    controller.CurrentOrgDbName = databaseName;
                }
            }

            // temporary para ra sa users
            var userArg = actionContext.ActionArguments.FirstOrDefault(a => a.Key == "userId" && a.Value is Int32);
            if (userArg.Key != null)
            {
                int userId = Convert.ToInt32(userArg.Value);
                useAIble.Core.Models.User user = null;
                if (!CachedData.OrganizationUsers.TryGetValue(userId, out user))
                {
                    var userRepo = Ioc.Get<IUserRepository>();
                    user = userRepo.GetById(userId);
                    if (user == null)
                    {
                        throw new HttpResponseException(actionContext.Request.CreateErrorResponse(System.Net.HttpStatusCode.NotFound, new DoesNotExistException("The user ID does not exist")));
                    }
                    else
                    {
                        CachedData.OrganizationUsers.Add(new KeyValuePair<int, Core.Models.User>(userId, user));
                    }
                }

                var controller = actionContext.ControllerContext.Controller as BaseApiController;
                if (controller != null)
                {
                    controller.CurrentUser = user;
                }
            }
            else
            {
                // for actual api to set user principal            
                if (actionContext.RequestContext.Principal != null)
                {
                    var baseController = actionContext.ControllerContext.Controller as BaseApiController;
                    baseController.CurrentUser = actionContext.RequestContext.Principal as Core.Models.User;
                }
            }

            base.OnActionExecuting(actionContext);
        }
    }
}