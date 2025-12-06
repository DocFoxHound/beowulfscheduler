import React from "react";

interface ReaverTeamProps {
  dbUser: any;
}

export default function ReaverTeam({ dbUser }: ReaverTeamProps) {
  const handle = dbUser?.rsi_handle || dbUser?.username;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9em" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "0.2em" }}>
        <span style={{ fontSize: "0.8em", letterSpacing: "0.3em", color: "#f5d8a2", textTransform: "uppercase" }}>
          REAVER
        </span>
        <h3 style={{ margin: 0, fontSize: "1.45em", color: "#ffffff" }}>Deep Strike Detachment</h3>
        {handle && (
          <p style={{ margin: 0, fontSize: "0.85em", color: "#d7d7d7" }}>
            {handle}, Reaver tasking is live. Tactical telemetry will appear here once scrape targets are validated.
          </p>
        )}
      </header>

      <p style={{ margin: 0, lineHeight: 1.5 }}>
        Reavers are IronPoint's serious FPS team: structured OVO scrims, boarding rehearsals, and ground insertions aimed squarely at competing with other orgs.
      </p>
      <div
        style={{
          marginTop: "0.6em",
          padding: "0.6em 0.8em",
          borderRadius: "8px",
          background: "rgba(240,93,94,0.12)",
          border: "1px solid rgba(240,93,94,0.35)",
          fontSize: "0.85em",
          color: "#ffdede"
        }}
      >
        Team Captain: <strong>Stelias_X</strong>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px dashed rgba(255,255,255,0.2)",
        borderRadius: "10px",
        padding: "0.8em 1em",
        fontSize: "0.85em",
        lineHeight: 1.4
      }}>
        Competitive telemetry is wiring up now. Once feeds go live, this panel will auto-populate with scrim win rate versus named orgs,
        boarding breach success, and sabotage objective uptime.
      </div>

      <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.85em", lineHeight: 1.5 }}>
        <li>Requirement: Earn prestige <strong>RAIDER I</strong>.</li>
        <li>Assessment: Regular OVO blocks plus live boarding evaluations with Reaver command.</li>
        <li>Focus: OVO engagements, precision boarding, and targeted sabotage operations.</li>
      </ul>

      <p style={{ margin: 0, fontSize: "0.8em", color: "#b6b6b6" }}>
        Ping the Reaver cadre if you're ready for structured reps and measurable performance against peer orgs.
      </p>
    </div>
  );
}
