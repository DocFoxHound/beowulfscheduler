import { LeaderboardColumn } from "../components/LeaderboardTable";

const piracyColumns: LeaderboardColumn<any>[] = [
  {
    key: "rank",
    title: "#",
    align: "center",
    render: (_row, idx) => idx + 1,
  },
  {
    key: "username",
    title: "Username",
    render: row => row.username || row.nickname || row.player_id,
  },
  {
    key: "hits_created",
    title: "Hits",
    render: row => row.hits_created ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.hits_created) || 0,
  },
  {
    key: "air_count",
    title: "Air",
    render: row => row.air_count ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.air_count) || 0,
  },
  {
    key: "ground_count",
    title: "Ground",
    render: row => row.ground_count ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.ground_count) || 0,
  },
  {
    key: "mixed_count",
    title: "Mixed",
    render: row => row.mixed_count ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.mixed_count) || 0,
  },
  {
    key: "brute_force_count",
    title: "Brute Force",
    render: row => row.brute_force_count ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.brute_force_count) || 0,
  },
  {
    key: "extortion_count",
    title: "Extortion",
    render: row => row.extortion_count ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.extortion_count) || 0,
  },
  {
    key: "total_value",
    title: "Total Value",
    render: row => row.total_value?.toLocaleString() ?? "-",
    sortable: true,
    sortAccessor: row => row.total_value,
  },
];

export default piracyColumns;