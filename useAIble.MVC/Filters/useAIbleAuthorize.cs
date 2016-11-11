using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using System.Net;
using System.Net.Http.Headers;
using System.Threading;
using System.Web.Security;
using System.Web;
using useAIble.Core.Models;

namespace useAIble.MVC.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class useAIbleAuthorize : AuthorizeAttribute
    {
        private List<useAIbleRole> roles { get; set; }

        public useAIbleAuthorize(params useAIbleRole[] roles)
        {
            this.roles = new List<useAIbleRole>();
            if (roles != null && roles.Count() > 0)
            {
                this.roles.AddRange(roles);
            }
        }

        protected override bool AuthorizeCore(HttpContextBase httpContext)
        {
            bool isValid = false;
            User user = null;

            if (httpContext.Session["User"] is User)
            {
                user = (User)httpContext.Session["User"];
            }

            if (user != null && httpContext.User.Identity.IsAuthenticated && httpContext.User.Identity is FormsIdentity)
            {
                string username = httpContext.User.Identity.Name;

                if (user.Username == username)
                {
                    isValid = true;

                    // if required roles have been added then check if user's role is in it
                    if (roles.Count() != 0 && !user.SystemAdmin)
                    {
                        var userRoles = new List<useAIbleRole>();

                        if (user.OrganizationAdmin)
                        {
                            userRoles.Add(useAIbleRole.OrganizationAdmin);
                        }

                        // todo we might add more roles

                        isValid = false;
                        foreach (var role in userRoles)
                        {
                            if (roles.Any(a => a == role))
                            {
                                isValid = true;
                                break;
                            }
                        }
                    }
                }
                else
                {
                    // just to make sure and avoid potential threats
                    forceLogout(httpContext);
                }
            }
            //else // if any of the 2 conditions above fail then force logout just to make sure
            //{
            //    forceLogout(httpContext);
            //}
            else if (user != null && !httpContext.User.Identity.IsAuthenticated)
            {
                forceLogout(httpContext);
            }
            else if (user == null && httpContext.User.Identity.IsAuthenticated)
            {
                forceLogout(httpContext);
            }

            return isValid;
        }

        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            // two things can happen, unless im overlooking something...
            // user is not authenticated so redirect to login page
            if (!filterContext.HttpContext.User.Identity.IsAuthenticated || filterContext.HttpContext.Session["User"] == null)
            {
                if (filterContext.HttpContext.Request.IsAjaxRequest())
                {
                    filterContext.Result = new ViewResult
                    {
                        ViewName = "~/Views/Shared/_Unauthorized.cshtml"
                    };
                }
                else
                {
                    base.HandleUnauthorizedRequest(filterContext);
                }
            }
            else // or user is not authorized (invalid role)
            {
                filterContext.Result = new ViewResult
                {                    
                    ViewName = "~/Views/Shared/_Unauthorized.cshtml"
                };
            }
        }

        private void forceLogout(HttpContextBase httpContext)
        {
            //httpContext.Session.Clear();
            httpContext.Session.Abandon();
            FormsAuthentication.SignOut();
        }
    }
}