import React, { useEffect, useState } from 'react';
import { FleetLog } from '../types/fleet_log';
import { UserFleet } from '../types/fleet';
import { fetchAllShipLogs } from '../api/fleetLogApi';
import FleetLogCard from "./FleetLogCard";

interface Props {
  fleets: UserFleet[];
}

const RecentFleetLogs: React.FC<Props> = ({ fleets }) => {
  const [logs, setLogs] = useState<FleetLog[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetchAllShipLogs()
      .then(data => {
        const sorted = [...data]
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 10);
        setLogs(sorted);
      })
      .catch(() => setLogs([]));
  }, []);

  // Helper to embed YouTube or Twitch links
  const renderVideoEmbed = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return (
        <iframe
          width="100%"
          height="220"
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="Fleet Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 8, marginBottom: 8 }}
        />
      );
    }
    const twitchMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (twitchMatch) {
      return (
        <iframe
          src={`https://player.twitch.tv/?video=${twitchMatch[1]}&parent=${window.location.hostname}`}
          height="220"
          width="100%"
          allowFullScreen
          frameBorder="0"
          style={{ borderRadius: 8, marginBottom: 8 }}
        />
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#2d7aee" }}>
        {url}
      </a>
    );
  };

  // Stylized Tooltip component
  interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
  }
  const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [visible, setVisible] = useState(false);
    return (
      <span
        style={{ position: "relative", display: "inline-block" }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
        {visible && (
          <div
            style={{
              position: "absolute",
              top: "120%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#181a1b",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              boxShadow: "0 2px 12px #0008",
              whiteSpace: "pre-line",
              zIndex: 10,
              fontSize: 14,
              minWidth: 120,
              maxWidth: 320,
            }}
          >
            {content}
          </div>
        )}
      </span>
    );
  };

  return (
    <div className="recent-fleet-logs">
      <h3>Recent Fleet Logs</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {logs.map((log, idx) => {
          const fleet = fleets.find(f => Number(f.id) === Number(log.fleet_id));
          return (
            <FleetLogCard
              key={log.id}
              log={log}
              fleet={fleet}
              expanded={expanded === idx}
              onToggleExpand={() => setExpanded(expanded === idx ? null : idx)}
              renderVideoEmbed={renderVideoEmbed}
            >
              {/* You can add Tooltip or extra info here if needed */}
            </FleetLogCard>
          );
        })}
      </div>
    </div>
  );
};

export default RecentFleetLogs;