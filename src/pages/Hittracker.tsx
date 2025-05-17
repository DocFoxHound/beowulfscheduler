import React, { useEffect, useState } from 'react';
import OverviewPanel from '../components/OverviewPanel';
import RecentPirateHits from '../components/RecentPirateHits';
import WarehouseItems from '../components/WarehouseItems';
import { getLatestPatch } from '../api/patchApi';
import { getUserById } from "../api/userService";
import { useUserContext } from "../context/UserContext";
import axios from "axios";
import './Hittracker.css';

const Hittracker: React.FC = () => {
  const { dbUser, setDbUser } = useUserContext();
  const [user, setUser] = useState<any>(null);
  const [gameVersion, setGameVersion] = useState<string | null>(null);

  // Fetch Discord user if dbUser is not set
  useEffect(() => {
    if (!dbUser) {
      axios
        .get(`${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_USER_URL : import.meta.env.VITE_TEST_USER_URL}`, { withCredentials: true })
        .then((res) => setUser(res.data))
        .catch(() => setUser(null));
    }
  }, [dbUser]);

  // Fetch dbUser from backend if Discord user is available and dbUser is not set
  useEffect(() => {
    if (!dbUser && user && user.id) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user, dbUser, setDbUser]);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const patches = await getLatestPatch();
        // If getLatestPatch returns a single Patch object, use patches.version
        // If it returns an array, use patches[0].version
        if (Array.isArray(patches) && patches.length > 0) {
          setGameVersion(patches[0].version);
        } else if (patches && typeof patches.version === "string") {
          setGameVersion(patches.version);
        } else {
          setGameVersion(null);
        }
      } catch (e) {
        setGameVersion(null);
      }
    };
    fetchVersion();
  }, []);

  // Optionally, show a loading state if dbUser is still being fetched
  if (!dbUser) {
    return <div>Not logged in.</div>;
  }

  return (
    <div className="hittracker-root">
      <header className="navbar">
        <div className="navbar-title">IronPoint</div>
        <nav className="navbar-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/scheduler">Training Scheduler</a>
          <a href="/hittracker">Hits</a>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Hit Tracker</h1>
          <p>Track your hits and performance.</p>
        </section>

        <div className="hittracker-layout">
          <div className="column overview-panel-column">
            <OverviewPanel />
          </div>
          <div className="column warehouse-items">
            <WarehouseItems gameVersion={gameVersion} user_id={dbUser?.id ?? null} />
          </div>
          <div className="column recent-pirate-hits">
            <RecentPirateHits gameVersion={gameVersion} user_id={dbUser?.id ?? null} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hittracker;