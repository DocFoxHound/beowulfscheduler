import { LeaderboardColumn } from "../components/LeaderboardTable";

const killTrackerColumns: LeaderboardColumn<any>[] = [
  {
    key: "rank",
    title: "#",
    align: "center",
    render: (_row, idx) => idx + 1,
  },
  {
    key: "name",
    title: "Name",
    render: row => row.nickname || row.username || row.user_id,
  },
  {
    key: "fps_kills_ac",
    title: "FPS Kills (AC)",
    render: row => row.fps_kills_ac ?? 0,
    sortable: true,
    sortAccessor: row => Number(row.fps_kills_ac) || 0,
  },
  {
    key: "fps_kills_pu",
    title: "FPS Kills (PU)",
    render: row => row.fps_kills_pu ?? 0,
    sortable: true,
    sortAccessor: row => Number(row.fps_kills_pu) || 0,
  },
  {
    key: "fps_kills_total",
    title: "FPS Kills (Total)",
    render: row => row.fps_kills_total ?? 0,
    sortable: true,
    sortAccessor: row => Number(row.fps_kills_total) || 0,
  },
  {
    key: "ship_kills_total",
    title: "Ship Kills (Total)",
    render: row => row.ship_kills_total ?? 0,
    sortable: true,
    sortAccessor: row => Number(row.ship_kills_total) || 0,
  }
];

export default killTrackerColumns;