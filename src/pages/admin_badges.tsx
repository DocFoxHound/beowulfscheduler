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
        <h1>Admin Badge Page</h1>
        {/* Admin badge management UI goes here */}
        <p>Welcome to the admin badge page. Only authorized users can see this.</p>
      </div>
    </div>
  );
};

export default AdminBadges;










// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../components/Navbar";
// import axios from "axios";
// import { getUserById } from "../api/userService";
// import {
//   fetchAllBadgeReusables,
//   createBadgeReusable,
// } from "../api/badgeReusableApi";
// import {
//   fetchBadgesByUserId,
//   createBadge,
// } from "../api/badgeRecordApi";
// import { BadgeReusable } from "../types/badgeReusable";
// import { BadgeRecord } from "../types/badgeRecord";
// import { Autocomplete, TextField, Paper, Typography, Box } from "@mui/material";
// import { Grid } from "@mui/material"; // Use Grid from @mui/material for correct types
// import { TreeView, TreeItem } from "@mui/lab";
// import StarIcon from "@mui/icons-material/Star";
// import { getAllUsers } from "../api/userService";
// import { User } from "../types/user";

// const BLOODED_PLUS_IDS = (import.meta.env.VITE_LIVE_BLOODED_PLUS || "").split(",");

// const AdminBadges: React.FC = () => {
//   const [user, setUser] = useState<any>(null);
//   const [dbUser, setDbUser] = useState<any>(null);
//   const navigate = useNavigate();

//   // New state for dashboard
//   const [searchUserId, setSearchUserId] = useState("");
//   const [searchedBadges, setSearchedBadges] = useState<BadgeRecord[]>([]);
//   const [badgeReusables, setBadgeReusables] = useState<BadgeReusable[]>([]);
//   const [newBadge, setNewBadge] = useState<Partial<BadgeReusable & BadgeRecord>>({});
//   const [isReusable, setIsReusable] = useState(false);
//   const [assignBadgeId, setAssignBadgeId] = useState<string>("");
//   const [assignUserIds, setAssignUserIds] = useState<string>("");
//   const [assignStatus, setAssignStatus] = useState<string>("");

//   // New states for user assignment
//   const [allUsers, setAllUsers] = useState<User[]>([]);
//   const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

//   // Fetch Discord user
//   useEffect(() => {
//     axios
//       .get(
//         import.meta.env.VITE_IS_LIVE === "true"
//           ? import.meta.env.VITE_LIVE_USER_URL
//           : import.meta.env.VITE_TEST_USER_URL,
//         { withCredentials: true }
//       )
//       .then((res) => setUser(res.data))
//       .catch(() => setUser(null));
//   }, []);

//   // Fetch dbUser from backend
//   useEffect(() => {
//     if (user && user.id) {
//       getUserById(user.id)
//         .then((data) => setDbUser(data))
//         .catch(() => setDbUser(null));
//     }
//   }, [user]);

//   // Redirect if not admin
//   useEffect(() => {
//     if (dbUser && (!Array.isArray(dbUser.roles) || !dbUser.roles.some((roleId: string) => BLOODED_PLUS_IDS.includes(roleId)))) {
//       navigate("/dashboard");
//     }
//   }, [dbUser, navigate]);

//   // Fetch all reusable badges on mount
//   useEffect(() => {
//     fetchAllBadgeReusables().then(setBadgeReusables);
//   }, []);

//   // Fetch all users for autocomplete
//   useEffect(() => {
//     getAllUsers().then(users => {
//       if (Array.isArray(users)) setAllUsers(users);
//     });
//   }, []);

//   // Search for a user's badges
//   const handleSearch = async () => {
//     if (!searchUserId) return;
//     const badges = await fetchBadgesByUserId(searchUserId);
//     setSearchedBadges(badges);
//   };

//   // Create a new badge (reusable or not)
//   const handleCreateBadge = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (isReusable) {
//       // Create reusable badge
//       await createBadgeReusable(newBadge as BadgeReusable);
//       setNewBadge({});
//       setIsReusable(false);
//       fetchAllBadgeReusables().then(setBadgeReusables);
//     } else {
//       // Create one-off badge (not reusable, assign to user)
//       await createBadge(newBadge as BadgeRecord);
//       setNewBadge({});
//     }
//     alert("Badge created!");
//   };

//   // Assign badge to multiple users
//   const handleAssignBadge = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setAssignStatus("Assigning...");
//     const userIds = assignUserIds.split(",").map((id) => id.trim()).filter(Boolean);
//     try {
//       for (const userId of userIds) {
//         await createBadge({
//           user_id: BigInt(userId),
//           badge_name: badgeReusables.find(b => b.id.toString() === assignBadgeId)?.badge_name || "",
//           badge_description: badgeReusables.find(b => b.id.toString() === assignBadgeId)?.badge_description || "",
//           badge_weight: badgeReusables.find(b => b.id.toString() === assignBadgeId)?.badge_weight || BigInt(0),
//         } as BadgeRecord);
//       }
//       setAssignStatus("Assigned!");
//     } catch {
//       setAssignStatus("Error assigning badges.");
//     }
//   };

//   // Group badges by subject
//   const badgesBySubject = badgeReusables.reduce((acc, badge) => {
//     if (!acc[badge.subject]) acc[badge.subject] = [];
//     acc[badge.subject].push(badge);
//     return acc;
//   }, {} as Record<string, BadgeReusable[]>);

//   // Handle user selection
//   const handleUserSelect = (_: any, value: User | null) => {
//     if (value && !selectedUsers.some(u => u.id === value.id)) {
//       setSelectedUsers([...selectedUsers, value]);
//     }
//   };

//   // Remove user from selection
//   const handleRemoveUser = (userId: string) => {
//     setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
//   };

//   // Handle badge selection
//   const handleBadgeTreeSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
//     setAssignBadgeId(nodeIds[0] || "");
//   };

//   if (!dbUser) return <div>Loading...</div>;

//   return (
//     <div>
//       <Navbar dbUser={dbUser} />
//       <div style={{ padding: "2rem", color: "#fff" }}>
//         <h1>Admin Badges</h1>

//         {/* 1. View a player's badges */}
//         <section style={{ marginBottom: "2rem" }}>
//           <h2>View Player's Badges</h2>
//           <input
//             type="text"
//             placeholder="Enter User ID"
//             value={searchUserId}
//             onChange={e => setSearchUserId(e.target.value)}
//           />
//           <button onClick={handleSearch}>Search</button>
//           <ul>
//             {searchedBadges.map(badge => (
//               <li key={badge.id.toString()}>
//                 <b>{badge.badge_name}</b>: {badge.badge_description}
//               </li>
//             ))}
//           </ul>
//         </section>

//         {/* 2. Create a new badge */}
//         <section style={{ marginBottom: "2rem" }}>
//           <h2>Create New Badge</h2>
//           <form onSubmit={handleCreateBadge}>
//             <input
//               type="text"
//               placeholder="Badge Name"
//               value={newBadge.badge_name || ""}
//               onChange={e => setNewBadge({ ...newBadge, badge_name: e.target.value })}
//               required
//             />
//             <input
//               type="text"
//               placeholder="Badge Description"
//               value={newBadge.badge_description || ""}
//               onChange={e => setNewBadge({ ...newBadge, badge_description: e.target.value })}
//               required
//             />
//             <input
//               type="number"
//               placeholder="Badge Weight"
//               value={newBadge.badge_weight?.toString() || ""}
//               onChange={e => setNewBadge({ ...newBadge, badge_weight: BigInt(e.target.value) })}
//               required
//             />
//             <label>
//               <input
//                 type="checkbox"
//                 checked={isReusable}
//                 onChange={e => setIsReusable(e.target.checked)}
//               />
//               Reusable Badge
//             </label>
//             <button type="submit">Create Badge</button>
//           </form>
//         </section>

//         {/* 3. Assign a badge to multiple users */}
//         <section>
//           <h2>Assign Badge to Players</h2>
//           <Grid container spacing={2}>
//             {/* User Search & Selected Users */}
//             <Grid item xs={12} md={5}>
//               <Autocomplete
//                 options={allUsers}
//                 getOptionLabel={(option) => option.nickname || option.username}
//                 renderInput={(params) => <TextField {...params} label="Search Users" />}
//                 onChange={handleUserSelect}
//                 filterSelectedOptions
//               />
//               <Box mt={2}>
//                 <Typography variant="subtitle1">Selected Users:</Typography>
//                 <Grid container spacing={1}>
//                   {selectedUsers.map(user => (
//                     <Grid item key={user.id}>
//                       <Paper sx={{ p: 1, display: "flex", alignItems: "center" }}>
//                         <span>{user.nickname || user.username}</span>
//                         <button
//                           style={{ marginLeft: 8 }}
//                           onClick={() => handleRemoveUser(user.id)}
//                           type="button"
//                         >✕</button>
//                       </Paper>
//                     </Grid>
//                   ))}
//                 </Grid>
//               </Box>
//             </Grid>

//             {/* Badge Tree */}
//             <Grid item xs={12} md={7}>
//               <Typography variant="subtitle1">Select Badge:</Typography>
//               <Paper sx={{ maxHeight: 400, overflow: "auto", p: 2 }}>
//                 <TreeView
//                   selected={assignBadgeId ? [assignBadgeId] : []}
//                   onNodeSelect={handleBadgeTreeSelect}
//                 >
//                   {Object.entries(badgesBySubject).map(([subject, badges]) => (
//                     <TreeItem nodeId={subject} label={subject} key={subject}>
//                       {badges.map(badge => (
//                         <TreeItem
//                           nodeId={badge.id.toString()}
//                           key={badge.id.toString()}
//                           label={
//                             <span>
//                               {badge.badge_name}
//                               {badge.progression && (
//                                 <>
//                                   <StarIcon fontSize="small" color="warning" sx={{ verticalAlign: "middle", ml: 1 }} />
//                                   <span style={{ fontSize: "0.9em", marginLeft: 4 }}>
//                                     ({badge.prestige_name} {badge.prestige_level})
//                                   </span>
//                                 </>
//                               )}
//                             </span>
//                           }
//                         />
//                       ))}
//                     </TreeItem>
//                   ))}
//                 </TreeView>
//               </Paper>
//             </Grid>
//           </Grid>
//           <Box mt={2}>
//             <button
//               type="button"
//               disabled={!assignBadgeId || selectedUsers.length === 0}
//               onClick={async (e) => {
//                 e.preventDefault();
//                 setAssignStatus("Assigning...");
//                 try {
//                   for (const user of selectedUsers) {
//                     await createBadge({
//                       user_id: BigInt(user.id),
//                       badge_name: badgeReusables.find(b => b.id.toString() === assignBadgeId)?.badge_name || "",
//                       badge_description: badgeReusables.find(b => b.id.toString() === assignBadgeId)?.badge_description || "",
//                       badge_weight: badgeReusables.find(b => b.id.toString() === assignBadgeId)?.badge_weight || BigInt(0),
//                     } as BadgeRecord);
//                   }
//                   setAssignStatus("Assigned!");
//                 } catch {
//                   setAssignStatus("Error assigning badges.");
//                 }
//               }}
//             >
//               Assign
//             </button>
//             <span style={{ marginLeft: "1rem" }}>{assignStatus}</span>
//           </Box>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default AdminBadges;