



import React, { useEffect, useState } from "react";
import PlayerCard from "./playerCard";
import { fetchAllActiveOrgGoals, fetchAllOrgGoals } from "../../api/orgGoalsApi";
import CreateOrgGoalModal from "./CreateOrgGoalModal";
import OrgGoalProgress from "./OrgGoalProgress";
import { SBLeaderboardOrgSummary } from "../../types/sb_leaderboard_org_summary";

interface OrgGoalsProps {
  dbUser: any;
  user: any;
  isModerator?: boolean; // Optional prop to indicate if the user is a moderator
  latestPatch?: any; // Optional prop for latest patch data
  orgSummaries?: SBLeaderboardOrgSummary[];
}


const OrgGoals: React.FC<OrgGoalsProps> = ({ dbUser, user, isModerator, latestPatch, orgSummaries }) => {
  // IRONPOINT Progress Comparison Section
  let ironpointSection: React.ReactNode = null;
  if (orgSummaries && Array.isArray(orgSummaries) && orgSummaries.length > 0) {
    const sortedOrgs = [...orgSummaries].sort((a, b) => (b.total_rating ?? 0) - (a.total_rating ?? 0));
    const ironIndex = sortedOrgs.findIndex(org => org.symbol === 'IRONPOINT');
    if (ironIndex !== -1) {
      const ironOrg = sortedOrgs[ironIndex];
      const ironRating = ironOrg.total_rating ?? 0;
      const ironMedia = ironOrg.org_media ? `${ironOrg.org_media}` : null;
      if (ironIndex === 0) {
        // IRONPOINT is the top org
        ironpointSection = (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2em 0' }}>
            <div style={{
              padding: '1em',
              background: '#222',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              maxWidth: '600px',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '0.7em', textAlign: 'center' }}>IRONPOINT Progress Towards Next Org</h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2vw',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                <div style={{ textAlign: 'center', minWidth: '80px', flex: '0 1 120px' }}>
                  {ironMedia && <img src={ironMedia} alt="IRONPOINT" style={{ width: '8vw', maxWidth: '64px', minWidth: '40px', height: '8vw', maxHeight: '64px', minHeight: '40px', borderRadius: '8px', border: '2px solid #ffd700', marginBottom: '0.5em', objectFit: 'cover' }} />}
                  <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1em' }}>IRONPOINT</div>
                  <div style={{ color: '#e0e0e0', fontSize: '0.95em' }}>Rating: {ironRating}</div>
                </div>
                <div style={{ flex: '1 1 180px', padding: '0 1em', textAlign: 'center', minWidth: '120px' }}>
                  <div style={{ color: '#b0b0b0', fontSize: '1em', marginBottom: '0.3em' }}>IRONPOINT is currently the top org!</div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // IRONPOINT is not the top org
        const nextOrg = sortedOrgs[ironIndex - 1];
        const nextRating = nextOrg.total_rating ?? 0;
        const nextMedia = nextOrg.org_media ? `${nextOrg.org_media}` : null;
        const progress = Math.min(100, Math.round((ironRating / nextRating) * 100));
        ironpointSection = (
          <div style={{
            margin: '2em 0',
            padding: '1em',
            background: '#222',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2em' }}>
              <div style={{ textAlign: 'center' }}>
                {ironMedia && <img src={ironMedia} alt="IRONPOINT" style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px solid #ffd700', marginBottom: '0.5em' }} />}
                <div style={{ color: '#ffd700', fontWeight: 'bold' }}>IRONPOINT</div>
                <div style={{ color: '#e0e0e0' }}>Rating: {ironRating}</div>
              </div>
              <div style={{ flex: 1, padding: '0 1em' }}>
                <div style={{ color: '#b0b0b0', fontSize: '0.95em', marginBottom: '0.3em', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  <h2>Squadron Battle Leaderboard</h2>
                  <span style={{ fontSize: '0.9em', color: '#ffd700' }}>IRONPOINT Position: {ironIndex}</span>
                  <span style={{ fontSize: '0.9em', color: '#e0e0e0', marginLeft: 12 }}>Next Org Position: {ironIndex - 1}</span>
                </div>
                <div style={{ background: '#333', borderRadius: '6px', height: '18px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, background: '#ffd700', height: '100%', borderRadius: '6px', transition: 'width 0.5s' }}></div>
                  <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', color: '#000', fontWeight: 'bold', fontSize: '0.95em', lineHeight: '18px' }}>{progress}%</div>
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '0.85em', marginTop: '0.3em', textAlign: 'center' }}>({ironRating} / {nextRating})</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                {nextMedia && <img src={nextMedia} alt={nextOrg.symbol} style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px solid #888', marginBottom: '0.5em' }} />}
                <div style={{ color: '#e0e0e0', fontWeight: 'bold' }}>{nextOrg.symbol}</div>
                <div style={{ color: '#e0e0e0' }}>Rating: {nextRating}</div>
              </div>
            </div>
          </div>
        );
      }
    }
  }
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalGoal, setModalGoal] = useState<any>(null);
  const [modalPosition, setModalPosition] = useState<number | null>(null);
  const [modalOverGoal, setModalOverGoal] = useState<any>(null);

  // Expose fetchGoals so it can be called after modal save
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await fetchAllActiveOrgGoals();
      setGoals(data);
    } catch (err) {
      setError("Failed to load org goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <>
      {/* Org Goals List and Progress */}
      <div className="org-goals-card org-goals-flex-horizontal">
        {/* Divider */}
        <div className="org-goals-divider" />
        {/* Right Section */}
        <div className="org-goals-right" style={{ width: '100%' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Org Goals
          </h2>
          <div className="org-goals-progress" style={{ width: '100%' }}>
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {!loading && !error && goals.length === 0 && <div>No active org goals.</div>}
            {!loading && !error && (() => {
              const sortedGoals = goals
                .slice()
                .sort((a, b) => (a.priority ?? 9999) - (b.priority ?? 9999));
              const topTwo = sortedGoals.slice(0, 2);
              return (
                <>
                  {topTwo.map((goal, idx) => (
                    <div className="progress-section" style={{ width: '100%', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} key={goal.id || idx}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                          {goal.goal_name}
                          {isModerator && (
                            <>
                              <button
                                title="Create Goal"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: 8 }}
                                onClick={() => {
                                  setModalMode('create');
                                  setModalGoal(null);
                                  setModalPosition(idx + 1);
                                  // Find the goal currently at this position (idx + 1)
                                  const overGoal = sortedGoals[idx];
                                  setModalOverGoal(overGoal);
                                  setModalOpen(true);
                                }}
                              >
                                <span role="img" aria-label="create" style={{ fontSize: 16 }}>➕</span>
                              </button>
                              <button
                                title="Edit Goal"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: 4 }}
                                onClick={() => {
                                  setModalMode('edit');
                                  setModalGoal(goal);
                                  setModalPosition(idx + 1);
                                  setModalOpen(true);
                                }}
                              >
                                <span role="img" aria-label="edit" style={{ fontSize: 16 }}>✏️</span>
                              </button>
                            </>
                          )}
                        </span>
                        <div style={{ fontSize: 13, color: '#a5a5a5ff', marginBottom: 4 }}>{goal.goal_description}</div>
                        {/* OrgGoalProgress bar for triggers */}
                        {(() => {
                          let triggers: any[] = [];
                          if (goal.goal_trigger) {
                            if (Array.isArray(goal.goal_trigger)) {
                              // If triggers are already objects, use them
                              triggers = goal.goal_trigger.map((t: any) => {
                                if (typeof t === 'string') {
                                  try {
                                    const parsed = JSON.parse(t);
                                    return parsed;
                                  } catch (err) {
                                    return null;
                                  }
                                }
                                return t;
                              }).filter(Boolean);
                            } else if (typeof goal.goal_trigger === 'string') {
                              // If triggers is a single stringified object or array
                              try {
                                const parsed = JSON.parse(goal.goal_trigger);
                                if (Array.isArray(parsed)) {
                                  triggers = parsed;
                                } else {
                                  triggers = [parsed];
                                }
                              } catch (err) {
                                triggers = [];
                              }
                            }
                          }
                          return (
                            <OrgGoalProgress
                              triggers={triggers}
                              manual_progress={goal.manual_progress}
                              manual_percentage={goal.manual_percentage}
                              start_date={goal.start_date}
                              end_date={goal.end_date}
                              orgSummaries={orgSummaries ?? []}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {/* IRONPOINT Progress Section (Next Org to Catch) */}
      {ironpointSection}
      {modalOpen && (
        <CreateOrgGoalModal
          open={modalOpen}
          mode={modalMode}
          goal={modalGoal}
          position={modalPosition}
          overGoal={modalMode === 'create' ? modalOverGoal : undefined}
          latestPatch={latestPatch}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchGoals();
          }}
        />
      )}
    </>
  );
};

export default OrgGoals;

{/* <section className="dashboard-header">
          <h1>Welcome, {user.username}#{user.discriminator}</h1>
          <p>Rank: {userRank?.name ? userRank.name : "Unknown"}</p>
          <img
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
            alt="User Avatar"
            className="avatar"
          />
        </section> */}