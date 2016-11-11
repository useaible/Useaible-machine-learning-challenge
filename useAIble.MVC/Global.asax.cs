using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using useAIble.Core.Enums;
using useAIble.Core.IoC;
using useAIble.HostProcess;

namespace useAIble.MVC
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            //AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            DRNNServerApp.Start();

            HostProcess.HostProcess.Init();
            //// useAIble startup initialization
            //useAIbleApp app = new useAIbleApp();
            //app.Initialize(); // TODO transfer Defaults class implementation to useAIbleApp so that we have one call instead?
            //Defaults.HP = new HostProcess.HostProcess(new Modtypes[] { Modtypes.DataCollectionModule, Modtypes.DataDigestModule, Modtypes.DataPresentationModule}, true);
            //Defaults.HP.StartAll();
            Defaults.CreateUserIfNotExists();
            //Defaults.CreateMockPageViews(); // TODO delete me later once mocks not needed anymore
            //Defaults.CreateDatasourcesIfNotExists(); // TODO delte me later, or we could actually use this one

            CachedData.Init();
        }
    }
}
