import React, { useEffect, useState } from 'react';
import OverviewPanel from '../components/PiracyOverviewPanel';
import RecentPirateHits from '../components/RecentPirateHits';
import WarehouseItems from '../components/WarehouseItems';
import { getLatestPatch } from '../api/patchApi';
import { getUserById } from "../api/userService";
import { useUserContext } from "../context/UserContext";
import axios from "axios";
import { fetchPlayerRecentPirateHits, fetchAllPlayerPirateHits, fetchAllPlayerAssistHits } from '../api/hittrackerApi';
import { Hit } from '../types/hittracker';
import './Warehouse.css';
import Modal from '../components/Modal'; // You may need to create this if it doesn't exist
import AddHitModal from '../components/AddHitModal';
import { getSummarizedItems } from '../api/summarizedItemApi';
import { SummarizedItem } from '../types/items_summary';
import Navbar from '../components/Navbar';

const Warehouse: React.FC = () => {
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
  const [summarizedItems, setSummarizedItems] = useState<SummarizedItem[]>([]);

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

  useEffect(() => {
    const getRecentPirateHits = async () => {
      if (!dbUser?.id || !gameVersion) return;
      const coupling = { user_id: dbUser.id, gameVersion };
      const hits = await fetchPlayerRecentPirateHits(coupling);
      setRecentHits(hits);
    };
    getRecentPirateHits();
  }, [dbUser?.id, gameVersion]);

  useEffect(() => {
    const fetchAllHits = async () => {
      if (!dbUser?.id || !gameVersion) return;
      const coupling = { user_id: dbUser.id, gameVersion };

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
  }, [dbUser?.id, gameVersion]);

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

  // Optionally, show a loading state if dbUser is still being fetched
  if (!dbUser) {
    return (
      <div className="centered-screen">
        <p>Not logged in. <a href="/">Go to Login</a></p>
      </div>);
  }

  return (
    <div className="hittracker-root">
      <Navbar dbUser={dbUser} />

      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Warehouse</h1>
          <p>Track your hits and performance.</p>
        </section>

        <div className="hittracker-layout">
          <div className="column overview-panel-column">
            <div style={{ background: "#23272e", borderRadius: 8, padding: 24, color: "#aaa", minHeight: 200 }}>
              Placeholder: Overview/Stats
            </div>
          </div>
          <div className="column warehouse-items">
            {/* Add New Hit Button */}
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
            <WarehouseItems
              gameVersion={gameVersion}
              user_id={dbUser?.id ?? null}
              summarizedItems={summarizedItems}
            />
          </div>
          <div className="column recent-pirate-hits">
            <div style={{ background: "#23272e", borderRadius: 8, padding: 24, color: "#aaa", minHeight: 200 }}>
              Placeholder: Recent Activity
            </div>
          </div>
        </div>
      </main>
      {/* Modal for Add Hit Form */}
      {showAddHitModal && (
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
      )}
    </div>
  );
};

export default Warehouse;