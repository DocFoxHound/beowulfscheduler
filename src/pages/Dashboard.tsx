import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import { getUserById, getUserRank } from "../api/userService";
import { useUserContext } from "../context/UserContext"; // <-- Import the context hook
import DashboardGraphs from "../components/DashboardGraphs"; // Add this import
import Navbar from "../components/Navbar";
import { fetchFleetByMember } from "../api/fleetApi"; // Add this import
import DashboardTopPlayers from "../components/DashboardTopPlayers"; // Add this import

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const { dbUser, setDbUser, userRank, setUserRank } = useUserContext(); 
  const [fleet, setFleet] = useState<any>(null); // Add fleet state

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_USER_URL : import.meta.env.VITE_TEST_USER_URL}`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user && user.id) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user, setDbUser]);

  useEffect(() => {
    if (dbUser && dbUser.id) {
      getUserRank(dbUser.rank)
        .then((data) => setUserRank(data))
        .catch(() => setUserRank(null));
    }
  }, [dbUser, setUserRank]);

  useEffect(() => {
    if (user && user.id) {
      fetchFleetByMember(user.id)
        .then((fleet) => setFleet(fleet))
        .catch(() => setFleet(null));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <Navbar />

      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Welcome, {user.username}#{user.discriminator}</h1>
          <p>Rank: {userRank?.name ? userRank.name : "Unknown"}</p>
          <img
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
            alt="User Avatar"
            className="avatar"
          />
        </section>

        <section className="dashboard-grid">
          {/* Left column: RecentOtherHits */}
          <div className="card recent-other-hits">
            <DashboardGraphs />
          </div>

          {/* Middle column: Top Players */}
          <div className="card fleet-performance">
            <DashboardTopPlayers />
          </div>

          {/* Right Column: Fleet Assignment card */}
          <div className="card">
            <h2>Fleet Assignment</h2>
            {fleet ? (
              <>
                <h4>{fleet.name}</h4>
                {fleet.avatar && (
                  <img
                    src={fleet.avatar}
                    alt="Fleet Avatar"
                    style={{ width: "64px", height: "64px", borderRadius: "8px", marginBottom: "8px" }}
                  />
                )}
                <p>
                  <strong>Primary Mission:</strong> {fleet.primary_mission || "N/A"}
                </p>
                <p>
                  <strong>Secondary Mission:</strong> {fleet.secondary_mission || "N/A"}
                </p>
                {fleet.commander_id === user.id && (
                  <p style={{ color: "green", fontWeight: "bold" }}>You are the Fleet Commander</p>
                )}
              </>
            ) : (
              <p>No fleet assignment found.</p>
            )}
          </div>

          
        </section>
      </main>
    </div>
  );
}
