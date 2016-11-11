using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace useAIble.MVC.Controllers
{
    public class HeadToHeadController : Controller
    {
        // GET: AiProjects
        public ActionResult Index()
        {
            ViewBag.PageTitle = "Home";
            return View("");
        }
        // GET: AiProjects


        //[Route("LunarLander/LunarLander")]
        public ActionResult LunarLander()
        {
            //return View();
            ViewBag.Game = "LunarLander";
            ViewBag.PageTitle = "Lunar Lander";
            return View("LunarLander/LunarLander");
            //return View("~/Views/AiProjects/LunarLander/LunarLander.cshtml");
        }

        public ActionResult Maze()
        {
            //return View();
            ViewBag.Game = "Maze";
            ViewBag.PageTitle = "Maze";
            return View("Maze/Maze");
            //return View("~/Views/AiProjects/LunarLander/LunarLander.cshtml");
        }

        public ActionResult LogisticsSimulation()
        {
            //return View();
            ViewBag.Game = "LogisticsSimulation";
            ViewBag.PageTitle = "Logistics Simulation";
            return View("LogisticsSimulation/LogisticsSimulation");
            //return View("Maze/Maze");
            //return View("~/Views/AiProjects/LunarLander/LunarLander.cshtml");
        }

        public ActionResult Diagnostics()
        {
            //return View();
            ViewBag.Game = "Diagnostics";
            ViewBag.PageTitle = "Diagnostics Tools";
            return View("Diagnostics/Diagnostics");
            //return View("~/Views/AiProjects/LunarLander/LunarLander.cshtml");
        }
    }
}