import React, { useState, useEffect } from "react";
import { Hit } from "../../types/hittracker";
import { fetchRecentGangById } from "../../api/recentGangsApi";
import { RecentGang } from "../../types/recent_gangs";
import AddHitModal2 from "./CreateHitModal"; // Streamlined modal
import { User } from "../../types/user";

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
  // With gangs replacing fleets, commander concept is removed for now
  const [showEditModal, setShowEditModal] = useState(false);
  const [gangIcons, setGangIcons] = useState<string[]>([]);
  const [gangNames, setGangNames] = useState<string[]>([]);
  // isModerator: true if any dbUser.roles[] matches any BLOODED_IDS
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some(role => BLOODED_IDS.includes(role)) ?? false;

  useEffect(() => {
    let ignore = false;
    // Fetch gang data (names and icons) for each id in hit.fleet_ids
    const fetchGangs = async () => {
      if (hit.fleet_activity && Array.isArray(hit.fleet_ids) && hit.fleet_ids.length > 0) {
        try {
          const gangPromises = hit.fleet_ids.map(async (gangId) => {
            try {
              const gang: RecentGang = await fetchRecentGangById(String(gangId));
              return gang;
            } catch (e) {
              return null;
            }
          });
          const gangs = (await Promise.all(gangPromises)).filter(Boolean) as RecentGang[];
          if (!ignore) {
            setGangIcons(gangs.map(g => g.icon_url).filter(Boolean));
            setGangNames(gangs.map(g => g.channel_name).filter(Boolean));
          }
        } catch {
          if (!ignore) {
            setGangIcons([]);
            setGangNames([]);
          }
        }
      } else {
        setGangIcons([]);
        setGangNames([]);
      }
    };
    fetchGangs();

    return () => { ignore = true; };
  }, [hit.fleet_activity, hit.fleet_ids]);

  const cargoTooltip = Array.isArray(hit.cargo)
    ? hit.cargo.map((c: any) => `${c.scuAmount}x ${c.commodity_name}`).join("\n")
    : "";

  // Helper to convert video links to embed links (YouTube, Twitch, Vimeo)
  function getEmbedUrl(rawUrl: string): string | null {
    if (!rawUrl) return null;
    let u: URL | null = null;
    try {
      u = new URL(rawUrl);
    } catch {
      // Not a valid URL
      return null;
    }

    const host = u.hostname.replace(/^www\./, "");

    // YouTube: handle watch, youtu.be, shorts, live
    if (host.endsWith("youtube.com") || host === "youtu.be") {
      let videoId: string | null = null;
      if (host === "youtu.be") {
        videoId = u.pathname.split("/").filter(Boolean)[0] || null;
      } else if (u.pathname.startsWith("/watch")) {
        videoId = u.searchParams.get("v");
      } else if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/")[2] || null;
      } else if (u.pathname.startsWith("/live/")) {
        videoId = u.pathname.split("/")[2] || null;
      } else if (u.pathname.startsWith("/embed/")) {
        // Already an embed URL
        return u.toString();
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    // Twitch (videos)
    if (host.endsWith("twitch.tv")) {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const videoMatch = u.pathname.match(/\/videos\/(\d+)/);
      if (videoMatch) {
        return `https://player.twitch.tv/?video=${videoMatch[1]}&parent=${parent}`;
      }
      const clipMatch = u.pathname.match(/\/clip\/(\w+)/);
      if (clipMatch) {
        return `https://clips.twitch.tv/embed?clip=${clipMatch[1]}&parent=${parent}`;
      }
      return null;
    }

    // Vimeo
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    // Unsupported provider or non-embeddable URL
    return null;
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
  {/* Edit button, only if user owns this hit or is moderator */}
  {(hit.user_id === dbUser?.id || isModerator) && (
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
            paddingRight: (hit.user_id === dbUser?.id || isModerator) ? 70 : 0
          }}
        >
        </span>
      </div>

      {/* "GANGS" and gang names on opposite sides if fleet_activity */}
      {hit.fleet_activity && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 'bold', color: '#ffb347' }}>GANG</span>
          <span style={{ color: '#fff' }}>
            {gangNames && gangNames.length > 0 ? gangNames.join(", ") : null}
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
      {(() => {
        const embedUrl = getEmbedUrl(hit.video_link);
        if (!hit.video_link) return null;
        if (!embedUrl) {
          // Fallback: just show a link if we can't embed
          return (
            <div style={{ marginTop: 10 }}>
              <a href={hit.video_link} target="_blank" rel="noopener noreferrer" style={{ color: "#2d7aee", textDecoration: "underline" }}>
                View Video
              </a>
            </div>
          );
        }
        return (
          <div style={{ marginTop: 10 }}>
            <iframe
              src={embedUrl}
              title="Hit Video"
              style={{ width: "100%", minHeight: 220, border: "none", borderRadius: 6 }}
              allowFullScreen
            />
          </div>
        );
      })()}


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
        <AddHitModal2
          show={showEditModal}
          onClose={() => { setShowEditModal(false); window.location.reload(); }}
          gameVersion={hit.patch}
          userId={userId}
          username={hit.username}
          isEditMode={true}
          hit={hit}
          allUsers={allUsers}
          onUpdate={async () => {
            setShowEditModal(false);
            window.location.reload();
          }}
          onDelete={async () => {
            setShowEditModal(false);
            window.location.reload();
          }}
          onSubmit={async () => {
            // no-op
          }}
          isSubmitting={false}
          formError={null}
          setFormError={() => {}}
          dbUser={dbUser}
        />
      )}

      {/* Gang Icons in bottom-right corner */}
      {hit.fleet_activity && gangIcons.length > 0 && (
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
          {gangIcons.map((avatar, idx) => (
            <img
              key={avatar + idx}
              src={avatar}
              alt={`Gang Icon ${idx + 1}`}
              style={{
                width: gangIcons.length > 1 ? 32 : 48,
                height: gangIcons.length > 1 ? 32 : 48,
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