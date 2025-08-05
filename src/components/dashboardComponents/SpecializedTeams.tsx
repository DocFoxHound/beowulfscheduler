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
  const isFleetMember = dbUser?.fleetId !== null;
  let sections: React.ReactNode[] = [];
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
  }
  if (isFleetMember) {
    sections.push(
      <section
        key="fleet-commander-section"
        style={{
          background: 'linear-gradient(90deg, #232526 0%, #414345 100%)',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.13)',
          margin: '2em 0',
          padding: '2em 1em',
          border: '2px solid #00ff4cff',
        }}
      >
        <FleetCommandTeam dbUser={dbUser} latestPatch={latestPatch} isFleetMember={isFleetMember} />
      </section>
    );
  }
  if (!isRonin && !isFleetCommander) {
    sections.push(
      <div key="none">
        <h2>Specialized Teams</h2>
        <p>
          Interested in joining a specialized team? The RONIN team is for promising dogfighters and is joined by selection. Fleet Command is available to those who reach Crew rank and wish to lead their own fleet. Keep striving and you may be invited to join!
        </p>
      </div>
    );
  }

  return <div className="specialized-teams">{sections}</div>;
}
