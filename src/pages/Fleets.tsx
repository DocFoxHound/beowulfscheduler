import React, { useEffect, useState } from 'react';
import Select from 'react-select'; // <-- Add this import
import OverviewPanel from '../components/OverviewPanel';
import RecentPirateHits from '../components/RecentPirateHits';
import WarehouseItems from '../components/WarehouseItems';
import { getLatestPatch } from '../api/patchApi';
import { getUserById, getAllUsers } from "../api/userService";
import { useUserContext } from "../context/UserContext";
import axios from "axios";
import { fetchPlayerRecentPirateHits, fetchAllPlayerPirateHits, fetchAllPlayerAssistHits } from '../api/hittrackerApi';
import { Hit } from '../types/hittracker';
import './Piracy.css';
import Modal from '../components/Modal'; // You may need to create this if it doesn't exist
import LogFleetModal from '../components/LogFleetModal';
import { getSummarizedItems } from '../api/summarizedItemApi';
import { SummarizedItem } from '../types/items_summary';
import Navbar from '../components/Navbar';

const Hittracker: React.FC = () => {
  const { dbUser, setDbUser } = useUserContext();
  const [user, setUser] = useState<any>(null);
  const [gameVersion, setGameVersion] = useState<string | null>(null);
  const [recentHits, setRecentHits] = useState<Hit[]>([]);
  const [allPirateHits, setAllPirateHits] = useState<Hit[]>([]);
  const [allAssistHits, setAllAssistHits] = useState<Hit[]>([]);
  const [showLogFleetModal, setLogFleetModal] = useState(false);
  const [addHitForm, setAddHitForm] = useState({
    hitType: "",
    details: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summarizedItems, setSummarizedItems] = useState<SummarizedItem[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [fleets, setFleets] = useState<{ id: string; name: string }[]>([]);

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

  // Fetch all users for the dropdown
  useEffect(() => {
    getAllUsers()
      .then(users => setUserList(Array.isArray(users) ? users : users ? [users] : []))
      .catch(() => setUserList([]));
  }, []);

  // Set default selected user to viewer's user
  useEffect(() => {
    if (dbUser && !selectedUserId) {
      setSelectedUserId(dbUser.id);
    }
  }, [dbUser, selectedUserId]);

  // Fetch stats for selected user
  useEffect(() => {
    const getRecentPirateHits = async () => {
      if (!selectedUserId || !gameVersion) return;
      const coupling = { user_id: selectedUserId, gameVersion };
      const hits = await fetchPlayerRecentPirateHits(coupling);
      setRecentHits(hits);
    };
    getRecentPirateHits();
  }, [selectedUserId, gameVersion]);

  useEffect(() => {
    const fetchAllHits = async () => {
      if (!selectedUserId || !gameVersion) return;
      const coupling = { user_id: selectedUserId, gameVersion };

      try {
        const pirateHits = await fetchAllPlayerPirateHits(coupling);
        setAllPirateHits(pirateHits);
      } catch (e) {
        setAllPirateHits([]);
      }

      try {
        const assistHits = await fetchAllPlayerAssistHits(coupling);
        setAllAssistHits(assistHits);
      } catch (e) {
        setAllAssistHits([]);
      }
    };
    fetchAllHits();
  }, [selectedUserId, gameVersion]);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const data = await getSummarizedItems();
        setSummarizedItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setSummarizedItems([]);
      }
    };
    fetchSummaries();
  }, []);

  // Fetch fleets for the user (replace with your actual API call)
  useEffect(() => {
    if (dbUser) {
      axios
        .get(`/api/fleets?user_id=${dbUser.id}`)
        .then(res => setFleets(Array.isArray(res.data) ? res.data : []))
        .catch(() => setFleets([]));
    }
  }, [dbUser]);

  // Handler for submitting the fleet activity
  const handleLogFleetActivity = async (activity: any) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Replace with your actual API endpoint
      await axios.post("/api/fleet-activity", activity);
      setLogFleetModal(false);
      // Optionally refresh data here
    } catch (err) {
      setFormError("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optionally, show a loading state if dbUser is still being fetched
  if (!dbUser) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>
    );
  }

  // Helper to map users to react-select options
  const userToOption = (user: any) => ({
    value: user.id,
    label: user.username || user.nickname || user.displayName || user.id,
    user,
  });

  // Prepare options for react-select
  const userOptions = userList.map(userToOption);

  // Find the currently selected option
  const selectedOption = userOptions.find(opt => opt.value === selectedUserId);

  // Custom filter for react-select to match username or nickname
  const filterOption = (option: any, inputValue: string) => {
    const { user } = option.data;
    const search = inputValue.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(search)) ||
      (user.nickname && user.nickname.toLowerCase().includes(search)) ||
      (user.displayName && user.displayName.toLowerCase().includes(search)) ||
      (user.id && user.id.toLowerCase().includes(search))
    );
  };

  return (
    <div className="hittracker-root">
      <Navbar />

      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Fleets</h1>
          <p>View, Join, and Manage fleets</p>
          {/* Move the selection box here, right under the title */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "1.5rem 0 0.5rem 0"
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              {/* <Select
                inputId="user-select"
                options={userOptions}
                value={selectedOption}
                onChange={opt => setSelectedUserId(opt?.value ?? null)}
                placeholder="Type a username or nickname..."
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
                    width: 500,
                    maxWidth: 700,
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
              /> */}
            </div>
          </div>
        </section>

        <div className="hittracker-layout">
          {/* LEFT COLUMN: Log Fleet Activity (was center) */}
          <div className="column overview-panel-column">
            {selectedUserId === dbUser.id && (
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
                onClick={() => setLogFleetModal(true)}
              >
                Log Fleet Activity
              </button>
            )}
            <div
              style={{
                background: "#23272a",
                color: "#fff",
                borderRadius: 8,
                minHeight: 200,
                padding: "1.5rem",
                marginTop: "0.5rem",
                textAlign: "center",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}
            >
              RECENT FLEET LOGS
            </div>
          </div>

          {/* CENTER COLUMN: Placeholder for ACTIVE FLEETS */}
          <div className="column warehouse-items">
            <div
              style={{
                background: "#23272a",
                color: "#fff",
                borderRadius: 8,
                minHeight: 200,
                padding: "2rem",
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: "bold"
              }}
            >
              ACTIVE FLEETS
            </div>
          </div>

          {/* RIGHT COLUMN: Placeholder for YOUR FLEET */}
          <div className="column recent-pirate-hits">
            <div
              style={{
                background: "#23272a",
                color: "#fff",
                borderRadius: 8,
                minHeight: 200,
                padding: "2rem",
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: "bold"
              }}
            >
              YOUR FLEET
            </div>
          </div>
        </div>
      </main>
      {/* Modal for Add Hit Form */}
      {/* {showAddHitModal && (
        <AddHitModal
          show={showAddHitModal}
          onClose={() => setShowAddHitModal(false)}
          gameVersion={gameVersion}
          userId={dbUser.id}
          username={dbUser.username}
          summarizedItems={summarizedItems}
          onSubmit={async (hit) => {
            setIsSubmitting(true);
            setFormError(null);
            try {
              // await your API call here
              setShowAddHitModal(false);
            } catch (err) {
              setFormError("Failed to submit. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
          formError={formError}
          setFormError={setFormError}
        />
      )} */}
      {showLogFleetModal && (
        <LogFleetModal
          isOpen={showLogFleetModal}
          onClose={() => setLogFleetModal(false)}
          onSubmit={handleLogFleetActivity}
          fleets={fleets.map(fleet => ({
            id: Number(fleet.id),
            name: fleet.name
          }))}
          userId={dbUser.id}
          username={dbUser.username}
          patch={gameVersion ?? ""} // <-- Add this line
        />
      )}
    </div>
  );
};

export default Hittracker;