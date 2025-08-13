import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import './Piracy.css';
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import axios from 'axios';
import { getUserById } from '../api/userService';
import { getLatestPatch, getAllGameVersions } from '../api/patchApi';
import OrgFleetStats from '../components/gangComponents/OrgGangStats';
import FleetLogFeed from '../components/gangComponents/gangLogFeed';
import PlayerGangStats from '../components/gangComponents/PlayerGangStats';
import { fetchRecentFleetsSummary } from '../api/recentGangsApi';

const Fleets2: React.FC = () => {
  const { dbUser, setDbUser } = useUserContext();
  const [user, setUser] = useState<any>(null);
  const [gameVersion, setGameVersion] = useState<string | null>(null);
  const [gameVersions, setGameVersions] = useState<{ value: string, label: string }[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [recentFleets, setRecentFleets] = useState<any[]>([]);
  const CREW_IDS = (import.meta.env.VITE_CREW_ID || "").split(",");
  const MARAUDER_IDS = (import.meta.env.VITE_MARAUDER_ID || "").split(",");
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
  const isMember = dbUser?.roles?.some((role: string) => CREW_IDS.includes(role) || MARAUDER_IDS.includes(role) || BLOODED_IDS.includes(role)) ?? false;
  
  // Fetch all game versions for the dropdown and set latest as default
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const versions = await getAllGameVersions();
        if (Array.isArray(versions)) {
          const sorted = versions.slice().sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
          const options = sorted.map(v => ({ value: v.version, label: v.version }));
          setGameVersions(options);
          if (options.length > 0) {
            setGameVersion(options[0].value);
          } else {
            setGameVersion(null);
          }
        }
      } catch (e) {
        setGameVersions([]);
        setGameVersion(null);
      }
    };
    fetchVersions();
  }, []);

  // Fetch summaryData and recentFleets when gameVersion changes
  useEffect(() => {
    const loadSummaryData = async () => {
      if (gameVersion) {
        const patch = String(gameVersion);
        const data = await fetchRecentFleetsSummary(patch, 500, 0);
        setSummaryData(data);
      } else {
        setSummaryData([]);
      }
    };
    loadSummaryData();

    const loadRecentFleets = async () => {
      if (gameVersion) {
        try {
          const fleets = await import('../api/recentGangsApi').then(mod => mod.fetchRecentFleetsByPatch(gameVersion));
          setRecentFleets(fleets);
        } catch {
          setRecentFleets([]);
        }
      } else {
        setRecentFleets([]);
      }
    };
    loadRecentFleets();
  }, [gameVersion]);
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

  // Optionally, show a loading state if dbUser is still being fetched
  if (!dbUser) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  return (
    <div className="hittracker-root">
      <Navbar dbUser={dbUser} />
      {/* Top header spanning full width */}
      <div className="fleets-header-fullwidth" style={{
        width: '100%',
        background: '#181a1b',
        borderRadius: 8,
        margin: '1.5rem 0 2rem 0',
        padding: '2rem 2rem 1.5rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <h1 style={{margin: 0}}>Gangs</h1>
        <p style={{margin: 0}}>Groups or Bands of players pillaging and raiding.</p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          width: '100%'
        }}>
          <Select
            inputId="gameversion-select"
            options={gameVersions}
            value={gameVersions.find(opt => opt.value === gameVersion) || null}
            onChange={opt => setGameVersion(opt?.value ?? null)}
            placeholder="Select patch version..."
            isSearchable
            isClearable={false}
            styles={{
              control: (base) => ({
                ...base,
                background: "#1a1d21",
                borderColor: "#2d7aee",
                color: "#fff",
                minHeight: 44,
                fontSize: 16,
                width: 200,
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
      </div>
      <main className="dashboard-content">
        <div className="hittracker-layout">
          <div className="column overview-panel-column" style={{textAlign: 'center'}}>
            <OrgFleetStats 
              dbUser={dbUser}
              gameVersion={gameVersion}
              summaryData={summaryData}
              recentFleets={recentFleets}
            />
          </div>
          <div className="column warehouse-items" style={{textAlign: 'center'}}>
            <FleetLogFeed
              isModerator={isModerator}
              dbUser={dbUser}
              isMember={isMember}
              recentFleets={recentFleets}
            />
          </div>
          <div className="column recent-pirate-hits" style={{textAlign: 'center'}}>
            <PlayerGangStats 
              dbUser={dbUser}
              gameVersion={gameVersion}
              summaryData={summaryData}
              displayType="Gang"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Fleets2;