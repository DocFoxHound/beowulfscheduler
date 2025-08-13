import React, { useEffect, useState } from 'react';
import { fetchRecentFleetsSummary } from '../../api/recentGangsApi';
import { fetchBadgeAccoladessById } from '../../api/badgeAccoladeRecordApi';

interface OrgFleetStatsProps {
  dbUser: any;
  gameVersion: string | null;
  summaryData: any[];
  recentFleets: any[],
}

const OrgFleetStats: React.FC<OrgFleetStatsProps> = ({ dbUser, gameVersion, summaryData, recentFleets }) => {
  // Expand state for each card
  const [expandedCards, setExpandedCards] = useState<{[key: string]: boolean}>({});

  const handleToggleExpand = (key: string) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };
  // Calculate collective stats
  const collectiveStats = summaryData.reduce((acc, entry) => {
    acc.ac_fpskills += Number(entry.ac_fpskills || 0);
    acc.ac_shipkills += Number(entry.ac_shipkills || 0);
    acc.appearances += Number(entry.appearances || 0);
    acc.damages += Number(entry.damages || 0);
    acc.pu_fpskills += Number(entry.pu_fpskills || 0);
    acc.pu_shipkills += Number(entry.pu_shipkills || 0);
    acc.stolen_cargo += Number(entry.stolen_cargo || 0);
    acc.stolen_value += Number(entry.stolen_value || 0);
    return acc;
  }, {
    ac_fpskills: 0,
    ac_shipkills: 0,
    appearances: 0,
    damages: 0,
    pu_fpskills: 0,
    pu_shipkills: 0,
    stolen_cargo: 0,
    stolen_value: 0,
  });

  // Top 10 players by appearances
  const topPlayers = [...summaryData]
    .sort((a, b) => Number(b.appearances) - Number(a.appearances))
    .slice(0, 10);

  // Top Fleet Actions calculations
  const topUsersFleet = [...recentFleets]
    .sort((a, b) => (b.users?.length || 0) - (a.users?.length || 0))[0];

  const topStolenCargoFleet = [...recentFleets]
    .sort((a, b) => Number(b.stolen_cargo || 0) - Number(a.stolen_cargo || 0))[0];

  const topPUKillsFleet = [...recentFleets]
    .sort((a, b) => ((Number(b.pu_shipkills || 0) + Number(b.pu_fpskills || 0)) - (Number(a.pu_shipkills || 0) + Number(a.pu_fpskills || 0))))[0];

  const topACKillsFleet = [...recentFleets]
    .sort((a, b) => ((Number(b.ac_shipkills || 0) + Number(b.ac_fpskills || 0)) - (Number(a.ac_shipkills || 0) + Number(a.ac_fpskills || 0))))[0];

  const topDamagesFleet = [...recentFleets]
    .sort((a, b) => Number(b.damages || 0) - Number(a.damages || 0))[0];

  // State for accolade badge details
  const [accoladeBadges, setAccoladeBadges] = useState<{[key: string]: { url: string, name: string, description: string, weight: number } }>({});

  // Helper to fetch badge for a fleet accolade
  useEffect(() => {
    const fetchBadges = async () => {
      const fleets = [topUsersFleet, topStolenCargoFleet, topPUKillsFleet, topACKillsFleet, topDamagesFleet];
      const promises = fleets.map(async (fleet) => {
        if (fleet && fleet.accolade) {
          try {
            const badges = await fetchBadgeAccoladessById(fleet.accolade);
            if (badges && badges.length > 0) {
              const badge = badges[0];
              return {
                id: fleet.accolade,
                url: badge.badge_url,
                name: badge.badge_name,
                description: badge.badge_description,
                weight: badge.badge_weight
              };
            }
          } catch {}
        }
        return null;
      });
      const results = await Promise.all(promises);
      const badgeMap: {[key: string]: { url: string, name: string, description: string, weight: number } } = {};
      results.forEach(b => { if (b) badgeMap[b.id] = { url: b.url, name: b.name, description: b.description, weight: b.weight }; });
      setAccoladeBadges(badgeMap);
    };
    fetchBadges();
  }, [topUsersFleet, topStolenCargoFleet, topPUKillsFleet, topACKillsFleet, topDamagesFleet]);
  return (
    <div className="org-fleet-stats" style={{ padding: '1rem' }}>
      <h2>Organization Fleet Stats</h2>
  {/* Collective Stats Box - Minimalist Industrial Design */}
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
      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.05em' }}>Collective Stats</span>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0.7rem',
      fontSize: '1rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>AC FPS Kills</span>
  <span style={{ fontWeight: 700, color: '#118ab2' }}>{collectiveStats.ac_fpskills}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>AC Ship Kills</span>
  <span style={{ fontWeight: 700, color: '#06d6a0' }}>{collectiveStats.ac_shipkills}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>PU FPS Kills</span>
  <span style={{ fontWeight: 700, color: '#ffd166' }}>{collectiveStats.pu_fpskills}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>PU Ship Kills</span>
  <span style={{ fontWeight: 700, color: '#ff6b6b' }}>{collectiveStats.pu_shipkills}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>Damages</span>
  <span style={{ fontWeight: 700, color: '#f7b801' }}>{collectiveStats.damages}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Cargo</span>
  <span style={{ fontWeight: 700, color: '#ef476f' }}>{collectiveStats.stolen_cargo}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>Stolen Value</span>
  <span style={{ fontWeight: 700, color: '#a259f7' }}>{collectiveStats.stolen_value}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#888', fontSize: '0.95em' }}>Appearances</span>
  <span style={{ fontWeight: 700, color: '#b0b0b0' }}>{collectiveStats.appearances}</span>
      </div>
    </div>
  </div>

      {/* Top Fleet Actions Placeholder */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: 'transparent' }}>
          <h3>Top Fleet Actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {[{
              label: 'Largest Fleet',
              fleet: topUsersFleet,
              value: topUsersFleet?.users?.length || 0,
              valueLabel: 'Users'
            }, {
              label: 'Most Stolen Cargo',
              fleet: topStolenCargoFleet,
              value: topStolenCargoFleet?.stolen_cargo,
              valueLabel: 'Stolen Cargo'
            }, {
              label: 'Most PU Kills',
              fleet: topPUKillsFleet,
              value: topPUKillsFleet ? (Number(topPUKillsFleet.pu_shipkills || 0) + Number(topPUKillsFleet.pu_fpskills || 0)) : 0,
              valueLabel: 'PU Kills'
            }, {
              label: 'Most AC Kills',
              fleet: topACKillsFleet,
              value: topACKillsFleet ? (Number(topACKillsFleet.ac_shipkills || 0) + Number(topACKillsFleet.ac_fpskills || 0)) : 0,
              valueLabel: 'AC Kills'
            }, {
              label: 'Most Damages',
              fleet: topDamagesFleet,
              value: topDamagesFleet?.damages,
              valueLabel: 'Damages'
            }].map(({ label, fleet, value, valueLabel }, idx) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #ccc', borderRadius: '8px', padding: '0.5rem 1rem', minWidth: '320px', background: '#222', color: '#fff', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Fleet Icon Left */}
                  {fleet?.icon_url && (
                    <img src={fleet.icon_url} alt="Fleet Icon" style={{ width: 48, height: 48, borderRadius: '8px', marginRight: '1rem', objectFit: 'cover', background: '#333' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{label}</div>
                    {fleet ? (
                      <>
                        <div>Channel: {fleet.channel_name}</div>
                        <div>{valueLabel}: {value}</div>
                      </>
                    ) : 'N/A'}
                  </div>
                  {/* Accolade Badge Right with Tooltip */}
                  {fleet?.accolade && accoladeBadges[fleet.accolade] && (
                    <div style={{ position: 'relative', marginLeft: '1rem', display: 'inline-block' }}>
                      <img
                        src={accoladeBadges[fleet.accolade].url}
                        alt="Accolade Badge"
                        style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid gold', objectFit: 'cover', background: '#333', cursor: 'pointer' }}
                        onMouseEnter={e => {
                          const tooltip = e.currentTarget.nextSibling as HTMLElement;
                          if (tooltip) tooltip.style.display = 'block';
                        }}
                        onMouseLeave={e => {
                          const tooltip = e.currentTarget.nextSibling as HTMLElement;
                          if (tooltip) tooltip.style.display = 'none';
                        }}
                      />
                      <div
                        style={{
                          display: 'none',
                          position: 'absolute',
                          top: '110%',
                          right: 0,
                          background: '#222',
                          color: '#ffd700',
                          border: '1px solid gold',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          minWidth: '220px',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem' }}>{accoladeBadges[fleet.accolade].name}</div>
                        <div style={{ fontSize: '0.95rem', marginBottom: '0.3rem' }}>{accoladeBadges[fleet.accolade].description}</div>
                        <div style={{ fontSize: '0.9rem' }}>Weight: {accoladeBadges[fleet.accolade].weight}</div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Show Details and Duration on same line, outside collapsible section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0 0.5rem 0' }}>
                  <span
                    style={{
                      color: '#ffd700',
                      cursor: 'pointer',
                      fontWeight: 500,
                      textDecoration: 'underline',
                      fontSize: '1rem'
                    }}
                    onClick={() => handleToggleExpand(label)}
                  >
                    {expandedCards[label] ? 'Hide Details' : 'Show Details'}
                  </span>
                  <span style={{ color: '#aaa', fontSize: '1rem', fontWeight: 500 }}>
                    <strong>Duration:</strong> {
                      (() => {
                        if (fleet?.created_at && fleet?.timestamp) {
                          const start = new Date(fleet.created_at);
                          const end = new Date(fleet.timestamp);
                          const diffMs = end.getTime() - start.getTime();
                          if (diffMs > 0) {
                            const totalMinutes = Math.floor(diffMs / 60000);
                            const hours = Math.floor(totalMinutes / 60);
                            const minutes = totalMinutes % 60;
                            return `${hours} Hours ${minutes} Minutes`;
                          }
                        }
                        return 'Unknown';
                      })()
                    }
                  </span>
                </div>
                {/* Expandable Section */}
                {expandedCards[label] && fleet && (
                    <div style={{ marginTop: '1rem', background: '#181a1b', borderRadius: 6, padding: '0.75rem 1rem' }}>

                    <div style={{ fontWeight: 'bold', color: '#ffd700', marginBottom: 6 }}>Fleet Members:</div>
                    {fleet.users && Array.isArray(fleet.users) && fleet.users.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {fleet.users.map((userJson: any, idx: number) => {
                          let user;
                          try {
                            user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
                          } catch {
                            user = {};
                          }
                          // Calculate duration
                          let durationStr = '';
                          if (user.join_time && user.leave_time) {
                            const start = new Date(user.join_time);
                            const end = new Date(user.leave_time);
                            const diffMs = end.getTime() - start.getTime();
                            if (diffMs > 0) {
                              const totalMinutes = Math.floor(diffMs / 60000);
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              durationStr = `${hours} Hours ${minutes} Minutes`;
                            } else {
                              durationStr = '0 Hours 0 Minutes';
                            }
                          } else {
                            durationStr = 'Unknown';
                          }
                          return (
                            <div key={user.id || idx} style={{ background: '#222', borderRadius: 6, padding: '0.5rem 1rem', minWidth: 120, color: '#fff', boxShadow: '0 1px 4px #0004', fontSize: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: '#2d7aee' }}>{user.nickname || user.username || 'Unknown'}</span>
                                <span style={{ color: '#aaa', fontSize: '0.95em', marginLeft: 8 }}>
                                  {durationStr}
                                </span>
                              </div>
                              <div style={{ marginTop: 0, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span style={{ color: '#118ab2', fontWeight: 700 }} title="AC FPS Kills">{user.ac_fpskills ?? 0}</span> | 
                                <span style={{ color: '#06d6a0', fontWeight: 700 }} title="AC Ship Kills">{user.ac_shipkills ?? 0}</span> | 
                                <span style={{ color: '#ffd166', fontWeight: 700 }} title="PU FPS Kills">{user.pu_fpskills ?? 0}</span> | 
                                <span style={{ color: '#ff6b6b', fontWeight: 700 }} title="PU Ship Kills">{user.pu_shipkills ?? 0}</span> | 
                                <span style={{ color: '#f7b801', fontWeight: 700 }} title="Damages">{user.damages ?? 0}</span> |
                                <span style={{ color: '#ef476f', fontWeight: 700 }} title="Stolen Cargo">{user.stolen_cargo ?? 0}</span> | 
                                <span style={{ color: '#a259f7', fontWeight: 700 }} title="Stolen Value">{user.stolen_value ?? 0}</span> 
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ color: '#888' }}>No members found.</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
};

export default OrgFleetStats;

