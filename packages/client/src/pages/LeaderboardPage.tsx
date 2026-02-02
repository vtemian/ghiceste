import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LeaderboardPage.css';

interface LeaderboardEntry {
  userId: string;
  username: string;
  guesses: number;
  timeMs: number;
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [instanceId, setInstanceId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const frameId = params.get('frame_id');
    if (frameId) {
      // Running in Discord
      import('../lib/discord').then(({ initializeDiscord }) => {
        initializeDiscord()
          .then((data) => {
            setInstanceId(data.instanceId);
          })
      });
    } else {
      // Local dev mode
      setInstanceId('local-dev-session');
    }
  }, []);

  useEffect(() => {
    if (!instanceId) return;

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

  return (
    <div className="leaderboard-page">
      <header className="header">
        <Link to="/" className="back-button">Înapoi la joc</Link>
        <h1>Clasament</h1>
        <div style={{ width: '80px' }}></div>
      </header>
      <main className="leaderboard">
        {loading ? (
          <div className="loading">Se încarcă...</div>
        ) : entries.length === 0 ? (
          <p>Fii primul care termină!</p>
        ) : (
          entries.slice(0, 10).map((entry, i) => (
            <div
              key={entry.userId}
              className={`leaderboard-entry`}
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
      </main>
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
