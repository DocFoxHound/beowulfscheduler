import React from "react";
import { SBLeaderboardOrgSummary } from "../../types/sb_leaderboard_org_summary";
import RoninTeam from "./RoninTeam";
import FleetCommandTeam from "./FleetCommandTeam";
// Get role IDs from environment variables and split by comma
const RONIN_IDS = (import.meta.env.VITE_RONIN_ID || "").split(",").map((id: string) => id.trim()).filter(Boolean);
const FLEET_COMMANDER_IDS = (import.meta.env.VITE_FLEET_COMMANDER || "").split(",").map((id: string) => id.trim()).filter(Boolean);

// props
interface SpecializedTeamsProps {
  dbUser: any;
  orgSummaries?: SBLeaderboardOrgSummary[]; // Optional prop for org summaries
  latestPatch: string; // Optional prop for latest patch version
}

export default function SpecializedTeams({ dbUser, orgSummaries, latestPatch }: SpecializedTeamsProps) {
  const userRoles = dbUser?.roles || [];
  const isRonin = userRoles.some((role: string) => RONIN_IDS.includes(role));
  const isFleetCommander = userRoles.some((role: string) => FLEET_COMMANDER_IDS.includes(role));
  // Treat null or undefined fleetId as not a member
  const isFleetMember = dbUser?.fleetId != null; // using != for both null & undefined

  const sections: React.ReactNode[] = [];

  if (isRonin) {
    sections.push(
      <section
        key="ronin-section"
        style={{
          background: 'linear-gradient(90deg, #232526 0%, #414345 100%)',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.13)',
          margin: '2em 0',
          padding: '2em 1em',
          border: '2px solid #ffd700',
        }}
      >
        <RoninTeam dbUser={dbUser} orgSummaries={orgSummaries} />
      </section>
    );
  } else {
    // Promotional Ronin card if user not in Ronin yet; also show even if on no team.
    sections.push(
      <section
        key="ronin-promo"
        style={{
          background: 'linear-gradient(90deg, #1f1f1f 0%, #2e2e2e 100%)',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          margin: '2em 0',
          padding: '2em 1.5em',
          border: '2px solid #ffd700',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75em'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.6em', letterSpacing: '0.05em', color: '#ffd700' }}>Ronin Team</h2>
        <p style={{ margin: '0 0 0.5em', fontSize: '0.95em', lineHeight: 1.4 }}>
          IronPoint's competitive Dogfighting team. Elite pilots pushing the limits in structured squad combat and high-stakes duels. Ronins took 4th place in the annual CiG-sponsored Fight-or-Flight competition in 2025
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.2em', fontSize: '0.85em', lineHeight: 1.4 }}>
          <li>Requirement: Earn prestige <strong>RAPTOR I</strong>.</li>
          <li>Assessment: Performance review & skill check by <strong>Kozuka</strong>.</li>
          <li>Focus: Advanced maneuvers, comms discipline, dueling proficiency, teamfighting proficiency.</li>
        </ul>
        <div style={{ display: 'flex', gap: '0.75em', marginTop: '0.75em', flexWrap: 'wrap' }}>
          {!isFleetMember && (
            <span style={{
              background: '#ffd700',
              color: '#121212',
              padding: '0.4em 0.8em',
              borderRadius: '8px',
              fontSize: '0.75em',
              fontWeight: 600,
              letterSpacing: '0.05em'
            }}>OPEN TO APPLICATIONS</span>
          )}
          <span style={{
            background: '#333',
            color: '#eee',
            padding: '0.4em 0.8em',
            borderRadius: '8px',
            fontSize: '0.75em',
            fontWeight: 500
          }}>Competitive</span>
          <span style={{
            background: '#333',
            color: '#eee',
            padding: '0.4em 0.8em',
            borderRadius: '8px',
            fontSize: '0.75em',
            fontWeight: 500
          }}>Dogfighting</span>
        </div>
        <p style={{ margin: '0.75em 0 0', fontSize: '0.75em', color: '#bbb' }}>
          Reach the standard. Prove consistency. Then contact <strong>Kozuka</strong> for an assessment flight.
        </p>
      </section>
    );
  }

  // Future: add Fleet Commander / member specific sections here.

  return <div className="specialized-teams">{sections}</div>;
}
