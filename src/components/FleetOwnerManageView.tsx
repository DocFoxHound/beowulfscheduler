import React, { useState } from "react";
import { UserFleet } from "../types/fleet";
import { editFleet } from "../api/fleetApi";
import { editUser } from "../api/userService";

interface FleetOwnerManageViewProps {
  fleet: UserFleet;
  userId: number;
  members: { id: number; username: string }[];
  commander: { id: string; username: string } | null;
  dbUser: any;
}

const FleetOwnerManageView: React.FC<FleetOwnerManageViewProps> = ({
  fleet,
  userId,
  members,
  commander,
  dbUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [primaryMission, setPrimaryMission] = useState(fleet.primary_mission || "");
  const [secondaryMission, setSecondaryMission] = useState(fleet.secondary_mission || "");
  const [membersState, setMembersState] = useState(members);
  const [commanderId, setCommanderId] = useState<string | undefined>(
    commander ? String(commander.id) : undefined
  );
  const [commanderUsername, setCommanderUsername] = useState<string | undefined>(
    commander ? commander.username : undefined
  );
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(fleet.avatar);
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Kick member
  const handleKick = (idx: number) => {
    const kickedMember = membersState[idx];
    const newMembers = membersState.filter((_, i) => i !== idx);
    setMembersState(newMembers);

    // Update kicked user's fleet field to undefined
    if (kickedMember && kickedMember.id) {
      editUser(String(kickedMember.id), { fleet: undefined });
    }

    if (newMembers.length === 0) {
      setIsClosing(true);
      setCommanderId(undefined);
      setCommanderUsername(undefined);
    }
  };

  // Promote member to commander
  const handlePromote = (idx: number) => {
    const newCommander = membersState[idx];

    // Add the current commander back to members if they exist and aren't already in the list
    let newMembers = membersState;
    if (
      commanderUsername !== undefined &&
      typeof commanderId === "number" &&
      !newMembers.some(m => m.id === commanderId)
    ) {
      newMembers = [...newMembers, { username: commanderUsername, id: commanderId }];
    }

    setMembersState(newMembers);
    setCommanderId(String(newCommander.id));
    setCommanderUsername(newCommander.username);
  };

  // Leave command (remove self as commander)
  const handleLeaveCommand = () => {
    if (commanderUsername !== undefined && typeof commanderId === "number") {
      setMembersState([...membersState, { username: commanderUsername, id: commanderId }]);
    }
    setCommanderId(undefined);
    setCommanderUsername(undefined);
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    let updatedFleet: UserFleet = {
      ...fleet,
      avatar,
      primary_mission: primaryMission,
      secondary_mission: secondaryMission,
      commander_id: commanderId !== undefined ? String(commanderId) : undefined,
      members_ids: membersState.map(m => String(m.id)),
      commander_corsair_rank: dbUser.corsair_rank,

    };

    if (isClosing) {
      updatedFleet = {
        ...updatedFleet,
        members_ids: [],
        last_active: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
        commander_id: null,
        commander_corsair_rank: 0,
        active: false,
      };
    }

    try {
      await editFleet(String(fleet.id), {
        ...updatedFleet,
        action: isClosing ? "close_fleet" : "edit_fleet",
        changed_user_id: dbUser?.id,
      });
      // If closing, update all members and commander user.fleet to undefined
      if (isClosing) {
        const memberIds = Array.isArray(fleet.members_ids) ? fleet.members_ids : [];
        // Update each member
        await Promise.all(memberIds.map(id => editUser(String(id), { fleet: undefined })));
        // Update commander if present and not already in members_ids
        if (fleet.commander_id && !memberIds.includes(fleet.commander_id)) {
          await editUser(String(fleet.commander_id), { fleet: undefined });
        }
      }
      setIsEditing(false);
      setShowAvatarInput(false);
      setIsClosing(false);
      window.location.reload(); // <-- Add this line to refresh the page
      // Optionally, refresh fleet data here
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        alert("Another user has updated this fleet. Please refresh the page and try again.");
      } else {
        alert("Failed to save changes.");
      }
    }
    setSaving(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setPrimaryMission(fleet.primary_mission || "");
    setSecondaryMission(fleet.secondary_mission || "");
    setMembersState(members);
    setCommanderId(commander ? String(commander.id) : undefined);
    setCommanderUsername(commander ? commander.username : undefined);
  };

  return (
    <div className="fleet-card owner-manage-view">
      <div style={isClosing ? { opacity: 0.5, pointerEvents: "none" } : {}}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <img
              src={avatar}
              alt="Fleet Avatar"
              style={{
                width: 64,
                height: 64,
                borderRadius: 8,
                marginRight: 16,
                cursor: isEditing ? "pointer" : "default",
                border: isEditing ? "2px dashed #2d7aee" : undefined,
                transition: "border 0.2s"
              }}
              onClick={() => isEditing && setShowAvatarInput(v => !v)}
              title={isEditing ? "Click to change avatar" : undefined}
            />
            {isEditing && showAvatarInput && (
              <input
                type="url"
                placeholder="Paste image URL"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                style={{
                  position: "absolute",
                  top: 70,
                  left: 0,
                  width: 220,
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#23272a",
                  color: "#fff",
                  zIndex: 10,
                  fontSize: "1rem"
                }}
              />
            )}
          </div>
          <div>
            <h2 style={{ margin: 0, textDecoration: isClosing ? "line-through" : undefined }}>
              {fleet.name} <span style={{ fontSize: 16, color: "#2d7aee" }}>(Commanding)</span>
            </h2>
            <div style={{ color: "#aaa" }}>
              Commander: {commanderUsername}
            </div>
          </div>
        </div>

        {/* Mission Editing Section */}
        {isEditing ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Primary Mission:</strong>
              <textarea
                value={primaryMission}
                onChange={e => setPrimaryMission(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 60,
                  fontSize: "1.1rem",
                  marginTop: 4,
                  borderRadius: 6,
                  border: "1px solid #444",
                  padding: 8,
                  background: "#23272a",
                  color: "#fff",
                  resize: "vertical"
                }}
                maxLength={1000}
              />
            </div>
            <div>
              <strong>Secondary Mission:</strong>
              <textarea
                value={secondaryMission}
                onChange={e => setSecondaryMission(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 60,
                  fontSize: "1.1rem",
                  marginTop: 4,
                  borderRadius: 6,
                  border: "1px solid #444",
                  padding: 8,
                  background: "#23272a",
                  color: "#fff",
                  resize: "vertical"
                }}
                maxLength={1000}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div className="fleet-stat">
              <strong>Primary Mission:</strong> {primaryMission || "N/A"}
            </div>
            <div className="fleet-stat">
              <strong>Secondary Mission:</strong> {secondaryMission || "N/A"}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <div className="fleet-stat">
            <strong>Members:</strong> {fleet.members_ids?.length}
          </div>
          <div className="fleet-stat">
            <strong>Kills (Patch):</strong> {fleet.patch_kills ?? 0}
          </div>
          <div className="fleet-stat">
            <strong>Events (Patch):</strong> {fleet.total_events_patch ?? 0}
          </div>
          <div className="fleet-stat">
            <strong>Last Active:</strong> {fleet.last_active ? new Date(fleet.last_active).toLocaleString() : "N/A"}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <strong>Members:</strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: "4px 8px",
              alignItems: "center",
              maxWidth: 420,
            }}
          >
            {isClosing
              ? (
                <span style={{ color: "#bbb", fontStyle: "italic" }}>No members (fleet closing)</span>
              )
              : (membersState || []).map((member, idx) => {
                const isCurrentCommander =
                  commanderId !== undefined && String(member.id) === String(commanderId);
                return (
                  <React.Fragment key={member.id || idx}>
                    {/* Kick button: disabled for current commander */}
                    {isEditing ? (
                      <span
                        style={{
                          color: "#b22",
                          fontWeight: "bold",
                          fontSize: "1.2rem",
                          cursor: isCurrentCommander ? "not-allowed" : "pointer",
                          padding: "0 6px",
                          userSelect: "none",
                          lineHeight: 1,
                          display: "inline-block",
                          opacity: isCurrentCommander ? 0.5 : 1,
                          pointerEvents: isCurrentCommander ? "none" : "auto"
                        }}
                        onClick={() => !isCurrentCommander && handleKick(idx)}
                        title={isCurrentCommander ? "Cannot kick commander" : "Kick member"}
                      >
                        ❌
                      </span>
                    ) : (
                      <span />
                    )}
                    <span style={{ fontSize: "1rem" }}>
                      {member.username}
                      {isCurrentCommander && (
                        <span title="Commander" style={{ marginLeft: 6, color: "#f7c325" }}>👑</span>
                      )}
                    </span>
                    {/* Promote button: disabled for current commander */}
                    {isEditing ? (
                      <button
                        style={{
                          background: "#e7eefd",
                          color: "#2d7aee",
                          border: "1px solid #bcd",
                          borderRadius: 3,
                          padding: "2px 8px",
                          fontSize: "0.9rem",
                          cursor: isCurrentCommander ? "not-allowed" : "pointer",
                          marginLeft: 0,
                          opacity: isCurrentCommander ? 0.5 : 1,
                          pointerEvents: isCurrentCommander ? "none" : "auto"
                        }}
                        onClick={() => !isCurrentCommander && handlePromote(idx)}
                        title={isCurrentCommander ? "Already commander" : "Promote to Commander"}
                        disabled={isCurrentCommander}
                      >
                        Promote
                      </button>
                    ) : (
                      <span />
                    )}
                  </React.Fragment>
                );
              })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        {isEditing ? (
          <>
            <button
              style={{
                marginRight: 8,
                background: "#2d7aee",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "0.5rem 1rem",
                cursor: "pointer"
              }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              style={{
                background: "#aaa",
                color: "#222",
                border: "none",
                borderRadius: 4,
                padding: "0.5rem 1rem",
                cursor: "pointer"
              }}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              style={{
                marginLeft: 8,
                background: "#b22222",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "0.5rem 1rem",
                cursor: "pointer",
                opacity: isClosing ? 0.7 : 1
              }}
              onClick={() => {
                setIsClosing(true);
                setMembersState([]); // Clear members visually
              }}
              disabled={isClosing || saving}
              title="Close this fleet"
            >
              {isClosing ? "Closing" : "Close Fleet"}
            </button>
          </>
        ) : (
          <button
            style={{
              marginRight: 8,
              background: "#2d7aee",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "0.5rem 1rem",
              cursor: "pointer"
            }}
            onClick={() => {
              setCommanderId(commander ? String(commander.id) : undefined);
              setCommanderUsername(commander ? commander.username : undefined);
              setMembersState(members); // Do not add commander to membersState
              setIsEditing(true);
            }}
          >
            Edit Fleet
          </button>
        )}
      </div>
    </div>
  );
};

export default FleetOwnerManageView;