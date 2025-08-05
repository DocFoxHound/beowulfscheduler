import React from "react";
import { BadgeReusable } from "../../types/badgeReusable";

interface SelectSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeReusables: BadgeReusable[];
  onSelect: (series: BadgeReusable) => void;
}

const SelectSeriesModal: React.FC<SelectSeriesModalProps> = ({ isOpen, onClose, badgeReusables, onSelect }) => {
  if (!isOpen) return null;

  // Group badges: all series as major categories, singles grouped by subject
  const singlesBySubject: Record<string, BadgeReusable[]> = {};
  const seriesGroups: Record<string, BadgeReusable[]> = {};
  badgeReusables.forEach(badge => {
    if (badge.series_id === null || badge.series_id === undefined) {
      const subject = badge.subject || "Other";
      if (!singlesBySubject[subject]) singlesBySubject[subject] = [];
      singlesBySubject[subject].push(badge);
    } else {
      const seriesId = badge.series_id;
      if (!seriesGroups[seriesId]) seriesGroups[seriesId] = [];
      seriesGroups[seriesId].push(badge);
    }
  });

  // Sort badges in each series by series_position (as string, but try to parse as number)
  // Sort series badges
  Object.values(seriesGroups).forEach(seriesArr => {
    seriesArr.sort((a, b) => {
      const posA = a.series_position ? parseInt(a.series_position) : 0;
      const posB = b.series_position ? parseInt(b.series_position) : 0;
      return posA - posB;
    });
  });
  // Sort singles by badge_name
  Object.values(singlesBySubject).forEach(arr => {
    arr.sort((a, b) => {
      if (a.badge_name < b.badge_name) return -1;
      if (a.badge_name > b.badge_name) return 1;
      return 0;
    });
  });


  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#222", color: "#fff", padding: "2rem", borderRadius: "8px", minWidth: 350, maxWidth: 500 }}
        onClick={e => e.stopPropagation()}
      >
        <h3>Select Series</h3>
        <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid #333", borderRadius: 8, background: "#181818", padding: "0.5rem" }}>
          {Object.keys(seriesGroups).length === 0 && Object.keys(singlesBySubject).length === 0 ? (
            <div style={{ color: "#aaa", textAlign: "center", margin: "2rem 0" }}>No series available.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {/* Series as major categories */}
              {Object.entries(seriesGroups).map(([seriesId, badges]) => (
                <li key={seriesId} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: "#7be0d6", fontSize: "1.1em" }}>
                    Series: {badges[0]?.badge_name || "Unnamed"}
                  </div>
                  <ul style={{ listStyle: "none", paddingLeft: 24, margin: 0 }}>
                    {badges.map(badge => (
                      <li key={badge.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, cursor: "pointer" }}
                          onClick={() => onSelect(badge)}
                      >
                        <img src={badge.image_url} alt={badge.badge_name} style={{ width: 32, height: 32, borderRadius: 6, background: "#333", objectFit: "cover" }} />
                        <span style={{ fontWeight: 400, color: "#fff" }}>{badge.badge_name}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              {/* Singles grouped by subject */}
              {Object.entries(singlesBySubject).map(([subject, badges]) => (
                <li key={subject} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: "#3bbca9", fontSize: "1.1em" }}>{subject}</div>
                  <ul style={{ listStyle: "none", paddingLeft: 24, margin: 0 }}>
                    {badges.map(badge => (
                      <li key={badge.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, cursor: "pointer" }}
                          onClick={() => onSelect(badge)}
                      >
                        <img src={badge.image_url} alt={badge.badge_name} style={{ width: 32, height: 32, borderRadius: 6, background: "#333", objectFit: "cover" }} />
                        <span style={{ fontWeight: 400, color: "#fff" }}>{badge.badge_name}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          style={{ marginTop: 24, background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem" }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SelectSeriesModal;
