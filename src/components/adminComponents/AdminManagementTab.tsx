import React from "react";
import AdminGeneralManagement from "./AdminManagementGeneral";
import { type User } from "../../types/user";

interface AdminManagementTabProps {
  selectedPlayer?: any;
  users: User[];
  loading: boolean;
}

const AdminManagementTab: React.FC<AdminManagementTabProps> = ({ selectedPlayer, users, loading }) => {
  if (!selectedPlayer) {
    // Overall management view
    return <AdminGeneralManagement users={users} loading={loading} />;
  }
  // Player management view
  return (
    <div>
      <h3>Player Management</h3>
      <p>Manage player: <strong>{selectedPlayer.username || selectedPlayer.nickname || selectedPlayer.id}</strong></p>
      {/* Add player-specific management controls and stats here */}
    </div>
  );
};

export default AdminManagementTab;
