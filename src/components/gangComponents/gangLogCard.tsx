import React, { useState, useEffect } from "react";
import CreateBadgeModal from "../adminComponents/CreateBadgeModal";
import { fetchBadgeAccoladessById } from '../../api/badgeAccoladeRecordApi';
import { RecentGang } from "../../types/recent_gangs";

export interface FleetLogCard2Props {
  fleet: RecentGang;
  expanded: boolean;
  onToggleExpand: () => void;
  isModerator?: boolean;
  emojis?: any[];
  children?: React.ReactNode;
  onAwardAccolade?: () => void;
}

const GangLongCard: React.FC<FleetLogCard2Props> = ({ fleet, expanded, onToggleExpand, isModerator = false, emojis = [], children, onAwardAccolade }) => {
  // Simple Tooltip for channel name
  const [showTooltip, setShowTooltip] = useState(false);
  const [accolade, setAccolade] = useState<any>(null);
  // Modal state now handled by parent
  const [showAccoladeTooltip, setShowAccoladeTooltip] = useState(false);

  useEffect(() => {
    if (fleet.accolade) {
      fetchBadgeAccoladessById(fleet.accolade)
        .then(records => {
          if (records && records.length > 0) setAccolade(records[0]);
          else setAccolade(null);
        })
        .catch(() => setAccolade(null));
    } else {
      setAccolade(null);
    }
  }, [fleet.accolade]);

  return (
    <div
      style={{
        background: "#23272a",
        color: "#fff",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: 16,
        boxShadow: "0 2px 8px #0002",
        textAlign: "left",
        position: "relative",
      }}
    >
      {/* Accolade Icon and Award Button in same container if moderator */}
      {isModerator && (
        <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 21, display: 'flex', alignItems: 'center', gap: 10 }}>
          {accolade && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={accolade.badge_url}
                alt={accolade.badge_name}
                style={{ width: 32, height: 32, borderRadius: 6, boxShadow: '0 1px 4px #FFD70066', border: '1px solid #FFD700', background: '#23272a', cursor: 'pointer' }}
                onMouseEnter={() => setShowAccoladeTooltip(true)}
                onMouseLeave={() => setShowAccoladeTooltip(false)}
              />
              {showAccoladeTooltip && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: '#23272a',
                  color: '#ffd700',
                  border: '1px solid gold',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  minWidth: '220px',
                  zIndex: 30,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem' }}>{accolade.badge_name}</div>
                  <div style={{ fontSize: '0.95rem', marginBottom: '0.3rem' }}>{accolade.badge_description}</div>
                  <div style={{ fontSize: '0.9rem' }}>Weight: {accolade.badge_weight}</div>
                </div>
              )}
            </div>
          )}
          {!accolade && (
            <button
              style={{
                background: 'linear-gradient(90deg, #FFD700 60%, #FFA500 100%)',
                color: '#23272a',
                border: 'none',
                borderRadius: 6,
                padding: '0.25em 0.7em',
                fontWeight: 600,
                fontSize: 13,
                boxShadow: '0 1px 4px #FFD70066',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
              onClick={e => {
                e.stopPropagation();
                if (onAwardAccolade) onAwardAccolade();
              }}
            >
              Award Accolade
            </button>
          )}
          
        </div>
      )}
      {/* Accolade Icon for non-moderators */}
      {!isModerator && accolade && (
        <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={accolade.badge_url}
              alt={accolade.badge_name}
              style={{ width: 32, height: 32, borderRadius: 6, boxShadow: '0 1px 4px #FFD70066', border: '1px solid #FFD700', background: '#23272a', cursor: 'pointer' }}
              onMouseEnter={() => setShowAccoladeTooltip(true)}
              onMouseLeave={() => setShowAccoladeTooltip(false)}
            />
            {showAccoladeTooltip && (
              <div style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: '#23272a',
                color: '#ffd700',
                border: '1px solid gold',
                borderRadius: '8px',
                padding: '0.5rem',
                minWidth: '220px',
                zIndex: 30,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem' }}>{accolade.badge_name}</div>
                <div style={{ fontSize: '0.95rem', marginBottom: '0.3rem' }}>{accolade.badge_description}</div>
                <div style={{ fontSize: '0.9rem' }}>Weight: {accolade.badge_weight}</div>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {fleet.icon_url && (
          <span
            style={{ position: "relative", display: "inline-block" }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <img
              src={fleet.icon_url}
              alt={fleet.channel_name}
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                objectFit: "cover",
                border: "1px solid #353a40",
              }}
            />
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  top: "120%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#23272a",
                  color: "#7fd7ff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: "0 2px 12px #0008",
                  border: "1px solid #2d7aee",
                  textAlign: "center",
                  zIndex: 10,
                }}
              >
                {fleet.channel_name}
              </div>
            )}
          </span>
        )}
        <div>
          <div style={{ fontWeight: "bold", fontSize: 18, color: "#2d7aee" }}>
            {fleet.channel_name}
          </div>
          <div style={{ color: "#aaa", fontSize: 14 }}>
              {/* Calculate and display duration between created_at and timestamp */}
              {(() => {
                const start = new Date(fleet.created_at);
                const end = new Date(fleet.timestamp);
                const diffMs = end.getTime() - start.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                return `${diffHours} Hours ${diffMinutes} Minutes`;
              })()} (Patch: {fleet.patch})
          </div>
          {children}
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 18, margin: "12px 0 0 0", fontSize: 15 }}>
        <div>
          <span style={{ color: "#118ab2" }}>AC FPS Kills: </span>
          <span>{fleet.ac_fpskills ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#06d6a0" }}>AC Ship Kills: </span>
          <span>{fleet.ac_shipkills ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#ffd166" }}>PU FPS Kills: </span>
          <span>{fleet.pu_fpskills ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#ff6b6b" }}>PU Ship Kills: </span>
          <span>{fleet.pu_shipkills ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#f7b801" }}>Damages: </span>
          <span>{fleet.damages ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#ef476f" }}>Stolen Cargo: </span>
          <span>{fleet.stolen_cargo ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#a259f7" }}>Stolen Value: </span>
          <span>{fleet.stolen_value ?? 0}</span>
        </div>
        <div>
          <span style={{ color: "#b0b0b0" }}>Users: </span>
          <span>{fleet.users && Array.isArray(fleet.users) ? fleet.users.length : 0}</span>
        </div>
        
        
      </div>
      {/* Collapsible Fleet Users List */}
      <div style={{ marginTop: 16 }}>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#2d7aee",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 15,
            padding: 0,
            marginBottom: 6,
            textAlign: 'left',
            display: 'block',
          }}
          onClick={onToggleExpand}
        >
          {expanded ? `Hide Fleet Members (${fleet.users && Array.isArray(fleet.users) ? fleet.users.length : 0})` : `Show Fleet Members (${fleet.users && Array.isArray(fleet.users) ? fleet.users.length : 0})`}
        </button>
        {expanded && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {fleet.users && Array.isArray(fleet.users) && fleet.users.length > 0 ? (
              fleet.users.map((userJson: any, idx: number) => {
                let user;
                try {
                  user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
                } catch {
                  user = {};
                }
                return (
                  <div key={user.id || idx} style={{
                    background: "#181a1b",
                    borderRadius: 6,
                    padding: "0.75rem 1rem",
                    minWidth: 180,
                    color: "#fff",
                    boxShadow: "0 1px 4px #0004",
                    marginBottom: 8,
                    fontSize: 14,
                  }}>
                    <div style={{ fontWeight: "bold", color: "#2d7aee" }}>
                      {user.nickname || user.username || 'Unknown'}
                      {user.join_time && user.leave_time && (() => {
                        const join = new Date(user.join_time);
                        const leave = new Date(user.leave_time);
                        const diffMs = leave.getTime() - join.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        return (
                          <span style={{ marginLeft: 8, color: '#aaa', fontWeight: 'normal' }}>
                            {` | ${diffHours} Hours ${diffMinutes} Minutes`}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: '#118ab2', fontWeight: 700 }} title="AC FPS Kills">{user.ac_fpskills ?? 0}</span> | 
                      <span style={{ color: '#06d6a0', fontWeight: 700 }} title="AC Ship Kills"> {user.ac_shipkills ?? 0}</span> |
                      <span style={{ color: '#ffd166', fontWeight: 700 }} title="PU FPS Kills"> {user.pu_fpskills ?? 0}</span> | 
                      <span style={{ color: '#ff6b6b', fontWeight: 700 }} title="PU Ship Kills"> {user.pu_shipkills ?? 0}</span> | 
                      <span style={{ color: '#f7b801', fontWeight: 700 }} title="Damages"> {user.damages ?? 0}</span> |
                      <span style={{ color: '#ef476f', fontWeight: 700 }} title="Stolen Cargo"> {user.stolen_cargo ?? 0}</span> | 
                      <span style={{ color: '#a259f7', fontWeight: 700 }} title="Stolen Value"> {user.stolen_value ?? 0}</span> 
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#888' }}>No members found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GangLongCard;
