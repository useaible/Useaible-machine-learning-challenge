using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using System.Collections;
using useAIble.MVC.Models;
using useAIble.Core.Models;

namespace useAIble.MVC.Hubs
{
    public class useAIbleHealthManagerHub : Hub
    {
        public void UpdateTasksChart(List<KendoChartSeriesVM> tasks)
        { 
            Clients.All.getChartData(tasks);
        }

        public void UpdateRNNDiagnostics(useAIbleRNNDiagnostics diag)
        {
            if (diag != null)
            {
                var diagnostics = new RNNDiagnosticsVM(diag);
                Clients.All.getRNNDiagnostics(diagnostics);
            }
        }
    }
}