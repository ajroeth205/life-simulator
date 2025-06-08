import { useEffect, useState } from "react";
import './TaskGame.css';

// Configurable constants
const BOX_WIDTH = 140;
const BOX_HEIGHT = 90;
const TOP_RESERVED_HEIGHT = 190;

const TASK_SPAWN_INTERVAL_MS = 1000;
const TASK_LIFESPAN_SECONDS_RANGE = [1, 10];

const REST_SPAWN_INTERVAL_MS = 3000;

const POPUP_MIN_DELAY_MS = 10000;
const POPUP_MAX_DELAY_MS = 20000;
const POPUP_DURATION_MS = 5000;

const PENALTIES = {
  blue: -1,
  yellow: -3,
  orange: -10,
};

const TASK_DESCRIPTIONS_BY_COLOR: Record<BorderColor, string[]> = {
  blue: [
    "breathe",
    "stretch",
    "hydrate",
    "hang a painting",
    "read the news",
    "fix your bike",
    "wash car",
    "read books",
    "mend clothes",
    "fix stain on clothes",
  ],
  yellow: [
    "donate to friend's gofundme",
    "do laundry",
    "reply to email",
    "organize desk",
    "change sheets",
    "cook",
    "do the dishes",
    "clean up cat barf",
    "brush teeth and floss",
    "take a shower",
    "manage finances",
    "renew car registration",
    "schedule doctor appt",
    "go to doctor appt",
    "buy groceries",
  ],
  orange: [
    "work",
    "do taxes",
    "pay parking ticket",
    "go to urgent care",
    "fix car",
    "treat injury",
    "move house",
    "find apartment",
    "deal with broken fridge",
    "deal with broken fridge",
    "apply ointment",
    "take meds",
    "pay bills",
    "move car for street sweeping",
    "sleep",
    "pick up prescription",
  ],
};


type BorderColor = keyof typeof PENALTIES;

type Task = {
  id: number;
  timeLeft: number;
  borderColor: BorderColor;
  top: number;
  left: number;
  description: string;
  missed?: boolean;
};

export default function TaskGame() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [score, setScore] = useState(0);
  const [restPositions, setRestPositions] = useState<{top: number; left: number}[]>([]);
  const [showSickDay, setShowSickDay] = useState(false);
  const [showFriendsDay, setShowFriendsDay] = useState(false);

  const isOverlapping = (a: Task, b: Task) => {
    return !(
      a.left + BOX_WIDTH < b.left ||
      a.left > b.left + BOX_WIDTH ||
      a.top + BOX_HEIGHT < b.top ||
      a.top > b.top + BOX_HEIGHT
    );
  };

  const getValidRandomPosition = (existingTasks: Task[]): { top: number; left: number } => {
    for (let i = 0; i < 30; i++) {
      const top = TOP_RESERVED_HEIGHT + Math.random() * (window.innerHeight - TOP_RESERVED_HEIGHT - BOX_HEIGHT);
      const left = Math.random() * (window.innerWidth - BOX_WIDTH);
      const dummyTask = { id: -1, top, left, timeLeft: 0, borderColor: "orange" as BorderColor, description: "Dummy" };

      const overlaps = existingTasks.some((task) => isOverlapping(dummyTask, task));
      if (!overlaps) return { top, left };
    }
    return { top: TOP_RESERVED_HEIGHT, left: 0 };
  };

  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setTasks((prev) => {
        const position = getValidRandomPosition(prev);
        const borderColors = Object.keys(PENALTIES) as BorderColor[];
        const borderColor = borderColors[Math.floor(Math.random() * borderColors.length)];
        const descriptions = TASK_DESCRIPTIONS_BY_COLOR[borderColor];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];

        const newTask: Task = {
          id: Math.floor(Math.random() * 1e8),
          timeLeft: Math.floor(Math.random() * (TASK_LIFESPAN_SECONDS_RANGE[1] - TASK_LIFESPAN_SECONDS_RANGE[0] + 1)) + TASK_LIFESPAN_SECONDS_RANGE[0],
          borderColor,
          top: position.top,
          left: position.left,
          description,
        };
        return [...prev, newTask];
      });
    }, TASK_SPAWN_INTERVAL_MS);

    return () => clearInterval(spawnInterval);
  }, []);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setTasks((prev) => {
        const updatedTasks = prev.map((task, _, all) => {
          if (task.missed) return task;

          const otherTasks = all.filter((t) => t.id !== task.id);
          const newPosition = getValidRandomPosition(otherTasks);

          if (task.timeLeft <= 1) {
            setScore((s) => s + PENALTIES[task.borderColor]);
            return { ...task, timeLeft: 0, missed: true };
          }

          return {
            ...task,
            timeLeft: task.timeLeft - 1,
            top: newPosition.top,
            left: newPosition.left,
          };
        });

        return updatedTasks;
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, []);

  useEffect(() => {
    const restInterval = setInterval(() => {
      setRestPositions((prev) => [
        ...prev,
        {
          top: TOP_RESERVED_HEIGHT + Math.random() * (window.innerHeight - TOP_RESERVED_HEIGHT - 50),
          left: Math.random() * (window.innerWidth - 100),
        },
      ]);
    }, REST_SPAWN_INTERVAL_MS);

    return () => clearInterval(restInterval);
  }, []);

  useEffect(() => {
    let popupTimeout: ReturnType<typeof setTimeout>;
    let isNextSickDay = true;

    const schedulePopup = () => {
      const delay = POPUP_MIN_DELAY_MS + Math.random() * (POPUP_MAX_DELAY_MS - POPUP_MIN_DELAY_MS);
      popupTimeout = setTimeout(() => {
        if (isNextSickDay) {
          setShowSickDay(true);
        } else {
          setShowFriendsDay(true);
        }

        setTimeout(() => {
          setShowSickDay(false);
          setShowFriendsDay(false);
          isNextSickDay = !isNextSickDay; // Alternate next time
          schedulePopup();
        }, POPUP_DURATION_MS);
      }, delay);
    };

    schedulePopup();

    return () => clearTimeout(popupTimeout);
  }, []);

  const removeTask = (id: number) => {
    if (showSickDay || showFriendsDay) return;

    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task || task.missed) return prev;
      setScore((s) => s + 1);
      return prev.filter((t) => t.id !== id);
    });
  };

  return (
    <div className="game-container">
      <h1 className="game-title">Life Simulator</h1>
      <div className="score-display">Score: {score}</div>
      <div className="instructions">
        Click the tasks to complete. Penalties on miss:
        <div>
          <span className="penalty-label orange">Orange: {PENALTIES.orange}</span>{" "}
          <span className="penalty-label yellow">Yellow: {PENALTIES.yellow}</span>{" "}
          <span className="penalty-label blue">Blue: {PENALTIES.blue}</span>
        </div>
        <div className="instructions-extra">
          If this is too difficult, try using a to-do list! Add all the tasks to your list, prioritize them based on color and time remaining, and do them one by one!
        </div>
      </div>

      {restPositions.map((pos, i) => (
        <div
          key={`rest-${i}`}
          className="rest-text"
          style={{ top: pos.top, left: pos.left }}
        >
          REST!!!
        </div>
      ))}

      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => removeTask(task.id)}
          className={`task-box ${task.borderColor} ${task.missed ? "missed" : ""}`}
          style={{
            top: task.top,
            left: task.left,
            width: BOX_WIDTH,
            height: BOX_HEIGHT,
            pointerEvents: showSickDay || showFriendsDay ? "none" : "auto",
            cursor: showSickDay || showFriendsDay ? "default" : "pointer",
          }}
        >
          <div className="task-id">{task.description}</div>
          <div className="task-time">⏱ {task.timeLeft}s</div>
          {task.missed && <div className="task-missed">MISSED!</div>}
        </div>
      ))}

      {showSickDay && (
        <div className="sick-day-popup">
          Sick day
        </div>
      )}

      {showFriendsDay && (
        <div className="friends-day-popup">
          Hanging out with friends!!! Yay!! Fun!!
        </div>
      )}
    </div>
  );
}
