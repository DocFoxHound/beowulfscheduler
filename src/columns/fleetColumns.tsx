import { LeaderboardColumn } from "../components/LeaderboardTable";

const fleetColumns: LeaderboardColumn<any>[] = [
  {
    key: "rank",
    title: "#",
    align: "center",
    render: (_row, idx) => idx + 1,
  },
  {
    key: "name",
    title: "Name",
    align: "center",
    render: (row) => row.nickname || row.username,
  },
  {
    key: "patch",
    title: "Patch",
    align: "center",
    render: (row) => row.patch,
  },
  {
    key: "command_times",
    title: "Command Times",
    align: "center",
    render: (row) => row.command_times,
    sortable: true,
    sortAccessor: (row) => Number(row.command_times) || 0,
  },
  {
    key: "air_sub_times",
    title: "Air Sub Times",
    align: "center",
    render: (row) => row.air_sub_times,
    sortable: true,
    sortAccessor: (row) => Number(row.air_sub_times) || 0,
  },
  {
    key: "fps_sub_times",
    title: "FPS Sub Times",
    align: "center",
    render: (row) => row.fps_sub_times,
    sortable: true,
    sortAccessor: (row) => Number(row.fps_sub_times) || 0,
  },
  {
    key: "crew_times",
    title: "Crew Times",
    align: "center",
    render: (row) => row.crew_times,
    sortable: true,
    sortAccessor: (row) => Number(row.crew_times) || 0,
  },
  {
    key: "total_activity",
    title: "Total Fleet Activity",
    align: "center",
    render: (row) => row.total_activity,
    sortable: true,
    sortAccessor: (row) => Number(row.total_activity) || 0,
  },
  {
    key: "fleet_avatar",
    title: "Favorite Fleet",
    align: "center",
    render: (row) =>
      row.fleet_avatar ? (
        <img
          src={row.fleet_avatar}
          alt="Fleet Avatar"
          title={row.favorite_fleet}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
          }}
        />
      ) : null,
  },
];

export default fleetColumns;