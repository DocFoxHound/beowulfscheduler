import React, { useState, useEffect } from "react";
import { Hit } from "../types/hittracker";
import { fetchPlayerFleet, fetchFleetById } from "../api/fleetApi";
import AddHitModal from "./CreateHitModal"; // Import your modal
import { User } from "../types/user";

interface PiracyHitCardProps {
  hit: Hit;
  userId: string;
  allUsers: User[];
  dbUser?: User;
}


const PiracyHitCard: React.FC<PiracyHitCardProps> = ({ hit, userId, allUsers, dbUser }) => {
  // Find author from allUsers by hit.user_id
  const authorUser = allUsers.find(u => u.id === hit.user_id);
  const authorName = authorUser?.nickname || authorUser?.username || "Unknown";
  const [showCargoTooltip, setShowCargoTooltip] = useState(false);
  const [isFleetCommander, setIsFleetCommander] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fleetAvatars, setFleetAvatars] = useState<string[]>([]);
  // isModerator: true if any dbUser.roles[] matches any BLOODED_IDS
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some(role => BLOODED_IDS.includes(role)) ?? false;

  useEffect(() => {
    let ignore = false;
    const checkFleetCommander = async () => {
      if (hit.fleet_activity && hit.fleet_ids && hit.fleet_ids.length > 0) {
        try {
          const fleets = await fetchPlayerFleet(userId);
          // Check if any of the user's commanded fleets are in hit.fleet_ids
          const commandsFleet = fleets.some(fleet => hit.fleet_ids.includes(String(fleet.id)));
          if (!ignore) setIsFleetCommander(commandsFleet);
        } catch (e) {
          if (!ignore) setIsFleetCommander(false);
        }
      } else {
        setIsFleetCommander(false);
      }
    };
    checkFleetCommander();

    // Fetch fleet avatars for each fleet_id
    const fetchAvatars = async () => {
      if (hit.fleet_activity && Array.isArray(hit.fleet_ids) && hit.fleet_ids.length > 0) {
        try {
          const avatarPromises = hit.fleet_ids.map(async (fleetId) => {
            const fleets = await fetchFleetById(fleetId);
            // fetchFleetById returns an array, take the first fleet
            if (fleets && fleets.length > 0 && fleets[0].avatar) {
              return fleets[0].avatar;
            }
            return null;
          });
          const avatars = (await Promise.all(avatarPromises)).filter(Boolean) as string[];
          if (!ignore) setFleetAvatars(avatars);
        } catch (e) {
          if (!ignore) setFleetAvatars([]);
        }
      } else {
        setFleetAvatars([]);
      }
    };
    fetchAvatars();

    return () => { ignore = true; };
  }, [hit.fleet_activity, hit.fleet_ids, userId]);

  const cargoTooltip = Array.isArray(hit.cargo)
    ? hit.cargo.map((c: any) => `${c.scuAmount}x ${c.commodity_name}`).join("\n")
    : "";

  // Helper to convert video links to embed links (YouTube, Twitch, Vimeo)
  function getEmbedUrl(url: string) {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    // Twitch (videos)
    const twitchVideoMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (twitchVideoMatch) {
      // Replace 'localhost' with your actual domain in production
      return `https://player.twitch.tv/?video=${twitchVideoMatch[1]}&parent=localhost`;
    }
    // Twitch (clips)
    const twitchClipMatch = url.match(/twitch\.tv\/(?:\w+)?\/clip\/(\w+)/);
    if (twitchClipMatch) {
      return `https://clips.twitch.tv/embed?clip=${twitchClipMatch[1]}&parent=localhost`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
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
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Edit button, only if user owns this hit or is fleet commander */}
      {(hit.user_id === dbUser?.id || isFleetCommander || isModerator) && (
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

      {/* Title, type of piracy, and author */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {authorName}: {hit.title}
          </span>
        </div>
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: '#2d7aee',
            letterSpacing: 1,
            // Add more padding if Edit button is visible
            paddingRight: (hit.user_id === dbUser?.id || isFleetCommander || isModerator) ? 70 : 0
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

      {/* Assists (with tooltip for usernames), including guests */}
      <div style={{ marginTop: 6 }}>
        <span style={{ color: '#aaa' }}>Pirates:</span>{" "}
        <span
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 6px",
            alignItems: "center"
          }}
        >
          {(() => {
            // Combine assists_usernames and guests (if present)
            const assistsNames = Array.isArray(hit.assists_usernames) ? hit.assists_usernames : [];
            const guests = Array.isArray(hit.guests) ? hit.guests : [];
            const allAssists = [...assistsNames, ...guests];
            if (allAssists.length > 0) {
              return allAssists.map((name, idx) => (
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
                  title={
                    idx < assistsNames.length
                      ? `User ID: ${hit.assists?.[idx] || ""}\nUsername: ${name}`
                      : `Guest: ${name}`
                  }
                >
                  {name}
                </span>
              ));
            } else {
              return <span style={{ color: "#888" }}>None</span>;
            }
          })()}
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
          allUsers={allUsers}
          onUpdate={async (updatedHit) => {
            setShowEditModal(false);
          }}
          onDelete={async () => {
            setShowEditModal(false);
          }}
          onSubmit={async () => {
            // Dummy submit handler for edit mode
          }}
          isSubmitting={false}
          formError={null}
          setFormError={() => {}}
        />
      )}

      {/* Fleet Avatars in bottom-right corner */}
      {hit.fleet_activity && fleetAvatars.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            display: 'flex',
            gap: 6,
            alignItems: 'flex-end',
            zIndex: 5,
            background: 'rgba(35,39,43,0.7)',
            borderRadius: 8,
            padding: '4px 8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {fleetAvatars.map((avatar, idx) => (
            <img
              key={avatar + idx}
              src={avatar}
              alt={`Fleet Avatar ${idx + 1}`}
              style={{
                width: fleetAvatars.length > 1 ? 32 : 48,
                height: fleetAvatars.length > 1 ? 32 : 48,
                objectFit: 'cover',
                borderRadius: 6,
                border: '1px solid #444',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                background: '#23272b',
                transition: 'width 0.2s, height 0.2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PiracyHitCard;