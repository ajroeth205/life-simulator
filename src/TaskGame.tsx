import { useEffect, useState } from "react";
import './TaskGame.css';

type BorderColor = "orange" | "yellow" | "blue";

type Task = {
  id: number;
  timeLeft: number;
  borderColor: BorderColor;
  top: number;
  left: number;
  missed?: boolean;
};

const BOX_WIDTH = 140;
const BOX_HEIGHT = 80;
const TOP_RESERVED_HEIGHT = 150; // Reserved space for title, score, and penalties

export default function TaskGame() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [score, setScore] = useState(0);
  const [restPositions, setRestPositions] = useState<{top: number; left: number}[]>([]);
  const [showSickDay, setShowSickDay] = useState(false);

  // Check if two boxes overlap
  const isOverlapping = (a: Task, b: Task) => {
    return !(
      a.left + BOX_WIDTH < b.left ||
      a.left > b.left + BOX_WIDTH ||
      a.top + BOX_HEIGHT < b.top ||
      a.top > b.top + BOX_HEIGHT
    );
  };

  // Find a non-overlapping random position (below reserved top area)
  const getValidRandomPosition = (existingTasks: Task[]): { top: number; left: number } => {
    for (let i = 0; i < 30; i++) {
      const top = TOP_RESERVED_HEIGHT + Math.random() * (window.innerHeight - TOP_RESERVED_HEIGHT - BOX_HEIGHT);
      const left = Math.random() * (window.innerWidth - BOX_WIDTH);
      const dummyTask = { id: -1, top, left, timeLeft: 0, borderColor: "orange" as BorderColor };

      const overlaps = existingTasks.some((task) => isOverlapping(dummyTask, task));
      if (!overlaps) return { top, left };
    }
    return { top: TOP_RESERVED_HEIGHT, left: 0 };
  };

  // Spawn new tasks every second
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setTasks((prev) => {
        const position = getValidRandomPosition(prev);
        const borderColors: BorderColor[] = ["orange", "yellow", "blue"];
        const newTask: Task = {
          id: Math.floor(Math.random() * 1e8),
          timeLeft: Math.floor(Math.random() * 10) + 1,
          borderColor: borderColors[Math.floor(Math.random() * borderColors.length)],
          top: position.top,
          left: position.left,
        };
        return [...prev, newTask];
      });
    }, 1000);

    return () => clearInterval(spawnInterval);
  }, []);

  // Move tasks and update timers every second
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setTasks((prev) => {
        const updatedTasks = prev.map((task, _, all) => {
          if (task.missed) return task; // Don't move missed tasks

          const otherTasks = all.filter((t) => t.id !== task.id);
          const newPosition = getValidRandomPosition(otherTasks);

          if (task.timeLeft <= 1) {
            // Subtract score based on borderColor
            let penalty = 0;
            switch (task.borderColor) {
              case "blue":
                penalty = -1;
                break;
              case "yellow":
                penalty = -3;
                break;
              case "orange":
                penalty = -10;
                break;
            }
            setScore((s) => s + penalty);

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

  // Add a new REST!!! position every 3 seconds (below reserved top area)
  useEffect(() => {
    const restInterval = setInterval(() => {
      setRestPositions((prev) => [
        ...prev,
        {
          top: TOP_RESERVED_HEIGHT + Math.random() * (window.innerHeight - TOP_RESERVED_HEIGHT - 50),
          left: Math.random() * (window.innerWidth - 100),
        },
      ]);
    }, 3000);

    return () => clearInterval(restInterval);
  }, []);

  // Sick Day popup logic
  useEffect(() => {
    let sickDayTimeout: ReturnType<typeof setTimeout>;

    const scheduleSickDay = () => {
      const delay = 10000 + Math.random() * 10000; // 10-20 seconds random
      sickDayTimeout = setTimeout(() => {
        setShowSickDay(true);
        setTimeout(() => {
          setShowSickDay(false);
          scheduleSickDay();
        }, 5000);
      }, delay);
    };

    scheduleSickDay();

    return () => clearTimeout(sickDayTimeout);
  }, []);

  // Remove only active tasks on click, but disable if Sick Day active
  const removeTask = (id: number) => {
    if (showSickDay) return;
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setScore((s) => s + 1); // optional: reward for clicking
  };

  return (
    <div className="game-container">
      <h1 className="game-title">Life Simulator</h1>
      <div className="score-display">Score: {score}</div>
      <div className="penalty-description">
        Click the tasks to complete. Penalties on miss:{" "}
        <span className="penalty-label orange">Orange: -10</span>{" "}
        <span className="penalty-label yellow">Yellow: -3</span>{" "}
        <span className="penalty-label blue">Blue: -1</span>
      </div>

      {/* REST!!! texts in background */}
      {restPositions.map((pos, i) => (
        <div
          key={`rest-${i}`}
          className="rest-text"
          style={{ top: pos.top, left: pos.left }}
        >
          REST!!!
        </div>
      ))}

      {/* Tasks */}
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
            pointerEvents: showSickDay ? "none" : "auto",
            cursor: showSickDay ? "default" : "pointer",
          }}
        >
          <div className="task-id">task #{task.id}</div>
          <div className="task-time">⏱ {task.timeLeft}s</div>
          {task.missed && <div className="task-missed">MISSED!</div>}
        </div>
      ))}

      {/* Sick Day popup */}
      {showSickDay && (
        <div className="sick-day-popup">
          Sick day
        </div>
      )}
    </div>
  );
}
