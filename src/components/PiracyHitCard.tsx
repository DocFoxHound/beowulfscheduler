import React from "react";
import { Hit } from "../types/hittracker";

interface PiracyHitCardProps {
  hit: Hit;
}

const PiracyHitCard: React.FC<PiracyHitCardProps> = ({ hit }) => (
  <div
    style={{
      background: '#23272b',
      borderRadius: 8,
      padding: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      border: '1px solid #333',
      position: 'relative'
    }}
  >
    {/* Type of piracy in all caps, next to title */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginLeft: 8 }}>
        {hit.title}
      </span>
      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2d7aee', letterSpacing: 1 }}>
        {hit.type_of_piracy?.toUpperCase()}
      </span>
    </div>

    {/* "FLEET" if fleet_activity */}
    {hit.fleet_activity && (
      <div style={{ fontWeight: 'bold', color: '#ffb347', marginBottom: 2 }}>FLEET</div>
    )}

    {/* Fleet name if fleet_activity */}
    {hit.fleet_activity && hit.fleet_names && hit.fleet_names.length > 0 && (
      <div style={{ color: '#fff', marginBottom: 6 }}>
        {hit.fleet_names.join(", ")}
      </div>
    )}

    {/* Total cargo amount */}
    <div>
      <span style={{ color: '#aaa' }}>Total Cargo:</span>{" "}
      <span style={{ fontWeight: 600 }}>
        {hit.total_scu?.toLocaleString()}
      </span>
    </div>

    {/* Total value */}
    <div>
      <span style={{ color: '#aaa' }}>Total Value:</span>{" "}
      <span style={{ fontWeight: 600 }}>
        {hit.total_value?.toLocaleString()}
      </span>
    </div>

    {/* Assists (with tooltip for usernames) */}
    <div style={{ marginTop: 6 }}>
      <span style={{ color: '#aaa' }}>Assists:</span>{" "}
      {hit.assists_usernames && hit.assists_usernames.length > 0 ? (
        hit.assists_usernames.map((name, idx) => (
          <span
            key={name + idx}
            style={{
              background: "#181a1b",
              color: "#fff",
              borderRadius: 12,
              padding: "2px 10px",
              fontSize: 13,
              marginRight: 4,
              cursor: "pointer"
            }}
            title={`User ID: ${hit.assists?.[idx] || ""}\nUsername: ${name}`}
          >
            {name}
          </span>
        ))
      ) : (
        <span style={{ color: "#888" }}>None</span>
      )}
    </div>

    {/* Cargo items (on hover) */}
    <div style={{ marginTop: 6 }}>
      <span style={{ color: '#aaa' }}>Cargo Items:</span>{" "}
      <span
        style={{
          textDecoration: "underline dotted",
          cursor: "pointer",
          color: "#2d7aee"
        }}
        title={
          Array.isArray(hit.cargo)
            ? hit.cargo.map((c: any) => `${c.scuAmount}x ${c.commodity_name}`).join(", ")
            : ""
        }
      >
        Hover to view
      </span>
    </div>

    {/* Embedded video */}
    {hit.video_link && (
      <div style={{ marginTop: 10 }}>
        <iframe
          src={hit.video_link}
          title="Hit Video"
          style={{ width: "100%", minHeight: 220, border: "none", borderRadius: 6 }}
          allowFullScreen
        />
      </div>
    )}

    {/* Additional media links */}
    {hit.additional_media_links && hit.additional_media_links.length > 0 && (
      <div style={{ marginTop: 8 }}>
        <span style={{ color: '#aaa' }}>Additional Media:</span>{" "}
        {hit.additional_media_links.map((link, idx) => (
          <a
            key={link + idx}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#2d7aee",
              marginRight: 8,
              textDecoration: "underline"
            }}
          >
            Link {idx + 1}
          </a>
        ))}
      </div>
    )}
  </div>
);

export default PiracyHitCard;