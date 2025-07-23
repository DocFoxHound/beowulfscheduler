import React from "react";
import AdminGeneralManagement from "./AdminGeneralManagement";

interface AdminManagementTabProps {
  selectedPlayer?: any;
}

const AdminManagementTab: React.FC<AdminManagementTabProps> = ({ selectedPlayer }) => {
  if (!selectedPlayer) {
    // Overall management view
    return <AdminGeneralManagement />;
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
