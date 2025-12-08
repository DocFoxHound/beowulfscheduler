import { LeaderboardColumn } from "../components/LeaderboardTable";

const sbColumns: LeaderboardColumn<any>[] = [
  {
    key: "rank",
    title: "#",
    align: "center",
    render: (row) => row.sort_rank ?? "-",
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
    key: "total_rating",
    title: "Rating Sum",
    render: row => row.total_rating ?? "-",
    sortable: true,
    sortAccessor: row => Number(row.total_rating) || 0,
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
    key: "total_kda",
    title: "K/D Ratio",
    render: row => {
      const ratio = Number(row.total_kda);
      if (!Number.isFinite(ratio)) return "-";
      return Number.isFinite(ratio) ? ratio.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-";
    },
    sortable: true,
    sortAccessor: row => {
      const kills = Number(row.total_kills);
      const deaths = Number(row.total_deaths);
      return Number.isFinite(kills) && Number.isFinite(deaths) && deaths > 0 ? kills / deaths : 0;
    },
  },
  // {
  //   key: "modified_rating",
  //   title: "Modified Score",
  //   render: row => row.modified_rating?.toFixed(3) ?? "-",
  //   sortable: true,
  //   sortAccessor: row => Number(row.modified_rating) || 0,
  // },
  // {
  //   key: "killsteal_modified_rating",
  //   title: "Killsteal-Modified Score",
  //   render: row => row.killsteal_modified_rating?.toFixed(3) ?? "-",
  //   sortable: true,
  //   sortAccessor: row => Number(row.killsteal_modified_rating) || 0,
  // },
];

export default sbColumns;