import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Calendar from "../components/scheduler/Calendar";
import { getUserById } from "../api/userService";
import { useUserContext } from "../context/UserContext";

const Scheduler: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { dbUser, setDbUser } = useUserContext();

  useEffect(() => {
    // Fetch the logged-in user
    fetch(
      `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_USER_URL : import.meta.env.VITE_TEST_USER_URL}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user && user.id) {
      getUserById(user.id)
        .then((data) => setDbUser(data))
        .catch(() => setDbUser(null));
    }
  }, [user, setDbUser]);

  return (
    <div>
      <Navbar dbUser={dbUser} />
      <div style={{ padding: "1.25rem 0 1rem 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.6rem", margin: "0 0 0.5rem 0", fontWeight: 700 }}>Scheduler</h1>
        <p style={{ fontSize: "1.15rem", margin: 0, color: "#bbb" }}>Share your availability and create events!</p>
      </div>
      <div style={{ margin: "1.5rem auto", width: "90vw", maxWidth: "90vw", minWidth: "50vw" }}>
        <Calendar 
          dbUser={dbUser}
        />
      </div>
    </div>
  );
};

export default Scheduler;

