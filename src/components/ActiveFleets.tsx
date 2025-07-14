import React, { useEffect, useState } from "react";
import { fetchRecentShipLogsByFleet } from "../api/fleetLogApi";
import ActiveFleetCard from "./ActiveFleetCard";
import { FleetLog } from "../types/fleet_log";
import { UserFleet } from "../types/fleet";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import { User } from "../types/user";

interface ActiveFleetsProps {
  fleets: UserFleet[];
  allUsers: User[];
  userId: string;
  isNotInAnyFleet: boolean;
  dbUser: User; // <-- Add this
}

const ActiveFleets: React.FC<ActiveFleetsProps> = ({ fleets, allUsers, isNotInAnyFleet, userId, dbUser }) => {
  const [fleetLogsMap, setFleetLogsMap] = useState<Record<string, FleetLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fleetsPerPage = 10;
  const totalPages = Math.ceil(fleets.length / fleetsPerPage);

  useEffect(() => {
    const fetchAllLogs = async () => {
      setLoading(true);
      const logsMap: Record<string, FleetLog[]> = {};
      await Promise.all(
        fleets.map(async (fleet) => {
          if (!fleet.id) return;
          try {
            const logs = await fetchRecentShipLogsByFleet(String(fleet.id));
            logsMap[String(fleet.id)] = logs;
          } catch {
            logsMap[String(fleet.id)] = [];
          }
        })
      );
      setFleetLogsMap(logsMap);
      setLoading(false);
    };
    fetchAllLogs();
  }, [fleets]);

  // Sort fleets by total_events_patch (descending)
  const sortedFleets = [...fleets].sort((a, b) => {
    const aEvents = a.total_events_patch ?? 0;
    const bEvents = b.total_events_patch ?? 0;
    return bEvents - aEvents;
  });

  // Pagination logic
  const startIdx = (currentPage - 1) * fleetsPerPage;
  const paginatedFleets = sortedFleets.slice(startIdx, startIdx + fleetsPerPage);

  // Prepare data for the bar chart (top 10 fleets)
  const chartData = sortedFleets.slice(0, 10).map(fleet => ({
    name: fleet.name || `Fleet ${fleet.id}`,
    total_events_patch: fleet.total_events_patch ?? 0,
  }));

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{
          background: "#1a1d21",
          color: "#fff",
          borderRadius: 8,
          padding: "1rem",
          textAlign: "center",
          fontWeight: "bold"
        }}>
          Most Active Fleets (Last 3 Months)
          <div style={{ marginTop: 16, width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 24 }}>
                <CartesianGrid stroke="#222" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} interval={0} />
                <Bar dataKey="total_events_patch" fill="#2d7aee">
                  <LabelList dataKey="total_events_patch" position="right" fill="#fff" fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div>
        {loading && <div>Loading fleets...</div>}
        {!loading && sortedFleets.length === 0 && <div>No fleets found.</div>}
        {!loading && paginatedFleets.map((fleet) => {
          const commander_username =
            allUsers.find(u => String(u.id) === String(fleet.commander_id))?.username || "";
          const original_commander_username =
            allUsers.find(u => String(u.id) === String(fleet.original_commander_id))?.username || "";
          const members_usernames = (fleet.members_ids || [])
            .map(id => allUsers.find(u => String(u.id) === String(id))?.username)
            .filter(Boolean) as string[];

          return (
            <ActiveFleetCard
              key={fleet.id}
              fleet={fleet}
              fleetLogs={fleetLogsMap[String(fleet.id)] || []}
              commander_username={commander_username}
              original_commander_username={original_commander_username}
              members_usernames={members_usernames}
              isNotInAnyFleet={isNotInAnyFleet}
              userId={String(userId)}
              dbUser={dbUser}
              onActionComplete={() => window.location.reload()} // <-- Add this line
            />
          );
        })}
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ marginRight: 8 }}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ marginLeft: 8 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveFleets;