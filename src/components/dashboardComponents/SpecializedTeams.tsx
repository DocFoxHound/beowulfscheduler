import React from "react";
import { SBLeaderboardOrgSummary } from "../../types/sb_leaderboard_org_summary";
import RoninTeam from "./RoninTeam";
import ReaverTeam from "./ReaverTeam";
import { hasRoleMatch, splitRoleIds } from "../../utils/roleUtils";

// Get role IDs from environment variables and split by comma
const RONIN_IDS = splitRoleIds(import.meta.env.VITE_RONIN_ID);
const REAVER_IDS = splitRoleIds(import.meta.env.VITE_REAVER_ID);

// props
type TeamKey = "ronin" | "reaver";

interface SpecializedTeamsProps {
  dbUser: any;
  orgSummaries?: SBLeaderboardOrgSummary[];
  latestPatch?: string;
  includeTeams?: TeamKey[];
}

type CardStyle = {
  background: string;
  borderColor: string;
  shadow?: string;
  padding?: string;
};

const renderCard = (key: string, style: CardStyle, children: React.ReactNode) => (
  <section
    key={key}
    style={{
      background: style.background,
      borderRadius: "12px",
      boxShadow: style.shadow || "0 2px 12px rgba(0,0,0,0.2)",
      margin: "2em 0",
      padding: style.padding || "2em 1.5em",
      border: `2px solid ${style.borderColor}`,
      display: "flex",
      flexDirection: "column",
      gap: "0.75em"
    }}
  >
    {children}
  </section>
);

interface TeamCardConfig {
  key: TeamKey;
  isMember: boolean;
  renderMember: () => React.ReactNode;
  renderPromo: () => React.ReactNode;
}

export default function SpecializedTeams({ dbUser, orgSummaries, includeTeams }: SpecializedTeamsProps) {
  const userRoles = Array.isArray(dbUser?.roles) ? dbUser.roles : [];
  const isRonin = hasRoleMatch(userRoles, RONIN_IDS);
  const isReaver = hasRoleMatch(userRoles, REAVER_IDS);
  const isFleetMember = dbUser?.fleetId != null; // using != for both null & undefined

  const teamCards: TeamCardConfig[] = [
    {
      key: "ronin",
      isMember: isRonin,
      renderMember: () =>
        renderCard(
          "ronin-member",
          {
            background: "linear-gradient(90deg, #232526 0%, #414345 100%)",
            borderColor: "#ffd700",
            shadow: "0 2px 12px rgba(0,0,0,0.13)",
            padding: "2em 1em"
          },
          <RoninTeam dbUser={dbUser} orgSummaries={orgSummaries} />
        ),
      renderPromo: () =>
        renderCard(
          "ronin-promo",
          {
            background: "linear-gradient(90deg, #1f1f1f 0%, #2e2e2e 100%)",
            borderColor: "#ffd700",
            shadow: "0 2px 12px rgba(0,0,0,0.25)"
          },
          <>
            <h2 style={{ margin: 0, fontSize: "1.6em", letterSpacing: "0.05em", color: "#ffd700" }}>Ronin Team</h2>
            <p style={{ margin: "0 0 0.5em", fontSize: "0.95em", lineHeight: 1.4 }}>
              IronPoint's competitive Dogfighting team. Elite pilots pushing the limits in structured squad combat and high-stakes duels. Ronins took 4th place in the annual CiG-sponsored Fight-or-Flight competition in 2025.
            </p>
            <div style={{
              margin: "0.4em 0 0.6em",
              padding: "0.55em 0.7em",
              borderRadius: "8px",
              background: "rgba(255,215,0,0.08)",
              border: "1px solid rgba(255,215,0,0.25)",
              fontSize: "0.83em",
              color: "#f7f2d0"
            }}>
              Team Captain: <strong>K0zuka</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.85em", lineHeight: 1.4 }}>
              <li>Requirement: Earn prestige <strong>RAPTOR I</strong>.</li>
              <li>Assessment: Performance review & skill check by <strong>Kozuka</strong>.</li>
              <li>Focus: Advanced maneuvers, comms discipline, dueling proficiency, teamfighting proficiency.</li>
            </ul>
            <div style={{ display: "flex", gap: "0.75em", marginTop: "0.75em", flexWrap: "wrap" }}>
              {!isFleetMember && (
                <span
                  style={{
                    background: "#ffd700",
                    color: "#121212",
                    padding: "0.4em 0.8em",
                    borderRadius: "8px",
                    fontSize: "0.75em",
                    fontWeight: 600,
                    letterSpacing: "0.05em"
                  }}
                >
                  OPEN TO APPLICATIONS
                </span>
              )}
              <span style={{ background: "#333", color: "#eee", padding: "0.4em 0.8em", borderRadius: "8px", fontSize: "0.75em", fontWeight: 500 }}>
                Competitive
              </span>
              <span style={{ background: "#333", color: "#eee", padding: "0.4em 0.8em", borderRadius: "8px", fontSize: "0.75em", fontWeight: 500 }}>
                Dogfighting
              </span>
            </div>
            <p style={{ margin: "0.75em 0 0", fontSize: "0.75em", color: "#bbb" }}>
              Reach the standard. Prove consistency. Then contact <strong>Kozuka</strong> for an assessment flight.
            </p>
          </>
        )
    },
    {
      key: "reaver",
      isMember: isReaver,
      renderMember: () =>
        renderCard(
          "reaver-member",
          {
            background: "linear-gradient(120deg, #1b1d29 0%, #2d1f1f 100%)",
            borderColor: "#f05d5e",
            shadow: "0 2px 14px rgba(240,93,94,0.15)",
            padding: "2em 1.3em"
          },
          <ReaverTeam dbUser={dbUser} />
        ),
      renderPromo: () =>
        renderCard(
          "reaver-promo",
          {
            background: "linear-gradient(110deg, #1a1a1d 0%, #2a1f2f 100%)",
            borderColor: "#f05d5e",
            shadow: "0 2px 12px rgba(0,0,0,0.25)"
          },
          <>
            <h2 style={{ margin: 0, fontSize: "1.55em", letterSpacing: "0.04em", color: "#f05d5e" }}>Reaver Team</h2>
            <p style={{ margin: "0 0 0.6em", fontSize: "0.92em", lineHeight: 1.45 }}>
              Reavers are IronPoint's serious FPS team: structured OVO scrims, boarding rehearsals, and ground insertions aimed squarely at competing with other orgs.
            </p>
            <div style={{
              margin: "0.4em 0 0.6em",
              padding: "0.55em 0.7em",
              borderRadius: "8px",
              background: "rgba(240,93,94,0.12)",
              border: "1px solid rgba(240,93,94,0.35)",
              fontSize: "0.83em",
              color: "#ffdede"
            }}>
              Team Captain: <strong>Stelias_X</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.85em", lineHeight: 1.4 }}>
              <li>Requirement: Earn prestige <strong>RAIDER I</strong>.</li>
              <li>Assessment: Contact the REAVER Team Lead for an assessment.</li>
              <li>Focus: OVO engagements, precision boarding, and targeted sabotage operations.</li>
            </ul>
            <div style={{ display: "flex", gap: "0.75em", marginTop: "0.75em", flexWrap: "wrap" }}>
              {!isFleetMember && (
                <span
                  style={{
                    background: "#f05d5e",
                    color: "#121212",
                    padding: "0.4em 0.8em",
                    borderRadius: "8px",
                    fontSize: "0.75em",
                    fontWeight: 600,
                    letterSpacing: "0.05em"
                  }}
                >
                  OPEN TO APPLICATIONS
                </span>
              )}
              <span style={{ background: "#352f44", color: "#eee", padding: "0.4em 0.8em", borderRadius: "8px", fontSize: "0.75em", fontWeight: 500 }}>
                Spec Ops
              </span>
              <span style={{ background: "#352f44", color: "#eee", padding: "0.4em 0.8em", borderRadius: "8px", fontSize: "0.75em", fontWeight: 500 }}>
                Boarding
              </span>
            </div>
            <p style={{ margin: "0.75em 0 0", fontSize: "0.78em", color: "#c9c9c9" }}>
              Competitive telemetry is wiring up; register interest now to secure a slot in the next measured training block.
            </p>
          </>
        )
    }
  ];

  const allowedKeys = includeTeams && includeTeams.length > 0 ? includeTeams : teamCards.map((team) => team.key);

  return (
    <div className="specialized-teams">
      {teamCards
        .filter((card) => allowedKeys.includes(card.key))
        .map((card) => (card.isMember ? card.renderMember() : card.renderPromo()))}
    </div>
  );
}
