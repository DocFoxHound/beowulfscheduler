import React, { useState, useEffect } from "react";
import { Hit } from "../types/hittracker";
import { fetchPlayerFleet } from "../api/fleetApi"; // <-- import this
import AddHitModal from "./AddHitModal"; // Import your modal

interface PiracyHitCardProps {
  hit: Hit;
  userId: string;
}

const PiracyHitCard: React.FC<PiracyHitCardProps> = ({ hit, userId }) => {
  const [showCargoTooltip, setShowCargoTooltip] = useState(false);
  const [isFleetCommander, setIsFleetCommander] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    let ignore = false;
    const checkFleetCommander = async () => {
      if (hit.fleet_activity && hit.fleet_ids && hit.fleet_ids.length > 0) {
        try {
          const fleets = await fetchPlayerFleet(userId);
          // Check if any of the user's commanded fleets are in hit.fleet_ids
          const commandsFleet = fleets.some(fleet => hit.fleet_ids.includes(fleet.id));
          if (!ignore) setIsFleetCommander(commandsFleet);
        } catch (e) {
          if (!ignore) setIsFleetCommander(false);
        }
      } else {
        setIsFleetCommander(false);
      }
    };
    checkFleetCommander();
    return () => { ignore = true; };
  }, [hit.fleet_activity, hit.fleet_ids, userId]);

  const cargoTooltip = Array.isArray(hit.cargo)
    ? hit.cargo.map((c: any) => `${c.scuAmount}x ${c.commodity_name}`).join("\n")
    : "";

  // Helper to convert YouTube links to embed links
  function getEmbedUrl(url: string) {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    // Add more providers as needed
    return url;
  }

  return (
    <div
      style={{
        background: '#23272b',
        borderRadius: 8,
        padding: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '1px solid #333',
        position: 'relative'
      }}
    >
      {/* Edit button, only if user owns this hit or is fleet commander */}
      {(hit.user_id === userId || isFleetCommander) && (
        <button
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "#2d7aee",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "4px 12px",
            cursor: "pointer",
            fontWeight: 600
          }}
          onClick={() => setShowEditModal(true)}
        >
          Edit
        </button>
      )}

      {/* Type of piracy in all caps, next to title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          {hit.title}
        </span>
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: '#2d7aee',
            letterSpacing: 1,
            // Reserve space for Edit button if it's visible for any reason
            paddingRight: (hit.user_id === userId || isFleetCommander) ? 70 : 0
          }}
        >
          {hit.type_of_piracy?.toUpperCase()}
        </span>
      </div>

      {/* "FLEET" and fleet names on opposite sides if fleet_activity */}
      {hit.fleet_activity && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 'bold', color: '#ffb347' }}>FLEET</span>
          <span style={{ color: '#fff' }}>
            {hit.fleet_names && hit.fleet_names.length > 0 ? hit.fleet_names.join(", ") : null}
          </span>
        </div>
      )}

      {/* Total cargo amount and Total value on the same line */}
      <div style={{ display: "flex", gap: 12, marginTop: 4, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: '#aaa' }}>Total Cargo:</span>{" "}
          <span style={{ fontWeight: 600 }}>
            {hit.total_scu?.toLocaleString()}
          </span>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <span style={{ color: '#aaa' }}>Total Value:</span>{" "}
          <span style={{ fontWeight: 600 }}>
            {hit.total_value?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Assists (with tooltip for usernames) */}
      <div style={{ marginTop: 6 }}>
        <span style={{ color: '#aaa' }}>Assists:</span>{" "}
        <span
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 6px",
            alignItems: "center"
          }}
        >
          {hit.assists_usernames && hit.assists_usernames.length > 0 ? (
            hit.assists_usernames.map((name, idx) => (
              <span
                key={name + idx}
                style={{
                  background: "#181a1b",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "2px 10px",
                  fontSize: 13,
                  marginRight: 0,
                  marginBottom: 4,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
                title={`User ID: ${hit.assists?.[idx] || ""}\nUsername: ${name}`}
              >
                {name}
              </span>
            ))
          ) : (
            <span style={{ color: "#888" }}>None</span>
          )}
        </span>
      </div>

      {/* Victims */}
      <div style={{ marginTop: 6 }}>
        <span style={{ color: '#aaa' }}>Victims:</span>{" "}
        {hit.victims && hit.victims.length > 0 ? (
          hit.victims.join(", ")
        ) : (
          <span style={{ color: "#888" }}>None</span>
        )}
      </div>

      {/* Cargo items (on hover) */}
      <div style={{ marginTop: 6, position: "relative", display: "inline-block" }}>
        <span style={{ color: '#aaa' }}>Cargo Items:</span>{" "}
        <span
          style={{
            textDecoration: "underline dotted",
            cursor: "pointer",
            color: "#2d7aee",
            position: "relative"
          }}
          onMouseEnter={() => setShowCargoTooltip(true)}
          onMouseLeave={() => setShowCargoTooltip(false)}
        >
          Hover to view
          {showCargoTooltip && cargoTooltip && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "120%",
                zIndex: 10,
                background: "#181a1b",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                minWidth: 180,
                maxWidth: 320,
                fontSize: 13,
                whiteSpace: "pre-line" // <-- changed from pre-wrap
              }}
            >
              {cargoTooltip}
            </div>
          )}
        </span>
      </div>

      {/* Embedded video */}
      {hit.video_link && (
        <div style={{ marginTop: 10 }}>
          <iframe
            src={getEmbedUrl(hit.video_link)}
            title="Hit Video"
            style={{ width: "100%", minHeight: 220, border: "none", borderRadius: 6 }}
            allowFullScreen
          />
        </div>
      )}

      {/* Additional media links */}
      {hit.additional_media_links && hit.additional_media_links.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <span style={{ color: '#aaa' }}>Additional Media:</span>{" "}
          {hit.additional_media_links.map((link, idx) => (
            <a
              key={link + idx}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#2d7aee",
                marginRight: 8,
                textDecoration: "underline"
              }}
            >
              Link {idx + 1}
            </a>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <AddHitModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          gameVersion={hit.patch}
          userId={userId}
          username={hit.username}
          isEditMode={true}
          hit={hit}
          onUpdate={async (updatedHit) => {
            // Call your update API here
            // await updateHit(updatedHit);
            setShowEditModal(false);
            // Optionally refresh hit list
          }}
          onDelete={async () => {
            // Call your delete API here
            // await deleteHit(hit.id);
            setShowEditModal(false);
            // Optionally refresh hit list
          }}
          onSubmit={async () => {
            // Dummy submit handler for edit mode
          }}
          isSubmitting={false}
          formError={null}
          setFormError={() => {}}
          summarizedItems={[]}
        />
      )}
    </div>
  );
};

export default PiracyHitCard;