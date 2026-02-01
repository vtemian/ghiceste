import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  guesses: number;
  timeMs: number;
}

interface LeaderboardProps {
  instanceId: string;
  currentUserId: string;
}

export function Leaderboard({ instanceId, currentUserId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leaderboard/${instanceId}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries);
        setLoading(false);
      });

    const interval = setInterval(() => {
      fetch(`/api/leaderboard/${instanceId}`)
        .then((res) => res.json())
        .then((data) => setEntries(data.entries));
    }, 5000);

    return () => clearInterval(interval);
  }, [instanceId]);

  if (loading) return <div className="leaderboard">Se încarcă...</div>;

  return (
    <div className="leaderboard">
      <h2>Clasament</h2>
      {entries.length === 0 ? (
        <p>Fii primul care termină!</p>
      ) : (
        entries.slice(0, 10).map((entry, i) => (
          <div
            key={entry.userId}
            className={`leaderboard-entry ${entry.userId === currentUserId ? 'current-user' : ''}`}
          >
            <span>
              {i + 1}. {entry.username}
            </span>
            <span>
              {entry.guesses}/6 • {formatTime(entry.timeMs)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
