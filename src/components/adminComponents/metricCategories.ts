// Metric categories for TriggersWindow
// Extend or edit as needed for new metrics

export const METRIC_CATEGORIES = [
  {
    label: "Dogfighting",
    options: [
      { metric: "shipackills", label: "Ship Kills in AC" },
      { metric: "shippukills", label: "Ship Kills in PU" },
      { metric: "shipkills", label: "Ship Kills Total" },
      { metric: "shipacdamages", label: "Ship Damages in AC" },
      { metric: "shippudamages", label: "Ship Damages in PU" },
      { metric: "shipdamages", label: "Ship Damages Total" },
      // { metric: "shipbountyrank", label: "Ship Bounty (Rank) Kills", tooltip: "Player Kills || is/isn't/greater/less || this many times || RANK." },
      // { metric: "shipbountyprestige", label: "Ship Bounty (Prestige) Kills", tooltip: "Player Kills || is/isn't/greater/less || this many times || PRESTIGE || Prestige Level." },
      // { metric: "shipbountyplayer", label: "Ship Bounty (Player) Kills", tooltip: "Player Kills || is/isn't/greater/less || this many times || PLAYER (exact RSI handle)." },
      { metric: "shipsbleaderboardrank", label: "SB Leaderboard Rank"},
    ],
  },
  {
    label: "FPS",
    options: [
      { metric: "fpsackills", label: "FPS Kills in AC" },
      { metric: "fpspukills", label: "FPS Kills in PU" },
      { metric: "fpskills", label: "FPS Kills Total" },
      // { metric: "fpsbountyrank", label: "FPS Bounty (Rank) Kills", tooltip: "Player Kills || is/isn't/greater/less || this many times || RANK." },
      // { metric: "fpsbountyprestige", label: "FPS ounty (Prestige) Kills", tooltip: "Player Kills || is/isn't/greater/less || this many times || PRESTIGE || Prestige Level." },
      // { metric: "fpsbountyplayer", label: "FPS Bounty (Player) Kills", tooltip: "Player Kills || is/isn't/greater/less || this many times || PLAYER (exact RSI handle)." },
    ],
  },
  {
    label: "Piracy",
    options: [
      { metric: "piracyscustolen", label: "Piracy SCU Stolen" },
      { metric: "piracyvaluestolen", label: "Piracy Value Stolen" },
      { metric: "piracyhits", label: "Piracy Hits Participated" },
      { metric: "piracyhitspublished", label: "Piracy Hits Published" },
    ],
  },
  {
    label: "Fleet Actions",
    options: [
      { metric: "fleetleads", label: "Fleet Leads" },
      { metric: "fleetassists", label: "Fleet Assists" },
      { metric: "fleetparticipated", label: "Fleet Participated" },
      { metric: "fleetkills", label: "Fleet Kills" },
      { metric: "fleetscu", label: "Fleet SCU Stolen" },
      { metric: "fleetvalue", label: "Fleet Value Stolen" },
      { metric: "fleetdamages", label: "Fleet Damages" },
    ],
  },
  {
    label: "Prestige",
    options: [
      { metric: "corsair", label: "CORSAIR", tooltip: "Player's Prestige Level || is/isn't/greater/less || Prestige Level" },
      { metric: "raider", label: "RAIDER", tooltip: "Player's Prestige Level || is/isn't/greater/less || Prestige Level" },
      { metric: "raptor", label: "RAPTOR", tooltip: "Player's Prestige Level || is/isn't/greater/less || Prestige Level" },
    ],
  },
  {
    label: "Rank",
    options: [
      { metric: "prospect", label: "Prospect" },
      { metric: "crew", label: "Crew" },
      { metric: "marauder", label: "Marauder" },
      { metric: "blooded", label: "Blooded" },
    ],
  },
  {
    label: "Role",
    options: [
      { metric: "ronin", label: "Ronin" },
      { metric: "fleetcommander", label: "Fleet Commander" },
    ],
  },
];
