import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { getUserById } from "../api/userService";

const BLOODED_PLUS_IDS = (import.meta.env.VITE_LIVE_BLOODED_PLUS || "").split(",");

const AdminBadges: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const navigate = useNavigate();

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
        <h1>Admin Badges</h1>
        {/* Admin badge management UI goes here */}
        <p>Welcome to the admin badges page. Only authorized users can see this.</p>
      </div>
    </div>
  );
};

export default AdminBadges;