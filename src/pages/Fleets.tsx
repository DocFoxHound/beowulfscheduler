import React, { useEffect, useState } from 'react';
import Select from 'react-select'; // <-- Add this import
import OverviewPanel from '../components/PiracyOverviewPanel';
import RecentPirateHits from '../components/RecentPirateHits';
import WarehouseItems from '../components/WarehousePersonalItems';
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
import { fetchAllFleets } from '../api/fleetApi'; // Add this import
import { UserFleet } from '../types/fleet'; // Add this import
import { fetchAllShipLogs } from '../api/fleetLogApi';
import { FleetLog } from '../types/fleet_log';
import RecentFleetLogs from '../components/RecentFleetLogs';
import ActiveFleets from '../components/ActiveFleets';
import ManageFleet from '../components/ManageFleet';

const Hittracker: React.FC = () => {
  const { dbUser, setDbUser } = useUserContext();
  const [user, setUser] = useState<any>(null);
  const [emojis, setEmojis] = useState<any[]>([]);
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
  const [fleets, setFleets] = useState<UserFleet[]>([]);
  const CREW_IDS = (import.meta.env.VITE_CREW_ID || "").split(",");
  const MARAUDER_IDS = (import.meta.env.VITE_MARAUDER_ID || "").split(",");
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
  const isMember = dbUser?.roles?.some((role: string) => CREW_IDS.includes(role) || MARAUDER_IDS.includes(role) || BLOODED_IDS.includes(role)) ?? false;

  // Fetch emojis on mount
  useEffect(() => {
    import('../api/emojiApi').then(({ fetchAllEmojis }) => {
      fetchAllEmojis()
        .then((data) => {
          const emojiArray = Array.isArray(data) ? data : [];
          setEmojis(emojiArray);
        })
        .catch(() => setEmojis([]));
    });
  }, []);

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
    const fetchFleets = async () => {
      if (dbUser) {
        try {
          const data = await fetchAllFleets();
          setFleets(Array.isArray(data) ? data : []);
        } catch {
          setFleets([]);
        }
      }
    };
    fetchFleets();
  }, [dbUser]);

  // This must be for posting back through the bot?
  const handleLogFleetActivity = async (activity: any) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Replace with your actual API endpoint
      // await axios.post("/api/fleet-activity", activity);
      setLogFleetModal(false);
      window.location.reload(); // <-- Add this line to refresh the page
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

  // Find the fleet the user owns (as commander)
  const ownsFleet = fleets.find(fleet => fleet.commander_id === dbUser.id);

  // Find the fleet the user is a member of (but not commander)
  const memberOfFleet = fleets.find(
    fleet =>
      Array.isArray(fleet.members_ids) &&
      fleet.members_ids.includes(dbUser.id) &&
      fleet.commander_id !== dbUser.id
  );

  const isNotInAnyFleet = !ownsFleet && !memberOfFleet;

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
        <h1 style={{margin: 0}}>Fleets</h1>
        <p style={{margin: 0}}>View, Join, and Manage fleets</p>
      </div>
      <main className="dashboard-content">
        <div className="hittracker-layout">
          {/* LEFT COLUMN: Log Activity (was center) */}
          <div className="column overview-panel-column">
            {isMember && (
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
                Log Activity
              </button>
            )}
            <div style={{ fontSize: "0.95rem", color: "#aaa", marginBottom: "1.5rem", textAlign: "center" }}>
              Activities don't require Fleet's to count, but to count towards an existing Fleet they must have at least 3 of their own members involved.
            </div>
            <RecentFleetLogs fleets={fleets} />
          </div>

          {/* CENTER COLUMN: Placeholder for ACTIVE FLEETS */}
          <div className="column warehouse-items">
            <ActiveFleets 
              fleets={fleets}
              allUsers={userList}
              userId={dbUser.id}
              isNotInAnyFleet={isNotInAnyFleet}
              dbUser={dbUser}
              isModerator={isModerator}
              emojis={emojis}
            />
          </div>

          {/* RIGHT COLUMN: YOUR FLEET */}
          <div className="column recent-pirate-hits">
            <ManageFleet
              ownsFleet={!!ownsFleet}
              ownedFleet={ownsFleet || null}
              memberOfFleet={!!memberOfFleet}
              memberFleet={memberOfFleet || null}
              userId={dbUser.id}
              allUsers={userList} 
              dbUser={dbUser}
              fleets={fleets}
            />
          </div>
        </div>
      </main>
      {showLogFleetModal && (
        <LogFleetModal
          isOpen={showLogFleetModal}
          onClose={() => setLogFleetModal(false)}
          onSubmit={handleLogFleetActivity}
          fleets={fleets}
          userId={dbUser.id}
          username={dbUser.username}
          patch={gameVersion ?? ""}
          allUsers={userList}
        />
      )}
    </div>
  );
};

export default Hittracker;