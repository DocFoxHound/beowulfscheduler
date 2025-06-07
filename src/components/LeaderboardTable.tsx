import React, { useState, useMemo } from "react";
import Select from "react-select";
import { SBLeaderboardPlayerSummary } from "../types/sb_leaderboard_summary";

export interface LeaderboardColumn<T> {
  key: string;
  title: string;
  render: (row: T, idx: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sortAccessor?: (row: T) => any; // Optional: custom accessor for sorting
}

interface LeaderboardTableProps<T> {
  data: T[];
  loading: boolean;
  selectedRow: T | null;
  pagedData: T[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  columns: LeaderboardColumn<T>[];
}

type SortState = {
  key: string;
  direction: "asc" | "desc";
} | null;

function LeaderboardTable<T extends { [key: string]: any }>({
  data,
  loading,
  selectedRow,
  pagedData,
  page,
  pageCount,
  onPageChange,
  pageSize,
  columns,
}: LeaderboardTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<T | null>(null);

  // Prepare options for react-select
  const playerOptions = useMemo(() => data.map((player: any) => ({
    value: player.nickname,
    label: player.displayname || player.nickname,
    player,
  })), [data]);

  // Find the currently selected option
  const selectedOption = playerOptions.find(opt => opt.value === (selectedPlayer as any)?.nickname) || null;

  // Custom filter for react-select to match nickname or displayname
  const filterOption = (option: any, inputValue: string) => {
    const { player } = option.data;
    const search = inputValue.toLowerCase();
    return (
      (player.nickname && player.nickname.toLowerCase().includes(search)) ||
      (player.displayname && player.displayname.toLowerCase().includes(search))
    );
  };

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find(c => c.key === sort.key);
    if (!col) return data;
    const accessor = col.sortAccessor || ((row: T) => row[col.key]);
    return [...data].sort((a, b) => {
      const aValue = accessor(a);
      const bValue = accessor(b);
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sort.direction === "asc" ? -1 : 1;
      if (bValue == null) return sort.direction === "asc" ? 1 : -1;
      if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort, columns]);

  // Use sorted data for pagination or selected player
  const paged = selectedPlayer ? [selectedPlayer] : sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (col: LeaderboardColumn<T>) => {
    if (!col.sortable) return;
    setSort(prev => {
      if (!prev || prev.key !== col.key) return { key: col.key, direction: "asc" };
      if (prev.direction === "asc") return { key: col.key, direction: "desc" };
      return null; // Remove sort
    });
  };

  // Reset page when selectedPlayer or data changes
  React.useEffect(() => {
    onPageChange(0);
  }, [selectedPlayer, data]);

  return (
    <div
      style={{
        background: "#23272a",
        borderRadius: 8,
        padding: "2rem",
        minWidth: 400,
        maxWidth: 1100,
        width: "100%",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ minWidth: 300, maxWidth: 500, width: "100%", margin: "0 auto 1.5rem auto" }}>
        <Select
          inputId="player-select"
          options={playerOptions}
          value={selectedOption}
          onChange={opt => setSelectedPlayer(opt?.player ?? null)}
          placeholder="Type a nickname or display name..."
          isSearchable
          filterOption={filterOption}
          styles={{
            control: (base) => ({
              ...base,
              background: "#1a1d21",
              borderColor: "#2d7aee",
              color: "#fff",
              minHeight: 44,
              fontSize: 16,
            }),
            menu: (base) => ({
              ...base,
              background: "#23272a",
              color: "#fff",
            }),
            option: (base, state) => ({
              ...base,
              background: state.isFocused ? "#2d7aee" : "#23272a",
              color: "#fff",
              cursor: "pointer",
            }),
            singleValue: (base) => ({
              ...base,
              color: "#fff",
            }),
            input: (base) => ({
              ...base,
              color: "#fff",
            }),
          }}
          theme={theme => ({
            ...theme,
            borderRadius: 8,
            colors: {
              ...theme.colors,
              primary25: "#2d7aee",
              primary: "#2d7aee",
              neutral0: "#23272a",
              neutral80: "#fff",
            },
          })}
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table style={{ width: "100%", color: "#fff", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #2d7aee" }}>
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={{
                      padding: "8px",
                      textAlign: col.align || "left",
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                    }}
                    onClick={() => handleSort(col)}
                  >
                    {col.title}
                    {col.sortable && (
                      <span style={{ marginLeft: 6 }}>
                        {sort?.key === col.key
                          ? sort.direction === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, idx) => (
                <tr
                  key={row.nickname || idx}
                  style={{
                    background:
                      selectedPlayer && (selectedPlayer.nickname === row.nickname)
                        ? "#2d7aee33"
                        : "inherit",
                  }}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: "8px",
                        textAlign: col.align || "left",
                      }}
                    >
                      {col.render(row, selectedPlayer ? 0 : page * pageSize + idx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!selectedPlayer && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1.5rem",
                gap: "1rem",
              }}
            >
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                style={{
                  background: "#2d7aee",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 16px",
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  opacity: page === 0 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ color: "#fff", alignSelf: "center" }}>
                Page {page + 1} of {pageCount}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page + 1 >= pageCount}
                style={{
                  background: "#2d7aee",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 16px",
                  cursor: page + 1 >= pageCount ? "not-allowed" : "pointer",
                  opacity: page + 1 >= pageCount ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LeaderboardTable;