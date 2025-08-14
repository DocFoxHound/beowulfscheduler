import React, { useEffect, useState } from 'react';
import Select from 'react-select'; // <-- Add this import
import OverviewPanel from '../components/hitComponents/PiracyOverviewPanel';
import RecentPirateHits from '../components/hitComponents/RecentPirateHits';
import WarehouseItems from '../components/WarehousePersonalItems';
import { getLatestPatch, getAllGameVersions } from '../api/patchApi';
import { getUserById, getAllUsers } from "../api/userService";
import { useUserContext } from "../context/UserContext";
import axios from "axios";
import { fetchPlayerRecentPirateHits, fetchAllPlayerPirateHits, fetchAllPlayerAssistHits, fetchAllHitsByPatch, fetchAllHitsByUserIdAndPatch } from '../api/hittrackerApi';
import { Hit } from '../types/hittracker';
import KillOverviewBoard from '../components/dashboardComponents/KillOverviewBoard';
import './Piracy.css';
import Modal from '../components/Modal'; // You may need to create this if it doesn't exist
import Navbar from '../components/Navbar';
import { fetchPlayerStatsByUserId, refreshPlayerStatsView, fetchAllPlayerStats } from "../api/playerStatsApi";
import PlayerGangStats from '../components/gangComponents/PlayerGangStats';
import AddHitModal3 from '../components/hitComponents/CreateHitModa3';
import AddHitModal from '../components/hitComponents/CreateHitModal';
import { fetchRecentHitsSummary, fetchTotalHitsSummary } from '../api/hittrackerApi';

const Hittracker: React.FC = () => {
  const { dbUser, setDbUser } = useUserContext();
  const [user, setUser] = useState<any>(null);
  const [gameVersion, setGameVersion] = useState<string | null>(null);
  const [recentHits, setRecentHits] = useState<Hit[]>([]);
  const [allPirateHits, setAllPirateHits] = useState<Hit[]>([]);
  const [allAssistHits, setAllAssistHits] = useState<Hit[]>([]);
  const [showAddHitModal, setShowAddHitModal] = useState(false);
  const [showAddHitModal2, setShowAddHitModal2] = useState(false);
  const [addHitForm, setAddHitForm] = useState({
    hitType: "",
    details: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [gameVersions, setGameVersions] = useState<{ value: string, label: string }[]>([]);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  // Add state for hits summary
  const [hitsSummary, setHitsSummary] = useState<any[]>([]);
  // Add state for total hits summary (mirrors recent summary)
  const [_totalHitsSummary, setTotalHitsSummary] = useState<any[]>([]);
  const PROSPECT_IDS = (import.meta.env.VITE_PROSPECT_ID || "").split(",");
  const CREW_IDS = (import.meta.env.VITE_CREW_ID || "").split(",");
  const MARAUDER_IDS = (import.meta.env.VITE_MARAUDER_ID || "").split(",");
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
  const isMember = dbUser?.roles?.some((role: string) => PROSPECT_IDS.includes(role) || CREW_IDS.includes(role) || MARAUDER_IDS.includes(role) || BLOODED_IDS.includes(role)) ?? false;
  
  const piratePlayerPatchStats = Array.isArray(hitsSummary)
    ? hitsSummary.find((entry) => entry.user_id === dbUser.id) || null
    : null

  // Combine all values in hitsSummary into a single hitSummary object
  const pirateOrgPatchStats = Array.isArray(hitsSummary) && hitsSummary.length > 0
    ? hitsSummary.reduce((acc, curr) => {
        return {
          user_id: 'ORG',
          total_hits: (parseInt(acc.total_hits) + parseInt(curr.total_hits || '0')).toString(),
          total_cut_scu: acc.total_cut_scu + (curr.total_cut_scu || 0),
          total_cut_value: acc.total_cut_value + (curr.total_cut_value || 0),
          fps_kills_pu: (parseInt(acc.fps_kills_pu) + parseInt(curr.fps_kills_pu || '0')).toString(),
          ship_kills_pu: (parseInt(acc.ship_kills_pu) + parseInt(curr.ship_kills_pu || '0')).toString(),
          value_pu: acc.value_pu + (curr.value_pu || 0),
        };
      }, {
        user_id: 'ORG',
        total_hits: '0',
        total_cut_scu: 0,
        total_cut_value: 0,
        fps_kills_pu: '0',
        ship_kills_pu: '0',
        value_pu: 0,
      })
    : {
        user_id: 'ORG',
        total_hits: '0',
        total_cut_scu: 0,
        total_cut_value: 0,
        fps_kills_pu: '0',
        ship_kills_pu: '0',
        value_pu: 0,
      };

  // Aggregate all users' total summaries into a single org-wide total summary
  const pirateOrgTotalStats = Array.isArray(_totalHitsSummary) && _totalHitsSummary.length > 0
    ? _totalHitsSummary.reduce((acc, curr) => {
        return {
          user_id: 'ORG',
          total_hits: (parseInt(acc.total_hits) + parseInt(curr.total_hits || '0')).toString(),
          total_cut_scu: acc.total_cut_scu + (curr.total_cut_scu || 0),
          total_cut_value: acc.total_cut_value + (curr.total_cut_value || 0),
          fps_kills_pu: (parseInt(acc.fps_kills_pu) + parseInt(curr.fps_kills_pu || '0')).toString(),
          ship_kills_pu: (parseInt(acc.ship_kills_pu) + parseInt(curr.ship_kills_pu || '0')).toString(),
          value_pu: acc.value_pu + (curr.value_pu || 0),
        };
      }, {
        user_id: 'ORG',
        total_hits: '0',
        total_cut_scu: 0,
        total_cut_value: 0,
        fps_kills_pu: '0',
        ship_kills_pu: '0',
        value_pu: 0,
      })
    : {
        user_id: 'ORG',
        total_hits: '0',
        total_cut_scu: 0,
        total_cut_value: 0,
        fps_kills_pu: '0',
        ship_kills_pu: '0',
        value_pu: 0,
      };
  // Fetch recent hits summary (like fetchRecentGangsSummary in Dashboard)
  useEffect(() => {
    if (gameVersion && dbUser && dbUser.id) {
      fetchRecentHitsSummary(gameVersion, 500, 0)
        .then((data) => {
          const formatted = Array.isArray(data)
            ? data.map(obj => ({
                user_id: String(obj.user_id),
                total_hits: String(obj.total_hits),
                total_cut_scu: Number(obj.total_cut_scu) || 0,
                total_cut_value: Number(obj.total_cut_value) || 0,
                fps_kills_pu: String(obj.fps_kills_pu),
                ship_kills_pu: String(obj.ship_kills_pu),
                value_pu: Number(obj.value_pu) || 0,
              }))
            : [];
          setHitsSummary(formatted);
        })
        .catch(() => setHitsSummary([]));
    } else {
      setHitsSummary([]);
    }
  }, [gameVersion, dbUser]);

  // Fetch total hits summary across all patches (no patch filter)
  useEffect(() => {
    if (dbUser && dbUser.id) {
      fetchTotalHitsSummary(undefined, 10000, 0)
        .then((data) => {
          const formatted = Array.isArray(data)
            ? data.map(obj => ({
                user_id: String(obj.user_id),
                total_hits: String(obj.total_hits),
                total_cut_scu: Number(obj.total_cut_scu) || 0,
                total_cut_value: Number(obj.total_cut_value) || 0,
                fps_kills_pu: String(obj.fps_kills_pu),
                ship_kills_pu: String(obj.ship_kills_pu),
                value_pu: Number(obj.value_pu) || 0,
              }))
            : [];
          setTotalHitsSummary(formatted);
        })
        .catch(() => setTotalHitsSummary([]));
    } else {
      setTotalHitsSummary([]);
    }
  }, [dbUser]);

  // Fetch playerStats for PlayerGangStats
  useEffect(() => {
    if (dbUser && dbUser.id) {
      setPlayerStatsLoading(true);
      fetchPlayerStatsByUserId(dbUser.id)
        .then((stats) => setPlayerStats(stats))
        .finally(() => setPlayerStatsLoading(false));
    }
  }, [dbUser]);

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
        const patchesRaw = await getLatestPatch();
        const patches = Array.isArray(patchesRaw) ? patchesRaw : patchesRaw ? [patchesRaw] : [];
        const latestPatch = patches.reduce((max, curr) =>
          curr.version.localeCompare(max.version, undefined, { numeric: true }) > 0 ? curr : max,
          patches[0] || { version: "" }
        );
        if (patches.length > 0) {
          setGameVersion(latestPatch.version);
        } else {
          setGameVersion(null);
        }
      } catch (e) {
        setGameVersion(null);
      }
    };
    fetchVersion();
  }, []);

  // Fetch all users for the dropdown
  useEffect(() => {
    getAllUsers()
      .then(users => setUserList(Array.isArray(users) ? users : users ? [users] : []))
      .catch(() => setUserList([]));
  }, []);

  // Fetch all game versions for the dropdown
  useEffect(() => {
    getAllGameVersions()
      .then(versions => {
        if (Array.isArray(versions)) {
          setGameVersions(
            versions
              .slice()
              .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
              .map(v => ({ value: v.version, label: v.version }))
          );
        }
      })
      .catch(() => setGameVersions([]));
  }, []);

  // Fetch stats for all users only
  useEffect(() => {
    const getRecentPirateHits = async () => {
      if (!gameVersion) return;
      try {
        const hits = await fetchAllHitsByPatch(gameVersion);
        setRecentHits(Array.isArray(hits) ? hits : []);
      } catch (e) {
        setRecentHits([]);
      }
    };
    getRecentPirateHits();
  }, [gameVersion]);

  useEffect(() => {
    const fetchAllHits = async () => {
      if (!gameVersion) return;
      try {
        const pirateHits = await fetchAllHitsByPatch(gameVersion) || [];
        setAllPirateHits(pirateHits);
      } catch (e) {
        setAllPirateHits([]);
      }
      // No endpoint for all assists by patch, so clear assists
      setAllAssistHits([]);
    };
    fetchAllHits();
  }, [gameVersion]);

  // Optionally, show a loading state if dbUser is still being fetched
  if (!dbUser) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  // 1. Add an "All Users" option to the select dropdown
  const ALL_USERS_OPTION = { value: null, label: "All Users" };

  // Helper to map users to react-select options
  const userToOption = (user: any) => ({
    value: user.id,
    label: user.username || user.nickname || user.displayName || user.id,
    user,
  });

  // Prepare options for react-select (prepend All Users)
  const userOptions = [ALL_USERS_OPTION, ...userList.map(userToOption)];

  // Find the currently selected option
  const selectedOption = userOptions.find(opt => opt.value === null);

  // Custom filter for react-select to match username or nickname
  const filterOption = (option: any, inputValue: string) => {
    const { user } = option.data;
    if (!user) return false; // Prevent error for "All Users" option
    const search = inputValue.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(search)) ||
      (user.nickname && user.nickname.toLowerCase().includes(search)) ||
      (user.displayName && user.displayName.toLowerCase().includes(search)) ||
      (user.id && user.id.toLowerCase().includes(search))
    );
  };

  // Find the currently selected game version option
  const selectedGameVersionOption = gameVersions.find(opt => opt.value === gameVersion);

  return (
    <div className="hittracker-root">
      <Navbar dbUser={dbUser} />
      {/* Top header spanning full width */}
      <div className="piracy-header-fullwidth" style={{
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
        <h1 style={{margin: 0}}>Piracy</h1>
        <p style={{margin: 0}}>Track your hits and performance.</p>
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
            value={selectedGameVersionOption}
            onChange={opt => setGameVersion(opt?.value ?? null)}
            placeholder="Select game version..."
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
          <div className="column overview-panel-column">
            {/* <OverviewPanel
              gameVersion={gameVersion}
            /> */}
            {/* pirate org stats */}
            <PlayerGangStats
              dbUser={dbUser}
              gameVersion={gameVersion}
              displayType="PiracyOrgStats"
              playerStats={playerStats}
              playerStatsLoading={playerStatsLoading}
              piratePatchStats={pirateOrgPatchStats}
              pirateOrgTotalStats={pirateOrgTotalStats}
            />
          </div>
          <div className="column warehouse-items">
            {/* Add New Hit Button - only show if viewer is selected */}
            {isMember && (
              <>
                <button
                  className="add-hit-btn"
                  style={{
                    width: '100%',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    fontSize: '1.1rem',
                    background: '#2d7aee',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowAddHitModal(true)}
                >
                  Add New Hit
                </button>
                {showAddHitModal && (
                  <AddHitModal
                    show={showAddHitModal}
                    onClose={() => setShowAddHitModal(false)}
                    gameVersion={gameVersion}
                    userId={dbUser?.id}
                    username={dbUser?.username}
                    isEditMode={false}
                    hit={undefined}
                    allUsers={userList}
                    onUpdate={async () => {}}
                    onDelete={async () => {}}
                    onSubmit={async () => { window.location.reload(); }}
                  />
                )}
              </>
            )}
            <div style={{ borderRadius: 8, minHeight: 200 }} className="column recent-pirate-hits">
              <RecentPirateHits 
                recentHits={recentHits} 
                gameVersion={gameVersion} 
                user_id={null}
                pirateHits={allPirateHits}
                assistHits={allAssistHits}
                allUsers={userList}
                dbUser={dbUser}
              />
            </div>
          </div>
          <div className="column recent-pirate-hits">
            <PlayerGangStats
              dbUser={dbUser}
              gameVersion={gameVersion}
              displayType="Piracy"
              playerStats={playerStats}
              playerStatsLoading={playerStatsLoading}
              piratePatchStats={piratePlayerPatchStats}
            />
            {/* <KillOverviewBoard patch={gameVersion ?? ""} allUsers={userList} /> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hittracker;