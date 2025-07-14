import React, { useEffect, useState } from 'react';
import OverviewPanel from '../components/PiracyOverviewPanel';
import WarehouseItems from '../components/WarehousePersonalItems';
import WarehouseOrgItems from '../components/WarehouseOrgItems';
import { fetchWarehouseItems, fetchPublicOrgWarehouseItems, fetchPrivateOrgWarehouseItems, addWarehouseItem, editWarehouseItem, deleteWarehouseItem } from '../api/warehouseApi';
import { WarehouseItem } from '../types/warehouse';
import { getLatestPatch } from '../api/patchApi';
import { getUserById, getAllUsers } from "../api/userService";
import { useUserContext } from "../context/UserContext";
import axios from "axios";
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
  const [userList, setUserList] = useState<any[]>([]);
  // Fetch all users for the dropdown (like Fleets)
  useEffect(() => {
    getAllUsers()
      .then(users => setUserList(Array.isArray(users) ? users : users ? [users] : []))
      .catch(() => setUserList([]));
  }, []);

  // Shared warehouse items state
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [warehouseError, setWarehouseError] = useState<string | null>(null);

  // Fetch all warehouse items for the org and user
  useEffect(() => {
    const fetchAll = async () => {
      if (!dbUser?.id) return;
      setWarehouseLoading(true);
      try {
        // Fetch personal items
        const personal = await fetchWarehouseItems(dbUser.id);
        // Fetch org items
        const publicOrg = await fetchPublicOrgWarehouseItems();
        let privateOrg: WarehouseItem[] = [];
        // Only moderators can see private org items
        const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || '').split(',');
        const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
        if (isModerator) {
          privateOrg = await fetchPrivateOrgWarehouseItems();
        }
        // Merge all items, avoiding duplicates by id (private overrides public)
        const allItemsMap = new Map<string, WarehouseItem>();
        [...publicOrg, ...privateOrg, ...personal].forEach(item => allItemsMap.set(item.id, item));
        setWarehouseItems(Array.from(allItemsMap.values()));
        setWarehouseError(null);
      } catch (err) {
        setWarehouseError('Failed to fetch warehouse items');
      } finally {
        setWarehouseLoading(false);
      }
    };
    fetchAll();
  }, [dbUser?.id]);

  // Shared update functions
  const handleAddWarehouseItem = async (item: WarehouseItem) => {
    const saved = await addWarehouseItem(item);
    setWarehouseItems(items => [saved, ...items]);
    return saved;
  };
  const handleEditWarehouseItem = async (id: string, item: WarehouseItem) => {
    const saved = await editWarehouseItem(id, item);
    setWarehouseItems(items => items.map(i => (i.id === id ? saved : i)));
    return saved;
  };
  const handleDeleteWarehouseItem = async (id: string) => {
    await deleteWarehouseItem(id);
    setWarehouseItems(items => items.filter(i => i.id !== id));
  };
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
              <WarehouseItems
                gameVersion={gameVersion}
                user_id={dbUser?.id ?? null}
                summarizedItems={summarizedItems}
                items={warehouseItems}
                setItems={setWarehouseItems}
                addWarehouseItem={handleAddWarehouseItem}
                editWarehouseItem={handleEditWarehouseItem}
                deleteWarehouseItem={handleDeleteWarehouseItem}
                loading={warehouseLoading}
                error={warehouseError}
              />
            </div>
          </div>
          <div className="column recent-pirate-hits">
            <div style={{ background: "#23272e", borderRadius: 8, padding: 24, color: "#aaa", minHeight: 200 }}>
              <WarehouseOrgItems
                gameVersion={gameVersion}
                user_id={dbUser?.id ?? null}
                summarizedItems={summarizedItems}
                isModerator={isModerator}
                isMember={isMember}
                userList={userList}
                items={warehouseItems}
                setItems={setWarehouseItems}
                addWarehouseItem={handleAddWarehouseItem}
                editWarehouseItem={handleEditWarehouseItem}
                deleteWarehouseItem={handleDeleteWarehouseItem}
                loading={warehouseLoading}
                error={warehouseError}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Warehouse;