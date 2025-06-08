import { LeaderboardColumn } from "../components/LeaderboardTable";

const sbColumns: LeaderboardColumn<any>[] = [
  {
    key: "rank",
    title: "#",
    align: "center",
    render: (_row, idx) => idx + 1,
  },
  {
    key: "account_media",
    title: "",
    align: "center",
    render: row =>
      row.account_media ? (
        <img
          src={row.account_media}
          alt="Account"
          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : null,
  },
  {
    key: "displayname",
    title: "Display Name",
    render: row => row.displayname,
  },
  {
    key: "org_media",
    title: "Org",
    align: "left",
    render: row =>
      row.org_media ? (
        <img
          src={row.org_media}
          alt="Org"
          title={row.symbol}
          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : null,
  },
  {
    key: "total_kills",
    title: "Kills",
    render: row =>
      row.total_kills != null
        ? Number(row.total_kills).toLocaleString()
        : "-",
    sortable: true,
    sortAccessor: row => Number(row.total_kills) || 0,
  },
  {
    key: "total_deaths",
    title: "Deaths",
    render: row =>
      row.total_deaths != null
        ? Number(row.total_deaths).toLocaleString()
        : "-",
    sortable: true,
    sortAccessor: row => Number(row.total_deaths) || 0,
  },
  {
    key: "avg_kill_death_ratio",
    title: "K/D Ratio",
    render: row =>
      row.avg_kill_death_ratio != null
        ? Number(row.avg_kill_death_ratio).toLocaleString()
        : "-",
    sortable: true,
    sortAccessor: row => Number(row.avg_kill_death_ratio) || 0,
  },
  {
    key: "avg_score",
    title: "Avg Score",
    render: row =>
      row.avg_score != null
        ? Number(row.avg_score).toLocaleString()
        : "-",
    sortable: true,
    sortAccessor: row => Number(row.avg_score) || 0,
  },
  {
    key: "avg_rank",
    title: "Avg RSI Rank",
    render: row => row.avg_rank ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.avg_rank) || 0,
  },
  {
    key: "ranking_score",
    title: "IronPoint Score",
    render: row => row.ranking_score?.toFixed(3) ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.ranking_score) || 0,
  },
];

export default sbColumns;