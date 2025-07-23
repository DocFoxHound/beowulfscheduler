import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { getUserById } from "../api/userService";
import AdminUserList from "../components/adminComponents/AdminUserList";
import AdminActivityGraph from "../components/adminComponents/AdminActivityGraphs";
import AdminManagementTab from "../components/adminComponents/AdminManagementTab";
import { getAllUsers } from "../api/userService";

const BLOODED_PLUS_IDS = (import.meta.env.VITE_LIVE_BLOODED_PLUS || "").split(",");

const AdminActivity: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filteredUsersWithData, setFilteredUsersWithData] = useState<any[]>([]);
  // Track selected player from AdminUserList
  const selectedPlayer = filteredUsersWithData.length === 1 ? filteredUsersWithData[0] : null;
  const navigate = useNavigate();
  // Fetch all users when page loads
  useEffect(() => {
    setUsersLoading(true);
    getAllUsers()
      .then((data) => {
        setAllUsers(Array.isArray(data) ? data : []);
        setUsersLoading(false);
      })
      .catch(() => {
        setAllUsers([]);
        setUsersLoading(false);
      });
  }, []);

  // Fetch Discord user
  useEffect(() => {
    axios
      .get(
        import.meta.env.VITE_IS_LIVE === "true"
          ? import.meta.env.VITE_LIVE_USER_URL
          : import.meta.env.VITE_TEST_USER_URL,
        { withCredentials: true }
      )
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  // Fetch dbUser from backend
  useEffect(() => {
    if (user && user.id) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user]);

  // Redirect if not admin
  useEffect(() => {
    if (dbUser && (!Array.isArray(dbUser.roles) || !dbUser.roles.some((roleId: string) => BLOODED_PLUS_IDS.includes(roleId)))) {
      navigate("/dashboard");
    }
  }, [dbUser, navigate]);

  if (!dbUser) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar dbUser={dbUser} />
      <div style={{ padding: "2rem", color: "#fff" }}>
        <h1>Admin Activity</h1>
        {/* Top area for reactive graph */}
            <div style={{ marginBottom: "2rem" }}>
              <React.Suspense fallback={<div>Loading graph...</div>}>
                <AdminActivityGraph usersWithData={filteredUsersWithData.length ? filteredUsersWithData : allUsers} />
              </React.Suspense>
            </div>
        {/* Split page into two sides */}
        <div style={{ display: "flex", gap: "2rem" }}>
          {/* Left side: Users list */}
          <div style={{ flex: 1, background: "#222", borderRadius: "8px", padding: "1rem", minHeight: "400px" }}>
            <h2>Users List</h2>
            {/* AdminUserList displays the reactive list of users */}
            <React.Suspense fallback={<div>Loading users...</div>}>
              <AdminUserList
                users={allUsers}
                loading={usersLoading}
                onFilteredUsersChange={setFilteredUsersWithData}
              />
            </React.Suspense>
          </div>
          {/* Right side: Recent Gatherings list */}
          <div style={{ flex: 1, background: "#222", borderRadius: "8px", padding: "1rem", minHeight: "400px" }}>
            <h2>Management</h2>
            <AdminManagementTab selectedPlayer={selectedPlayer} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;