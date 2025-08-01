
import React from "react";
import AdminGeneralManagement from "./AdminManagementGeneral";
import AdminManagementPlayer from "./AdminManagementPlayer";
import { type User } from "../../types/user";

interface AdminManagementTabProps {
  selectedPlayer?: any;
  users: User[];
  loading: boolean;
  emojis: any[];
  activeBadgeReusables: any[];
  dbUser?: any; // Optional prop for database user context
}

const AdminManagementTab: React.FC<AdminManagementTabProps> = ({ selectedPlayer, users, loading, emojis, activeBadgeReusables, dbUser }) => {
  if (!selectedPlayer) {
    // Overall management view
    return <AdminGeneralManagement users={users} loading={loading} emojis={emojis} activeBadgeReusables={activeBadgeReusables} />;
  }
  // Player management view
  return <AdminManagementPlayer player={selectedPlayer} emojis={emojis} activeBadgeReusables={activeBadgeReusables} dbUser={dbUser} />;
};

export default AdminManagementTab;
