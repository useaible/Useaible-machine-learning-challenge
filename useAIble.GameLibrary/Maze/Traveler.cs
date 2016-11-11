using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace useAIble.GameLibrary.Maze
{
    public abstract class Traveler
    {

        public MazeGame GameRef;
        public TravelerLocation location;

        public Traveler()
        {
            location = new TravelerLocation();
        }

        public Traveler(MazeGame gameref)
            : this()
        {
            GameRef = gameref;
        }

        public abstract void AcceptUIKeyDown(short direction);
    }

    public class HumanTraveler : Traveler
    {
        public HumanTraveler(MazeGame gameref) : base(gameref)
        {

        }

        override public void AcceptUIKeyDown(short direction)
        {
            GameRef.DirectionsStack.Enqueue(direction);
            //send based upon key
            // ^=0, >=1, D=2, <=3
            //if (e.Key == Key.Up)
            //{
            //    GameRef.DirectionsStack.Enqueue(0);   //0 for UP
            //}

            //if (e.Key == Key.Right)
            //{
            //    GameRef.DirectionsStack.Enqueue(1);   //1 for Right
            //}

            //if (e.Key == Key.Down)
            //{
            //    GameRef.DirectionsStack.Enqueue(2);   //2 for Down
            //}

            //if (e.Key == Key.Left)
            //{
            //    GameRef.DirectionsStack.Enqueue(3);   //3 for Left
            //}
        }
    }
}
