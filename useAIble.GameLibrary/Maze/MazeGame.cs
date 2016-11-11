using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using useAIble.Core.Models.GameData;

namespace useAIble.GameLibrary.Maze
{
    //Delegates
    public delegate void GameStartedOccurred_Delegate(Traveler traveler, int currentIteration = 1);
    public delegate void GameCycleCompleteOccurred_Delegate(MazeCycleOutcome cycle, Traveler traveler);
    public delegate void GameOverOccurred_Delegate(MazeGameFinalOutcome final);

    //UI Threading Delegates
    public delegate void RunThreadUI_Delegate(Action act);

    //Structs
    public struct TravelerLocation
    {
        public int X { get; set; }
        public int Y { get; set; }
    }

    public struct MazeCycleOutcome
    {
        public Boolean BumpedIntoWall { get; set; }
        public Boolean GameOver { get; set; }
        public Int32 FinalScore { get; set; }
        public Location PreviousLocation { get; set; }
        public int Moves { get; set; }
    }

    public struct MazeGameFinalOutcome
    {
        public int CycleCount { get; set; }
        public Int32 FinalScore { get; set; }
    }

    public struct MazeCursorState
    {
        public Boolean IsDarkened { get; set; }
    }

   
    public class MazeGame
    {
        //Events
        public event GameStartedOccurred_Delegate GameStartEvent;
        public event GameCycleCompleteOccurred_Delegate GameCycleEvent;
        public event GameOverOccurred_Delegate GameOverEvent;

        //Callbacks
        RunThreadUI_Delegate RunThreadUI;

        public Boolean CancelGame = false;
        //public Maze maze;
        public Traveler traveler; //Human or AI, depending on what is called in set traveler
        public MazeCursorState cursorstate;
        public TravelerLocation GoalLocation = new TravelerLocation();
        public TravelerLocation OldLocation = new TravelerLocation();
        public int Width = -1;
        public int Height = -1;
        public bool BumpIntoWall = false;
        public int Moves = 0;
        //Perfect Game
        Int16 PerfectGameMovesCount = 49;

        //Timer to make the cursor blink
        //private System.Timers.Timer BlinkTimer;

        //Multi-threaded directions stack
        public ConcurrentQueue<Int16> DirectionsStack = new ConcurrentQueue<short>();

        //Build Grid
        public Boolean[,] TheMazeGrid;// = new Boolean[50, 50];
        public void InitGame(RunThreadUI_Delegate runthreadui)
        {
            //maze = new Maze();
            //Set Goal Location
            GoalLocation.X = 49; GoalLocation.Y = 24;
            //UIThread
            RunThreadUI = runthreadui;
            //Init Maze
            //maze.InitializeMaze(this, grd);
            //Init Blink Timer
            //Setup Blink on UI Thread
            //if (BlinkTimer == null)
            //{
            //    BlinkTimer = new System.Timers.Timer(300);
            //    BlinkTimer.Elapsed += Blink_Elapsed;
            //    BlinkTimer.Start();
            //}
            //else
            //{
            //    BlinkTimer.Start();
            //}
        }

        //For windowless training
        public void InitGame(MazeInfo maze)
        {
            //maze = new Maze();
            //Set Goal Location
            TheMazeGrid = maze.Grid;
            Height = maze.Height;
            Width = maze.Width;
            PerfectGameMovesCount = maze.PerfectGameMovesCount;
            GoalLocation.X = maze.GoalPosition.X;
            GoalLocation.Y = maze.GoalPosition.Y;
            OldLocation.X = maze.StartingPosition.X;
            OldLocation.Y = maze.StartingPosition.Y;
            //Default
            //for (int x1 = 0; x1 <= TheMazeGrid.GetUpperBound(0); x1++)
            //{
            //    for (int y1 = 0; y1 <= TheMazeGrid.GetUpperBound(1); y1++)
            //    {
            //        TheMazeGrid[x1, y1] = false;
            //    }
            //}

            //Apply blocks for maze

            //One long line across X at Y=125 except for 50, 100, 150, 200, 
            //for (int y2 = 0; y2 <= TheMazeGrid.GetUpperBound(0); y2++)
            //{
            //    if (y2 <= 23 || y2 >= 25) TheMazeGrid[25, y2] = true;
            //}
        }

        public void StartGame(Traveler SpecificTraveler = null, int currentIteration = 1, bool windowless = false)
        {
            //Set Default Traveler
            if (SpecificTraveler == null)
            {
                //Default traveler is human for now
                traveler = new HumanTraveler(this);
            }
            else
            {
                traveler = SpecificTraveler;
            }

            //Initial Location
            traveler.location.X = OldLocation.X;
            traveler.location.Y = OldLocation.Y;

            //Fire GameStart Event
            if (GameStartEvent != null) GameStartEvent(traveler, currentIteration);

            Thread GameLoopThread = new Thread(() => { this.GameLoop(windowless); });
            GameLoopThread.Start();
        }
        
        public void StopGame(bool windowless = false)
        {
            //if (windowless) BlinkTimer.Stop();
        }

        private void GameLoop(bool windowless = false)
        {
            int i = 0;
            //Cycle
            MazeCycleOutcome LastOutcome = new MazeCycleOutcome();
            while (LastOutcome.GameOver == false)
            {
                if (CancelGame) return;

                Int16 dir = -1;
                if (DirectionsStack.TryDequeue(out dir))
                {
                    //incriment the count
                    i++;
                    //Run the maze cycle
                    LastOutcome = CycleMaze(dir, windowless);

                    //GameCycledEvent
                    if (GameCycleEvent != null) GameCycleEvent(LastOutcome, traveler);

                    //Check for Game Over
                    if (LastOutcome.GameOver)
                    {
                        //Build Final Game
                        MazeGameFinalOutcome FinalOutcome = new MazeGameFinalOutcome();
                        FinalOutcome.CycleCount = i;
                        FinalOutcome.FinalScore = CalculateFinalScore(i);

                        //Event
                        if (GameOverEvent != null) GameOverEvent(FinalOutcome);
                    }
                }
                else
                {
                    System.Threading.Thread.Sleep(10);
                }
            }
        }

        //public void UI_Send_KeyDown(object sender, KeyEventArgs e)
        //{
        //    traveler.AcceptUIKeyDown(sender, e);
        //}

        public MazeCycleOutcome CycleMaze(int direction, bool windowless = false)
        {
            MazeCycleOutcome outcome = new MazeCycleOutcome();
            outcome.BumpedIntoWall = false;
            outcome.GameOver = false;
            outcome.FinalScore = 0;
            outcome.PreviousLocation = new Location() { X = traveler.location.X, Y = traveler.location.Y };

            TravelerLocation new_location = new TravelerLocation();
            outcome.Moves = Moves++;
            //Calculate new location
            switch (direction)
            {
                case 0:
                    if (traveler.location.Y <= 0)
                    {
                        //OutOfBoundsOccurred();
                        BumpIntoWall = true;
                        outcome.BumpedIntoWall = true;
                        return outcome;
                    }
                    new_location.X = traveler.location.X;
                    new_location.Y = traveler.location.Y - 1;
                    break;
                case 1:
                    if (traveler.location.X >= Width-1)
                    {
                        //OutOfBoundsOccurred();
                        BumpIntoWall = true;
                        outcome.BumpedIntoWall = true;
                        return outcome;
                    }
                    new_location.X = traveler.location.X + 1;
                    new_location.Y = traveler.location.Y;
                    break;
                case 2:
                    if (traveler.location.Y >= Height-1)
                    {
                        //OutOfBoundsOccurred();
                        BumpIntoWall = true;
                        outcome.BumpedIntoWall = true;
                        return outcome;
                    }
                    new_location.X = traveler.location.X;
                    new_location.Y = traveler.location.Y + 1;
                    break;
                case 3:
                    if (traveler.location.X <= 0)
                    {
                        //OutOfBoundsOccurred();
                        BumpIntoWall = true;
                        outcome.BumpedIntoWall = true;
                        return outcome;
                    }
                    new_location.X = traveler.location.X - 1;
                    new_location.Y = traveler.location.Y;
                    break;
                default:
                    throw new Exception("Not valid input");
            }


            //Is BumpedIntoWall?
            if (this.TheMazeGrid[new_location.X, new_location.Y])
            {
                BumpIntoWall = true;
                outcome.BumpedIntoWall = true;
                outcome.FinalScore = 0;
                outcome.GameOver = false;
                //Play sound
                //SystemSounds.Hand.Play();
                return outcome;
            }

            //New location is now current location
            //TravelerLocation old_location = traveler.location;
            OldLocation = traveler.location;
            traveler.location = new_location;

            //Is GameOver?
            if (traveler.location.X == GoalLocation.X && traveler.location.Y == GoalLocation.Y)
            {
                StopGame();
                outcome.GameOver = true;
                return outcome;
            }


            //if (!windowless)
            //{
            //    //Clear old location
            //    Action act = new Action(delegate
            //    {
            //        maze.ChangeCellColor(old_location, false);
            //    });
            //    RunThreadUI(act);

            //    //first blink at new location
            //    //Clear old location
            //    Action act2 = new Action(delegate
            //    {
            //        maze.ChangeCellColor(traveler.location, true);
            //    });
            //    RunThreadUI(act2);
            //}

            return outcome;
        }

        //private void Blink_Elapsed(object sender, System.Timers.ElapsedEventArgs e)
        //{
        //    BlinkTimer.Stop();
        //    //Create an action and blink on the UI thread
        //    Action act = new Action(delegate
        //    {
        //        maze.ChangeCellColor(traveler.location, !cursorstate.IsDarkened);
        //    });
        //    RunThreadUI(act);
        //    BlinkTimer.Start();
        //}

        //private void OutOfBoundsOccurred()
        //{
        //    //Play sound
        //    SystemSounds.Exclamation.Play();
        //}

        public Int32 CalculateFinalScore(Int32 i)
        {
            //return (1000000 + (PerfectGameMovesCount * 1000)) - (i * 1000); //Dock one hundred points per move

            return (20000 + (PerfectGameMovesCount * 1000)) - (i * 1000);
        }
    }
}