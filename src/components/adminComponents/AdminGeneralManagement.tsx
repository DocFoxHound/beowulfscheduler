import React, { useEffect, useState } from "react";
import { fetchAllBadgeReusables, deleteBadgeReusable } from "../../api/badgeReusableApi";
import { BadgeReusable } from "../../types/badgeReusable";

const AdminGeneralManagement: React.FC = () => {
  const [badges, setBadges] = useState<BadgeReusable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAllBadgeReusables()
      .then((data) => setBadges(data))
      .catch((err) => setError("Failed to fetch badges."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this badge?")) return;
    setLoading(true);
    try {
      await deleteBadgeReusable(String(id));
      setBadges((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("Failed to delete badge.");
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for create and edit actions
  const handleCreate = () => {
    alert("Create Badge functionality not implemented yet.");
  };
  const handleEdit = (badge: BadgeReusable) => {
    alert(`Edit Badge: ${badge.badge_name}`);
  };

  const visibleBadges = badges.filter((b) => !b.deleted);

  return (
    <div style={{ background: "#222", color: "#fff", padding: "1rem", borderRadius: "8px" }}>
      <h2>General Management</h2>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={handleCreate} style={{ padding: "0.5rem 1rem", borderRadius: "4px", background: "#3bbca9", color: "#fff", border: "none", fontWeight: "bold" }}>Create Badge</button>
        <button onClick={() => alert("Delete Badge: Select a badge row to delete.")}
          style={{ padding: "0.5rem 1rem", borderRadius: "4px", background: "#e02323", color: "#fff", border: "none", fontWeight: "bold" }}>
          Delete Badge
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "#e02323" }}>{error}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#222", color: "#fff" }}>
          <thead>
            <tr>
              <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Badge Name</th>
              <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Weight</th>
              <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Prestige Name</th>
              <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleBadges.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "1rem" }}>No badges found.</td></tr>
            ) : (
              visibleBadges.map((badge) => (
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
                    <button onClick={() => handleDelete(badge.id)} style={{ padding: "0.3rem 0.7rem", borderRadius: "4px", background: "#e02323", color: "#fff", border: "none" }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminGeneralManagement;
