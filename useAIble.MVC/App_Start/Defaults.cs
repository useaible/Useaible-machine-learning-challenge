using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using useAIble.Core.Contracts;
using useAIble.Core.Enums;
using useAIble.Core.Framework;
using useAIble.Core.IoC;
using useAIble.Core.Models;
using useAIble.Core.Models.FeatureItems;
using useAIble.Core.Models.FeatureItems.AI;
using useAIble.Core.Models.FeatureItems.DataChunks;
using useAIble.Core.Models.FeatureItems.DataSources;
using useAIble.Core.Models.FeatureItems.Lines;
using useAIble.Core.Utility;
using useAIble.FeatureManagement.AI;
using useAIble.FeatureManagement.DataChunks;
using useAIble.FeatureManagement.DataCompilations;
using useAIble.FeatureManagement.DataScheduling;
using useAIble.FeatureManagement.DataSources;
using useAIble.FeatureManagement.FileManagement;
using useAIble.FeatureManagement.RetailSystems;
using useAIble.FeatureManagement.UserManagement;

namespace useAIble.MVC
{
    public class Defaults
    {
        public static HostProcess.HostProcess HP { get; set; }
        public static useAIbleDataSourceFeatureMgr DataSourceFeatureMgr { get; private set; }
        public static useAIbleDataChunkFeatureMgr DataChunkFeatureMgr { get; private set; }
        public static useAIbleDataCompilationFeatureMgr DataCompFeatureMgr { get; private set; }
        public static useAIbleDataSchedulingFeatureMgr DataSchedFeatureMgr { get; private set; }
        public static useAIbleAIFeatureMgr AIFeatureMgr { get; private set; }
        public static useAIbleUserMgmFeatureMgr UserFeatureMgr { get; private set; }
        public static useAIbleFileMgmFeatureMgr FileFeatureMgr { get; private set; }
        public static useAIbleRetailSystemsFeatureMgr RetailSysFeatureMgr { get; private set; } 
        static Defaults()
        {            
            HP = new HostProcess.HostProcess(new Modtypes[] { Modtypes.UserManagementModule }, false );
            HP.StartAll();

            UserFeatureMgr = HP.UserMgmFeatureMgr;
            IuseAIbleTaskEnqueuer taskEnq = HP.UserMgmFeatureMgr.TaskEnqueuer;
            DataCompFeatureMgr = new useAIbleDataCompilationFeatureMgr();
            DataCompFeatureMgr.TaskEnqueuer = taskEnq;

            DataSourceFeatureMgr = new useAIbleDataSourceFeatureMgr();
            DataSourceFeatureMgr.TaskEnqueuer = taskEnq;           
            DataChunkFeatureMgr = new useAIbleDataChunkFeatureMgr();
            DataChunkFeatureMgr.TaskEnqueuer = taskEnq;
            DataSchedFeatureMgr = new useAIbleDataSchedulingFeatureMgr();
            DataSchedFeatureMgr.TaskEnqueuer = taskEnq;
            AIFeatureMgr = new useAIbleAIFeatureMgr();
            AIFeatureMgr.TaskEnqueuer = taskEnq;
            FileFeatureMgr = new useAIbleFileMgmFeatureMgr();
            FileFeatureMgr.TaskEnqueuer = taskEnq;
            RetailSysFeatureMgr = new useAIbleRetailSystemsFeatureMgr();
            RetailSysFeatureMgr.TaskEnqueuer = taskEnq;
        }

        public static void CreateUserIfNotExists()
        {
            var user = UserFeatureMgr.GetUser("admin");//new Models.POCO.User("admin", "admin42!");
            //if (!user.SystemAdminExists())
            //{
            //    user.SystemAdmin = true;
            //    user.Theme = "Moonlight";
            //    user.SaveToDb();
            //}

            if(user == null)
            {
                UserFeatureMgr.CreateUser("admin", "admin42!", true, false);
            }
        }
        

        public static string CreateRandomPassword()
        {
            string retVal = string.Empty;
            var abc = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";             
            foreach (var s in abc.OrderBy(x => Guid.NewGuid()).Take(6))
            {
                retVal += s;
            }
            return retVal;
        }

        public static void CreateDatasourcesIfNotExists()
        {
            useAIbleDataSourceFeatureMgr mgr = Defaults.DataSourceFeatureMgr;
            if (mgr.Count() == 0)
            {
                var list = new List<useAIbleFeatureItemBase>()
                {
                    new useAIbleDataSourceTwitter(),
                    new useAIbleDataSourceSQLServer(),
                    //new useAIbleDataSourceGoogle()
                    new useAIbleDataSourceFB(),
                    new useAIbleDataSourceSalesForce(),
                    new useAIbleDataSourceFileUpload()
                };
                mgr.CreateTemplates(list);
            }
        }
        
    }
}