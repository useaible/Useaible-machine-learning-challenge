using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Principal;
using System.Web;
using System.Web.Http;
using useAIble.Core.Contracts;
using useAIble.Core.IoC;
using useAIble.Core.Models;
using useAIble.Core.Utility;
using useAIble.MVC.Models;
using System.Web.Http.Controllers;
using System.Net;
using System.Diagnostics.Contracts;
using useAIble.Core.Exceptions;
using useAIble.Core.Contracts.Repositories;

namespace useAIble.MVC.Filters
{
    public class useAIbleAPIAuthorize : AuthorizeAttribute
    {
        const string Scheme = "Basic";

        private List<useAIbleRole> roles { get; set; }

        public useAIbleAPIAuthorize(params useAIbleRole[] roles)
        {
            this.roles = new List<useAIbleRole>();
            if (roles != null && roles.Count() > 0)
            {
                this.roles.AddRange(roles);
            }
        }

        public override void OnAuthorization(System.Web.Http.Controllers.HttpActionContext actionContext)
        {
            // for AllowAnonymous attribute
            if (SkipAuthorization(actionContext))
            {
                return;
            }

            // for errors in authentication, if any
            HttpErrorVM httpError = null;

            if (actionContext.Request.Headers.Authorization != null)
            {
                var authObj = actionContext.Request.Headers.Authorization;
                if (authObj.Scheme == Scheme)
                {
                    var sessionRepo = Ioc.Get<ISessionRepository>();
                    try
                    {
                        useAIbleSession session = useAIbleWebSession.Get(authObj.Parameter); //sessionRepo.GetById(authObj.Parameter);
                        if (session != null)
                        {
                            var userRepo = Ioc.Get<IUserRepository>();
                            User user = userRepo.GetById(session.UserId); // TODO cache this to improve performance
                            
                            // check for request authorization
                            if (roles.Count != 0 && !user.SystemAdmin)
                            {
                                var userRoles = new List<useAIbleRole>();

                                if (user.OrganizationAdmin)
                                {
                                    userRoles.Add(useAIbleRole.OrganizationAdmin);
                                }

                                // todo we might add more roles

                                bool isAuthorized = false;
                                foreach (var role in userRoles)
                                {
                                    if (roles.Any(a => a == role))
                                    {
                                        isAuthorized = true;
                                        break;
                                    }
                                }

                                if (!isAuthorized)
                                {
                                    throw new UnauthorizedException("The token owner is not allowed to access this resource");
                                }
                            }

                            User principal = new User(user.Username);
                            user.Convert(principal);
                            actionContext.RequestContext.Principal = principal;
                        }

                        // done authenticating
                        return;
                    }
                    catch (Exception e)
                    {
                        httpError = new HttpErrorVM(e);
                    }
                }
                else
                {
                    httpError = new HttpErrorVM(HttpStatusCode.Unauthorized, new List<string>() { "Invalid scheme" });
                }
            }

            if (httpError == null)
            {
                // set generic Unauthenticated request error
                httpError = new HttpErrorVM(HttpStatusCode.Unauthorized, new List<string>() { "Unauthenticated request" });
            }

            actionContext.Response = actionContext.Request.CreateResponse(httpError.StatusCode, httpError);
        }

        private static bool SkipAuthorization(HttpActionContext actionContext)
        {
            Contract.Assert(actionContext != null);

            return actionContext.ActionDescriptor.GetCustomAttributes<AllowAnonymousAttribute>().Any()
                   || actionContext.ControllerContext.ControllerDescriptor.GetCustomAttributes<AllowAnonymousAttribute>().Any();
        }
    }
}