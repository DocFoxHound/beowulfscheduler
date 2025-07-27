import React, { useEffect, useState } from "react";
import { fetchAllBadgeReusables, deleteBadgeReusable, createBadgeReusable, fetchAllActiveBadgeReusables } from "../../api/badgeReusableApi";
import { BadgeReusable } from "../../types/badgeReusable";
import CreateBadgeModal from "./CreateBadgeModal";
import AwardBadgeModal from "./AwardBadgeModal";
import { type User } from "../../types/user";

interface AdminGeneralManagementProps {
  users: User[];
  loading: boolean;
  emojis: any[];
  activeBadgeReusables: any[];
}

const AdminGeneralManagement: React.FC<AdminGeneralManagementProps> = ({ users, loading, emojis, activeBadgeReusables }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editBadge, setEditBadge] = useState<BadgeReusable | null>(null);
  // State to track expanded/collapsed categories
  const [expandedCategories, setExpandedCategories] = useState<{ [subject: string]: boolean }>({});
  // State to track which badge's tooltip is open
  const [tooltipOpenId, setTooltipOpenId] = useState<string | null>(null);
  // State for Assign modal
  const [assignModal, setAssignModal] = useState<{ open: boolean; badge: BadgeReusable | null }>({ open: false, badge: null });
  // Local state for badges
  const [badgeReusables, setBadgeReusabless] = useState<any[]>(activeBadgeReusables);

  useEffect(() => {
    setBadgeReusabless(activeBadgeReusables);
  }, [activeBadgeReusables]);

  const visibleBadges = badgeReusables.filter((b: any) => !b.deleted);

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



  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this badge?")) return;
    setIsLoading(true);
    try {
      // Use updateBadgeReusable to soft-delete the badge
      const updated = await import("../../api/badgeReusableApi").then(api => api.updateBadgeReusable(String(id), { deleted: true }));
      setBadgeReusabless((prev) => prev.map((b) => b.id === id ? { ...b, deleted: true } : b));
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
    setBadgeReusabless((prev) => [...prev, created]);
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
        emojis={emojis}
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
                        <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "center" }}>Trigger</th>
                        <th style={{ padding: "0.5rem", borderBottom: "1px solid #444", textAlign: "left" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedBadges[subject].map((badge, idx) => {
                        // Show only metric, condition/operator, and value fields for each trigger condition, including nested AND/OR
                        let triggerInfoRaw = (badge as any).trigger;
                        let triggerInfo: React.ReactNode;
                        // Helper to render a single condition line
                        const renderCondition = (cond: any, idx: number) => (
                          <div key={idx}>
                            {`${cond.metric ?? "-"} ${cond.condition ?? cond.operator ?? "-"} ${cond.value ?? "-"}`}
                          </div>
                        );
                        // Helper to handle AND/OR objects
                        const renderTrigger = (triggerObj: any) => {
                          if (!triggerObj) return "No trigger info.";
                          // If it's an AND/OR type with .conditions array
                          if ((triggerObj.type === "AND" || triggerObj.type === "OR") && Array.isArray(triggerObj.conditions)) {
                            return (
                              <div style={{ whiteSpace: "pre-line" }}>
                                {triggerObj.conditions.map((cond: any, idx: number) => renderTrigger(cond))}
                              </div>
                            );
                          }
                          // Otherwise, treat as a single condition
                          return renderCondition(triggerObj, 0);
                        };
                        if (Array.isArray(triggerInfoRaw) && triggerInfoRaw.length > 0) {
                          triggerInfo = (
                            <div style={{ whiteSpace: "pre-line" }}>
                              {triggerInfoRaw.map((t: any, idx: number) => renderTrigger(t))}
                            </div>
                          );
                        } else if (typeof triggerInfoRaw === "object" && triggerInfoRaw !== null) {
                          triggerInfo = (
                            <div style={{ whiteSpace: "pre-line" }}>
                              {renderTrigger(triggerInfoRaw)}
                            </div>
                          );
                        } else if (triggerInfoRaw === undefined || triggerInfoRaw === null) {
                          triggerInfo = "No trigger info.";
                        } else {
                          triggerInfo = String(triggerInfoRaw);
                        }
                        // Use badge.id if unique, otherwise fallback to subject-idx-badge_name for uniqueness
                        const badgeId = badge.id && badge.id !== "" ? String(badge.id) : `${subject}-${idx}-${badge.badge_name}`;
                        return (
                          <tr key={badgeId}>
                            <td style={{ padding: "0.5rem", borderBottom: "1px solid #333" }}>
                              <span title={badge.badge_description} style={{ display: "flex", alignItems: "center" }}>
                                {badge.image_url && (
                                  <img
                                    src={badge.image_url}
                                    alt="badge icon"
                                    style={{ width: "24px", height: "24px", marginRight: "0.5em", borderRadius: "4px", objectFit: "cover", background: "#222" }}
                                  />
                                )}
                                <span>
                                  {badge.badge_name}
                                  {badge.prestige && badge.prestige_name && badge.prestige_level ? (
                                    <span style={{ fontSize: "0.85em", marginLeft: "0.4em", opacity: 0.8 }}>
                                      ({badge.prestige_name} {badge.prestige_level})
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            </td>
                            <td style={{ padding: "0.5rem", borderBottom: "1px solid #333" }}>{String(badge.badge_weight)}</td>
                            <td style={{ padding: "0.5rem", borderBottom: "1px solid #333", textAlign: "center" }}>
                              <div style={{ position: "relative", display: "inline-block" }}>
                                <span
                                  style={{
                                    cursor: "pointer",
                                    color: "#3bbca9",
                                    fontSize: "1.2em",
                                    verticalAlign: "middle",
                                  }}
                                  onMouseEnter={() => setTooltipOpenId(badgeId)}
                                  onMouseLeave={() => setTooltipOpenId(null)}
                                  tabIndex={0}
                                  aria-label="Show trigger info"
                                >
                                  &#9432;
                                </span>
                                {tooltipOpenId === badgeId && (
                                  <div
                                    style={{
                                      visibility: "visible",
                                      width: "220px",
                                      background: "#222",
                                      color: "#fff",
                                      textAlign: "left",
                                      borderRadius: "6px",
                                      padding: "0.7rem 1rem",
                                      position: "absolute",
                                      zIndex: 10,
                                      left: "50%",
                                      top: "120%",
                                      transform: "translateX(-50%)",
                                      boxShadow: "0 2px 8px #0005",
                                      fontSize: "0.97em",
                                      pointerEvents: "auto",
                                    }}
                                  >
                                    {triggerInfo}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "0.5rem", borderBottom: "1px solid #333" }}>
                              <button onClick={() => handleEdit(badge)} style={{ padding: "0.3rem 0.7rem", borderRadius: "4px", background: "#4fd339", color: "#fff", border: "none", marginRight: "0.5rem" }}>Edit</button>
                              <button onClick={() => handleDelete(String(badge.id))} style={{ padding: "0.3rem 0.7rem", borderRadius: "4px", background: "#e02323", color: "#fff", border: "none", marginRight: "0.5rem" }}>Delete</button>
                              <button onClick={() => setAssignModal({ open: true, badge })} style={{ padding: "0.3rem 0.7rem", borderRadius: "4px", background: "#3b6cbc", color: "#fff", border: "none" }}>Award To</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    {/* Assign Modal */}
    <AwardBadgeModal
      open={assignModal.open}
      badge={assignModal.badge}
      users={users}
      onClose={() => setAssignModal({ open: false, badge: null })}
    />
  </div>
  );
};

export default AdminGeneralManagement;
