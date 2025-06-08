import React, { useEffect, useState } from 'react';
import Select from 'react-select'; // <-- Add this import
import OverviewPanel from '../components/PiracyOverviewPanel';
import RecentPirateHits from '../components/RecentPirateHits';
import WarehouseItems from '../components/WarehouseItems';
import { getLatestPatch, getAllGameVersions } from '../api/patchApi';
import { getUserById, getAllUsers } from "../api/userService";
import { useUserContext } from "../context/UserContext";
import axios from "axios";
import { fetchPlayerRecentPirateHits, fetchAllPlayerPirateHits, fetchAllPlayerAssistHits, fetchAllHitsByPatch, fetchAllHitsByUserIdAndPatch } from '../api/hittrackerApi';
import { Hit } from '../types/hittracker';
import KillOverviewBoard from '../components/KillOverviewBoard';
import './Piracy.css';
import Modal from '../components/Modal'; // You may need to create this if it doesn't exist
import AddHitModal from '../components/AddHitModal';
import Navbar from '../components/Navbar';

const Hittracker: React.FC = () => {
  const { dbUser, setDbUser } = useUserContext();
  const [user, setUser] = useState<any>(null);
  const [gameVersion, setGameVersion] = useState<string | null>(null);
  const [recentHits, setRecentHits] = useState<Hit[]>([]);
  const [allPirateHits, setAllPirateHits] = useState<Hit[]>([]);
  const [allAssistHits, setAllAssistHits] = useState<Hit[]>([]);
  const [showAddHitModal, setShowAddHitModal] = useState(false);
  const [addHitForm, setAddHitForm] = useState({
    hitType: "",
    details: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  // REMOVE selectedUserId state
  // const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [gameVersions, setGameVersions] = useState<{ value: string, label: string }[]>([]);
  const CREW_IDS = (import.meta.env.VITE_CREW_ID || "").split(",");
  const MARAUDER_IDS = (import.meta.env.VITE_MARAUDER_ID || "").split(",");
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
  const isMember = dbUser?.roles?.some((role: string) => CREW_IDS.includes(role) || MARAUDER_IDS.includes(role) || BLOODED_IDS.includes(role)) ?? false;

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
            versions.map(v => ({ value: v.version, label: v.version }))
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
      <Navbar />
      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Piracy</h1>
          <p>Track your hits and performance.</p>
          {/* Only show Game Version selector */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "1.5rem 0 0.5rem 0",
            gap: "1rem"
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
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
        </section>

        <div className="hittracker-layout">
          <div className="column overview-panel-column">
            <OverviewPanel
              gameVersion={gameVersion}
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
                    hit={undefined} // <-- Fix here
                    allUsers={userList}
                    onUpdate={async () => {}}
                    onDelete={async () => {}}
                    onSubmit={async () => {}}
                    isSubmitting={isSubmitting}
                    formError={formError}
                    setFormError={setFormError}
                  />
                )}
              </>
            )}
            {/* Remove Add New Hit Button (since no user context) */}
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
            <KillOverviewBoard patch={gameVersion ?? ""} allUsers={userList} />
          </div>
        </div>
      </main>
      {/* Remove AddHitModal */}
    </div>
  );
};

export default Hittracker;