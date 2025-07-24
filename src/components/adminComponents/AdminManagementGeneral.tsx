import React, { useEffect, useState } from "react";
import { fetchAllBadgeReusables, deleteBadgeReusable, createBadgeReusable, fetchAllActiveBadgeReusables } from "../../api/badgeReusableApi";
import { BadgeReusable } from "../../types/badgeReusable";
import CreateBadgeModal from "./CreateBadgeModal";
import { type User } from "../../types/user";

interface AdminGeneralManagementProps {
  users: User[];
  loading: boolean;
}

const AdminGeneralManagement: React.FC<AdminGeneralManagementProps> = ({ users, loading }) => {
  const [badges, setBadges] = useState<BadgeReusable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editBadge, setEditBadge] = useState<BadgeReusable | null>(null);
  // State to track expanded/collapsed categories
  const [expandedCategories, setExpandedCategories] = useState<{ [subject: string]: boolean }>({});


  const visibleBadges = badges.filter((b) => !b.deleted);

  // Group badges by subject
  const groupedBadges = visibleBadges.reduce((acc: { [subject: string]: BadgeReusable[] }, badge) => {
    const subject = badge.subject || "Uncategorized";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(badge);
    return acc;
  }, {});

  // Get sorted list of subjects
  const sortedSubjects = Object.keys(groupedBadges).sort((a, b) => a.localeCompare(b));

  // Toggle expand/collapse for a category
  const toggleCategory = (subject: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAllActiveBadgeReusables()
      .then((data) => setBadges(data))
      .catch((err) => setError("Failed to fetch badges."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this badge?")) return;
    setIsLoading(true);
    try {
      // Use updateBadgeReusable to soft-delete the badge
      const updated = await import("../../api/badgeReusableApi").then(api => api.updateBadgeReusable(String(id), { deleted: true }));
      setBadges((prev) => prev.map((b) => b.id === id ? { ...b, deleted: true } : b));
    } catch {
      setError("Failed to delete badge.");
    } finally {
      setIsLoading(false);
    }
  };

  // Create badge handler
  const handleCreate = () => {
    setEditBadge(null);
    setShowCreateModal(true);
  };

  const handleCreateBadge = async (badge: Omit<BadgeReusable, "id" | "deleted">) => {
    const newBadge: BadgeReusable = {
      ...badge,
      id: "", // id will be set by backend
      deleted: false,
      badge_weight: BigInt(badge.badge_weight),
      prestige: badge.prestige ?? false,
      subject: badge.subject ?? "",
      progression: badge.progression ?? false,
      progression_rank: badge.progression_rank ?? "",
    };
    const created = await createBadgeReusable(newBadge);
    setBadges((prev) => [...prev, created]);
  };

  const handleEditBadge = async (badge: BadgeReusable) => {
    // TODO: Implement updateBadgeReusable API call and update state
    // For now, just close modal
    setEditBadge(null);
    setShowCreateModal(false);
  };
  const handleEdit = (badge: BadgeReusable) => {
    setEditBadge(badge);
    setShowCreateModal(true);
  };



  return (
    <div style={{ background: "#222", color: "#fff", padding: "1rem", borderRadius: "8px" }}>
      <h2>Badge Management</h2>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={handleCreate} style={{ padding: "0.5rem 1rem", borderRadius: "4px", background: "#3bbca9", color: "#fff", border: "none", fontWeight: "bold" }}>Create Badge</button>
      </div>
      <CreateBadgeModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditBadge(null); }}
        onSubmit={editBadge ? handleEditBadge : handleCreateBadge}
        initialData={editBadge || undefined}
        mode={editBadge ? "edit" : "create"}
        submitLabel={editBadge ? "Save" : "Create"}
        users={users}
      />
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "#e02323" }}>{error}</div>
      ) : (
        <div>
          {sortedSubjects.length === 0 ? (
            <div style={{ padding: "1rem" }}>No badges found.</div>
          ) : (
            sortedSubjects.map((subject) => (
              <div key={subject} style={{ marginBottom: "1.5rem", background: "#232323", borderRadius: "6px", boxShadow: "0 1px 4px #0002" }}>
                <div
                  onClick={() => toggleCategory(subject)}
                  style={{
                    cursor: "pointer",
                    padding: "0.7rem 1rem",
                    fontWeight: "bold",
                    background: "#2a2a2a",
                    borderTopLeftRadius: "6px",
                    borderTopRightRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                  title={subject}
                >
                  <span style={{ marginRight: "0.7rem", fontSize: "1.1em" }}>
                    {expandedCategories[subject] ? "▼" : "►"}
                  </span>
                  {subject}
                </div>
                {expandedCategories[subject] ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#232323", color: "#fff" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Badge Name</th>
                        <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Weight</th>
                        <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Prestige Name</th>
                        <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedBadges[subject].map((badge) => (
                        <tr key={String(badge.id)}>
                          <td style={{ padding: "0.5rem", borderBottom: "1px solid #333" }}>
                            <span title={badge.badge_description}>{badge.badge_name}</span>
                          </td>
                          <td style={{ padding: "0.5rem", borderBottom: "1px solid #333" }}>{String(badge.badge_weight)}</td>
                          <td style={{ padding: "0.5rem", borderBottom: "1px solid #333" }}>
                            {badge.prestige_name
                              ? `${badge.prestige_name}${badge.prestige_level ? ` - ${badge.prestige_level}` : ""}`
                              : "-"}
                          </td>
                          <td style={{ padding: "0.5rem", borderBottom: "1px solid #333" }}>
                            <button onClick={() => handleEdit(badge)} style={{ marginRight: "0.5rem", padding: "0.3rem 0.7rem", borderRadius: "4px", background: "#4fd339", color: "#fff", border: "none" }}>Edit</button>
                            <button onClick={() => handleDelete(String(badge.id))} style={{ padding: "0.3rem 0.7rem", borderRadius: "4px", background: "#e02323", color: "#fff", border: "none" }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGeneralManagement;
