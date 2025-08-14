import React from 'react';
import { fetchBadgesByUserIdAndAccolade } from '../../api/badgeRecordApi';
import { PlayerStats } from '../../types/player_stats';
import { hitSummary } from '../../types/hittracker';

interface PlayerGangStatsProps {
  dbUser: any;
  gameVersion: string | null;
  summaryData?: any[];
  displayType: string;
  playerStats?: any;
  playerStatsLoading?: boolean;
  piratePatchStats?: hitSummary;
  pirateTotalStats?: hitSummary;
  pirateOrgPatchStats?: hitSummary;
  pirateOrgTotalStats?: hitSummary;
}

const PlayerGangStats: React.FC<PlayerGangStatsProps> = ({ dbUser, gameVersion, summaryData, displayType, playerStats, piratePatchStats, pirateOrgTotalStats }) => {
  // Individual stats from summaryData (assume summaryData is an array with one object for the player)
  const stats = summaryData && summaryData.length > 0 ? summaryData[0] : {};

  // Accolade badge state
  const [badges, setBadges] = React.useState<any[]>([]);
  const [hoveredBadge, setHoveredBadge] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchBadges() {
      if (!dbUser?.id) return;
      try {
        const result = await fetchBadgesByUserIdAndAccolade(dbUser.id);
        setBadges(result || []);
      } catch {
        setBadges([]);
      }
    }
    fetchBadges();
  }, [dbUser]);

  return (
    <div className="player-fleet-stats" style={{ padding: '1rem' }}>
      {/* Individual Total Stats section, only if displayType === 'Dashboard' */}
      {displayType === 'Dashboard' && (
        <>
          {/* Copy of Individual Stats Box - Minimalist Industrial Design */}
          <div style={{
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            background: '#181a1b',
            color: '#e0e0e0',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: 'Roboto Mono, monospace',
            boxShadow: '0 2px 8px #0006',
            letterSpacing: '0.01em'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #333',
              marginBottom: '0.8rem',
              paddingBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.05em' }}>Individual Total Stats</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.7rem',
              fontSize: '1rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>AC FPS Kills</span>
                <span style={{ fontWeight: 700, color: '#118ab2' }}>{playerStats?.fpsackills || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>AC Ship Kills</span>
                <span style={{ fontWeight: 700, color: '#06d6a0' }}>{playerStats?.shipackills || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU FPS Kills</span>
                <span style={{ fontWeight: 700, color: '#ffd166' }}>{playerStats?.fpspukills || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU Ship Kills</span>
                <span style={{ fontWeight: 700, color: '#ff6b6b' }}>{playerStats?.shippukills || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Damages</span>
                <span style={{ fontWeight: 700, color: '#f7b801' }}>
                  {(() => {
                    const total = (playerStats?.shipacdamages || 0) + (playerStats?.shippudamages || 0);
                    return `$${total.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
                  })()}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Cargo</span>
                <span style={{ fontWeight: 700, color: '#ef476f' }}>{playerStats?.piracyscustolen ? Math.round(playerStats.piracyscustolen) : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Value</span>
                <span style={{ fontWeight: 700, color: '#a259f7' }}>{playerStats?.piracyvaluestolen ? Math.round(playerStats.piracyvaluestolen).toLocaleString('en-US') : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Pirate Hits</span>
                <span style={{ fontWeight: 700, color: '#00e1ff' }}>{playerStats?.piracyhits || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>SB Leaderboard</span>
                <span style={{ fontWeight: 700, color: '#ff00c8' }}>{playerStats?.shipsbleaderboardrank || 0}</span>
              </div>
            </div>
            {/* Accolade Badges Section */}
            <div style={{
              marginTop: '2rem',
            }}>
              <div style={{
                fontWeight: 600,
                color: '#b0b0b0',
                fontSize: '1.1rem',
                marginBottom: '0.7rem',
                letterSpacing: '0.03em'
              }}>Gang Accolades Earned</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '1.2rem',
                alignItems: 'center',
                justifyItems: 'center',
                minHeight: 80
              }}>
                {badges && badges.length > 0 ? badges.map((badge: any, idx: number) => (
                  <div
                    key={badge.id || idx}
                    style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    onMouseEnter={() => setHoveredBadge(badge.id || idx)}
                    onMouseLeave={() => setHoveredBadge(null)}
                  >
                    <img
                      src={badge.badge_url}
                      alt={badge.badge_title}
                      style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #888', objectFit: 'cover', background: '#222', marginBottom: 6, boxShadow: '0 2px 8px #0005' }}
                    />
                    <span style={{ color: '#ffd700', fontWeight: 500, fontSize: '0.95em', textAlign: 'center', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.badge_title}</span>
                    {/* Tooltip */}
                    {hoveredBadge === (badge.id || idx) && (
                      <div
                        style={{
                          display: 'block',
                          position: 'absolute',
                          top: 70,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#222',
                          color: '#ffd700',
                          border: '1px solid #888',
                          borderRadius: '8px',
                          padding: '0.7rem',
                          minWidth: '220px',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          fontSize: '0.98em',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: '0.3rem' }}>{badge.badge_title}</div>
                        <div style={{ fontSize: '0.97em', marginBottom: '0.3rem' }}>{badge.badge_description}</div>
                        <div style={{ fontSize: '0.93em' }}>Weight: {badge.badge_weight}</div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div style={{ color: '#888', gridColumn: '1 / span 5', textAlign: 'center', fontSize: '1em' }}>No accolades earned yet.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Individual Gang Stats Box - only if displayType === 'Gang' */}
      {displayType === 'Gang' && (
        <div style={{
          border: '1px solid #444',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          background: '#181a1b',
          color: '#e0e0e0',
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto',
          fontFamily: 'Roboto Mono, monospace',
          boxShadow: '0 2px 8px #0006',
          letterSpacing: '0.01em'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #333',
            marginBottom: '0.8rem',
            paddingBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.05em' }}>Individual Gang Stats ({gameVersion})</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.7rem',
            fontSize: '1rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>AC FPS Kills</span>
              <span style={{ fontWeight: 700, color: '#118ab2' }}>{stats.ac_fpskills || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>AC Ship Kills</span>
              <span style={{ fontWeight: 700, color: '#06d6a0' }}>{stats.ac_shipkills || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>PU FPS Kills</span>
              <span style={{ fontWeight: 700, color: '#ffd166' }}>{stats.pu_fpskills || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>PU Ship Kills</span>
              <span style={{ fontWeight: 700, color: '#ff6b6b' }}>{stats.pu_shipkills || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>Damages</span>
              <span style={{ fontWeight: 700, color: '#f7b801' }}>{stats.damages || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Cargo</span>
              <span style={{ fontWeight: 700, color: '#ef476f' }}>{stats.stolen_cargo || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Value</span>
              <span style={{ fontWeight: 700, color: '#a259f7' }}>{stats.stolen_value || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#888', fontSize: '0.95em' }}>Appearances</span>
              <span style={{ fontWeight: 700, color: '#b0b0b0' }}>{stats.appearances || 0}</span>
            </div>
          </div>
          {/* Accolade Badges Section */}
          <div style={{
            marginTop: '2rem',
          }}>
            <div style={{
              fontWeight: 600,
              color: '#b0b0b0',
              fontSize: '1.1rem',
              marginBottom: '0.7rem',
              letterSpacing: '0.03em'
            }}>Accolades Earned</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1.2rem',
              alignItems: 'center',
              justifyItems: 'center',
              minHeight: 80
            }}>
              {badges && badges.length > 0 ? badges.map((badge: any, idx: number) => (
                <div
                  key={badge.id || idx}
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  onMouseEnter={() => setHoveredBadge(badge.id || idx)}
                  onMouseLeave={() => setHoveredBadge(null)}
                >
                  <img
                    src={badge.badge_url}
                    alt={badge.badge_title}
                    style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #888', objectFit: 'cover', background: '#222', marginBottom: 6, boxShadow: '0 2px 8px #0005' }}
                  />
                  <span style={{ color: '#ffd700', fontWeight: 500, fontSize: '0.95em', textAlign: 'center', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.badge_title}</span>
                  {/* Tooltip */}
                  {hoveredBadge === (badge.id || idx) && (
                    <div
                      style={{
                        display: 'block',
                        position: 'absolute',
                        top: 70,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#222',
                        color: '#ffd700',
                        border: '1px solid #888',
                        borderRadius: '8px',
                        padding: '0.7rem',
                        minWidth: '220px',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        fontSize: '0.98em',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: '0.3rem' }}>{badge.badge_title}</div>
                      <div style={{ fontSize: '0.97em', marginBottom: '0.3rem' }}>{badge.badge_description}</div>
                      <div style={{ fontSize: '0.93em' }}>Weight: {badge.badge_weight}</div>
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ color: '#888', gridColumn: '1 / span 5', textAlign: 'center', fontSize: '1em' }}>No accolades earned yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Piracy Stats */}
      {displayType === 'Piracy' && (
        <>
          {/* Individual Piracy Stats This Patch */}
          <div style={{
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            background: '#181a1b',
            color: '#e0e0e0',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: 'Roboto Mono, monospace',
            boxShadow: '0 2px 8px #0006',
            letterSpacing: '0.01em'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #333',
              marginBottom: '0.8rem',
              paddingBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.05em' }}>Individual Stats ({gameVersion})</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.7rem',
              fontSize: '1rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Pirate Hits</span>
                <span style={{ fontWeight: 700, color: '#00e1ff' }}>{piratePatchStats?.total_hits || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Cargo</span>
                <span style={{ fontWeight: 700, color: '#ef476f' }}>{piratePatchStats?.total_cut_scu ? Math.round(piratePatchStats.total_cut_scu) : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Value</span>
                <span style={{ fontWeight: 700, color: '#a259f7' }}>{piratePatchStats?.total_cut_value ? Math.round(piratePatchStats.total_cut_value).toLocaleString('en-US') : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU FPS Kills</span>
                <span style={{ fontWeight: 700, color: '#ffd166' }}>{piratePatchStats?.fps_kills_pu || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU Ship Kills</span>
                <span style={{ fontWeight: 700, color: '#ff6b6b' }}>{piratePatchStats?.ship_kills_pu || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Damages</span>
                <span style={{ fontWeight: 700, color: '#f7b801' }}>
                  {(() => {
                    const total = (piratePatchStats?.value_pu || 0);
                    return `$${total.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Individual Piracy Stats All Time */}
          <div style={{
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            background: '#181a1b',
            color: '#e0e0e0',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: 'Roboto Mono, monospace',
            boxShadow: '0 2px 8px #0006',
            letterSpacing: '0.01em'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #333',
              marginBottom: '0.8rem',
              paddingBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.05em' }}>Individual Stats (Total)</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.7rem',
              fontSize: '1rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Pirate Hits</span>
                <span style={{ fontWeight: 700, color: '#00e1ff' }}>{playerStats?.piracyhits || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Cargo</span>
                <span style={{ fontWeight: 700, color: '#ef476f' }}>{playerStats?.piracyscustolen ? Math.round(playerStats.piracyscustolen) : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Value</span>
                <span style={{ fontWeight: 700, color: '#a259f7' }}>{playerStats?.piracyvaluestolen ? Math.round(playerStats.piracyvaluestolen).toLocaleString('en-US') : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU FPS Kills</span>
                <span style={{ fontWeight: 700, color: '#ffd166' }}>{playerStats?.fpspukills || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU Ship Kills</span>
                <span style={{ fontWeight: 700, color: '#ff6b6b' }}>{playerStats?.shippukills || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Damages</span>
                <span style={{ fontWeight: 700, color: '#f7b801' }}>
                  {(() => {
                    const total = (playerStats?.shippudamages || 0);
                    return `$${total.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Piracy Org Stats */}
      {displayType === 'PiracyOrgStats' && (
        <>
          {/* Org Stats This Patch */}
          <div style={{
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            background: '#181a1b',
            color: '#e0e0e0',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: 'Roboto Mono, monospace',
            boxShadow: '0 2px 8px #0006',
            letterSpacing: '0.01em'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #333',
              marginBottom: '0.8rem',
              paddingBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.05em' }}>Org Stats ({gameVersion})</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.7rem',
              fontSize: '1rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Pirate Hits</span>
                <span style={{ fontWeight: 700, color: '#00e1ff' }}>{piratePatchStats?.total_hits || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Cargo</span>
                <span style={{ fontWeight: 700, color: '#ef476f' }}>{piratePatchStats?.total_cut_scu ? Math.round(piratePatchStats.total_cut_scu) : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Value</span>
                <span style={{ fontWeight: 700, color: '#a259f7' }}>{piratePatchStats?.total_cut_value ? Math.round(piratePatchStats.total_cut_value).toLocaleString('en-US') : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU FPS Kills</span>
                <span style={{ fontWeight: 700, color: '#ffd166' }}>{piratePatchStats?.fps_kills_pu || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU Ship Kills</span>
                <span style={{ fontWeight: 700, color: '#ff6b6b' }}>{piratePatchStats?.ship_kills_pu || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Damages</span>
                <span style={{ fontWeight: 700, color: '#f7b801' }}>
                  {(() => {
                    const total = (piratePatchStats?.value_pu || 0);
                    return `$${total.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Org Piracy Stats All Time */}
          <div style={{
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            background: '#181a1b',
            color: '#e0e0e0',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: 'Roboto Mono, monospace',
            boxShadow: '0 2px 8px #0006',
            letterSpacing: '0.01em'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #333',
              marginBottom: '0.8rem',
              paddingBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.05em' }}>Org Stats (Total)</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.7rem',
              fontSize: '1rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Pirate Hits</span>
                <span style={{ fontWeight: 700, color: '#00e1ff' }}>{pirateOrgTotalStats?.total_hits || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Cargo</span>
                <span style={{ fontWeight: 700, color: '#ef476f' }}>{pirateOrgTotalStats?.total_cut_scu ? Math.round(pirateOrgTotalStats.total_cut_scu) : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Value</span>
                <span style={{ fontWeight: 700, color: '#a259f7' }}>{pirateOrgTotalStats?.total_cut_value ? Math.round(pirateOrgTotalStats.total_cut_value).toLocaleString('en-US') : 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU FPS Kills</span>
                <span style={{ fontWeight: 700, color: '#ffd166' }}>{pirateOrgTotalStats?.fps_kills_pu || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>PU Ship Kills</span>
                <span style={{ fontWeight: 700, color: '#ff6b6b' }}>{pirateOrgTotalStats?.ship_kills_pu || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: '#888', fontSize: '0.95em' }}>Damages</span>
                <span style={{ fontWeight: 700, color: '#f7b801' }}>
                  {(() => {
                    const total = (pirateOrgTotalStats?.value_pu || 0);
                    return `$${total.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerGangStats;
