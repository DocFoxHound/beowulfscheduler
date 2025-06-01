import React, { useState } from "react";
import { FleetLog } from "../types/fleet_log";
import { UserFleet } from "../types/fleet";

interface FleetLogCardProps {
  log: FleetLog;
  fleet?: UserFleet;
  expanded: boolean;
  onToggleExpand: () => void;
  renderVideoEmbed: (url: string) => React.ReactNode;
  children?: React.ReactNode;
}

// Simple Tooltip component
const Tooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode }> = ({ content, children }) => {
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

const FleetLogCard: React.FC<FleetLogCardProps> = ({
  log,
  fleet,
  expanded,
  onToggleExpand,
  renderVideoEmbed,
  children,
}) => {
  // Calculate total value (value_stolen + damages_value)
  const totalValue =
    (typeof log.value_stolen === "number" ? log.value_stolen : 0) +
    (typeof log.damages_value === "number" ? log.damages_value : 0);

  return (
    <div
      style={{
        background: "#23272a",
        color: "#fff",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: 16,
        boxShadow: "0 2px 8px #0002",
        textAlign: "left",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {fleet?.avatar && (
          <Tooltip
            content={
              <div style={{
                padding: "8px 16px",
                background: "#23272a",
                color: "#7fd7ff",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 2px 12px #0008",
                border: "1px solid #2d7aee",
                textAlign: "center"
              }}>
                {fleet.name || "Unknown Fleet"}
              </div>
            }
          >
            <img
              src={fleet.avatar}
              alt={fleet.name}
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                objectFit: "cover",
                border: "1px solid #353a40",
              }}
            />
          </Tooltip>
        )}
        <div>
          <div style={{ fontWeight: "bold", fontSize: 18 }}>
            {log.title || "Untitled"}
          </div>
          {/* <div style={{ color: "#aaa", fontSize: 14 }}>
            {fleet?.name || log.fleet_name || "Unknown Fleet"}
          </div> */}
          <div style={{ color: "#aaa", fontSize: 14 }}>
            Commander: {log.commander_username || "Unknown"}
          </div>
          {/* Air Subs */}
          {log.air_sub_usernames && log.air_sub_usernames.length > 0 && (
            <div style={{ color: "#8ecae6", fontSize: 14 }}>
              Air Subs: {log.air_sub_usernames.join(", ")}
            </div>
          )}
          {/* FPS Subs */}
          {log.fps_sub_usernames && log.fps_sub_usernames.length > 0 && (
            <div style={{ color: "#fbbf24", fontSize: 14 }}>
              FPS Subs: {log.fps_sub_usernames.join(", ")}
            </div>
          )}
          {/* Crew as Tooltip */}
          {log.crew_usernames && log.crew_usernames.length > 0 && (
            <div style={{ fontSize: 14, marginTop: 2 }}>
              <Tooltip
                content={
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Crew:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {log.crew_usernames.map((name, i) => (
                        <span key={i} style={{ background: "#181a1b", padding: "2px 8px", borderRadius: 4, margin: 2 }}>
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                }
              >
                <span style={{ color: "#2d7aee", textDecoration: "underline", cursor: "pointer" }}>
                  Show Crew ({log.crew_usernames.length})
                </span>
              </Tooltip>
            </div>
          )}
          {children}
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 18, margin: "12px 0 0 0", fontSize: 15 }}>
        <div>
          <span style={{ color: "#aaa" }}>Kills: </span>
          <span>{log.total_kills ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#aaa" }}>Damage: </span>
          <span>{log.damages_value ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#aaa" }}>Cargo: </span>
          <span>{log.total_cargo ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#aaa" }}>Total Value: </span>
          <span>{totalValue}</span>
        </div>
      </div>
      {/* Media Links */}
      {log.media_links && log.media_links.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Media:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {log.media_links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#2d7aee",
                  background: "#181a1b",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                Media {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}
      {/* Expand/Collapse Story */}
      <button
        style={{
          background: "none",
          border: "none",
          color: "#2d7aee",
          cursor: "pointer",
          marginTop: 8,
          fontWeight: 500,
          fontSize: 15,
          padding: 0,
        }}
        onClick={onToggleExpand}
      >
        {expanded ? "Hide Story" : "Show Story"}
      </button>
      {expanded && (
        <div
          style={{
            background: "#181a1b",
            color: "#fff",
            borderRadius: 6,
            padding: "0.75rem",
            marginTop: 8,
            fontSize: 15,
            whiteSpace: "pre-line",
          }}
        >
          {log.notes || <span style={{ color: "#888" }}>No story provided.</span>}
        </div>
      )}
      {/* Embedded Video */}
      <div style={{ margin: "12px 0" }}>{renderVideoEmbed(log.video_link)}</div>
    </div>
  );
};

export default FleetLogCard;