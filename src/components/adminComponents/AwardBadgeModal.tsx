import React, { useState, useRef } from "react";
import { createBadge } from "../../api/badgeRecordApi";
import { notifyAward } from "../../api/notifyAwardApi";
import { getLatestPatch } from "../../api/patchApi";
import { BadgeReusable } from "../../types/badgeReusable";
import { User } from "../../types/user";

interface AwardBadgeModalProps {
  open: boolean;
  badge: BadgeReusable | null;
  users: User[];
  onClose: () => void;
}

const AwardBadgeModal: React.FC<AwardBadgeModalProps> = ({ open, badge, users, onClose }) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [assignInput, setAssignInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build list of display names (nickname or username)
  const userDisplayNames = users.map(user => user.nickname ? user.nickname : user.username);
  // Filter suggestions based on input, exclude already selected
  const filteredSuggestions = assignInput.trim()
    ? userDisplayNames.filter(name => name.toLowerCase().includes(assignInput.trim().toLowerCase()) && !selectedUsers.includes(name))
    : [];

  // Add user to selectedUsers array
  const addUser = (name: string) => {
    if (name && !selectedUsers.includes(name)) {
      setSelectedUsers(prev => [...prev, name]);
      setAssignInput("");
      setShowSuggestions(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Submit logic for awarding badge
  const handleAward = async () => {
    if (!badge || selectedUsers.length === 0) return;
    try {
      const patchArr = await getLatestPatch();
      // Find the highest version (assuming version is a string like '4.2')
      let patch = null;
      if (Array.isArray(patchArr) && patchArr.length > 0) {
        patch = patchArr.reduce((max, curr) => {
          // Compare as numbers if possible, fallback to string
          const currVer = parseFloat(curr.version);
          const maxVer = parseFloat(max.version);
          return currVer > maxVer ? curr : max;
        }).version;
      } else if (patchArr?.version) {
        patch = patchArr.version;
      }
      for (const displayName of selectedUsers) {
        // Find user by display name (nickname or username)
        const userObj = users.find(u => (u.nickname ? u.nickname : u.username) === displayName);
        if (!userObj) continue;
        // Compose BadgeRecord
        const badgeRecord = {
          id: `${Date.now()}${Math.floor(Math.random() * 10000)}`,
          user_id: String(userObj.id),
          badge_name: badge.badge_name,
          badge_description: badge.badge_description,
          badge_weight: Number(badge.badge_weight),
          patch: patch,
          badge_icon: badge.emoji_name,
          badge_url: badge.image_url,
        };
        await createBadge(badgeRecord);
        // Notify Discord bot about the award
        try {
          await notifyAward(
            badge.badge_name,
            badge.badge_description,
            userObj.nickname ? userObj.nickname : userObj.username,
            String(userObj.id)
          );
        } catch (notifyErr) {
        }
      }
      setSuccess(`Badge awarded to: ${selectedUsers.join(", ")}`);
    } catch (err) {
      setSuccess("Error awarding badge(s). Please try again.");
    }
    setSelectedUsers([]);
    setAssignInput("");
    setTimeout(() => {
      setSuccess(null);
      onClose();
    }, 1200);
  };

  // Remove user from selectedUsers array
  const removeUser = (name: string) => {
    setSelectedUsers(prev => prev.filter(u => u !== name));
  };

  // Handle key events for input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        addUser(filteredSuggestions[0]);
      } else if (assignInput.trim() && userDisplayNames.includes(assignInput.trim()) && !selectedUsers.includes(assignInput.trim())) {
        addUser(assignInput.trim());
      }
    }
  };

  if (!open || !badge) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ background: "#232323", padding: "2rem 2.5rem", borderRadius: "8px", minWidth: 320, boxShadow: "0 2px 16px #0008" }}>
        <h3 style={{ marginTop: 0, color: "#fff" }}>Award Badge</h3>
        <div style={{ marginBottom: "1.2rem", position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            value={assignInput}
            onChange={e => {
              setAssignInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleInputKeyDown}
            placeholder="Enter player's name..."
            style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", background: "#181818", color: "#fff" }}
            autoFocus
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              background: "#232323",
              border: "1px solid #444",
              borderRadius: "4px",
              boxShadow: "0 2px 8px #0005",
              zIndex: 10,
              maxHeight: "180px",
              overflowY: "auto"
            }}>
              {filteredSuggestions.map((name, idx) => (
                <div
                  key={name + idx}
                  style={{
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    color: "#fff",
                    borderBottom: idx !== filteredSuggestions.length - 1 ? "1px solid #333" : undefined,
                    background: name === assignInput ? "#3bbca9" : undefined
                  }}
                  onMouseDown={() => {
                    addUser(name);
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
          {/* Chips for selected users */}
          {selectedUsers.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.7rem" }}>
              {selectedUsers.map((name) => {
                // Try to use user id for uniqueness if possible
                const userObj = users.find(u => (u.nickname ? u.nickname : u.username) === name);
                const key = userObj ? `${name}_${userObj.id}` : name;
                return (
                  <span key={key} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "#3bbca9",
                    color: "#fff",
                    borderRadius: "16px",
                    padding: "0.3rem 0.9rem 0.3rem 0.7rem",
                    fontSize: "0.97em",
                    fontWeight: 500
                  }}>
                    {name}
                    <span
                      style={{
                        marginLeft: "0.5em",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1.1em"
                      }}
                      title={`Remove ${name}`}
                      onClick={() => removeUser(name)}
                    >
                      ×
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.7rem" }}>
          <button
            onClick={onClose}
            style={{ padding: "0.4rem 1.1rem", borderRadius: "4px", background: "#444", color: "#fff", border: "none" }}
          >
            Cancel
          </button>
          <button
            onClick={handleAward}
            style={{ padding: "0.4rem 1.1rem", borderRadius: "4px", background: "#3bbca9", color: "#fff", border: "none", fontWeight: "bold" }}
            disabled={selectedUsers.length === 0}
          >
            Okay
          </button>
        {success && (
          <div style={{ marginTop: "1rem", color: "#4fd339", fontWeight: "bold", textAlign: "center" }}>
            {success}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AwardBadgeModal;
