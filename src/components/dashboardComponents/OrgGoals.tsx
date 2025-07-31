



import React, { useEffect, useState } from "react";
import PlayerCard from "./playerCard";
import { fetchAllActiveOrgGoals, fetchAllOrgGoals } from "../../api/orgGoalsApi";
import CreateOrgGoalModal from "./CreateOrgGoalModal";

interface OrgGoalsProps {
  dbUser: any;
  user: any;
  isModerator?: boolean; // Optional prop to indicate if the user is a moderator
  latestPatch?: any; // Optional prop for latest patch data
}


const OrgGoals: React.FC<OrgGoalsProps> = ({ dbUser, user, isModerator, latestPatch }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalGoal, setModalGoal] = useState<any>(null);
  const [modalPosition, setModalPosition] = useState<number | null>(null);
  const [modalOverGoal, setModalOverGoal] = useState<any>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await fetchAllActiveOrgGoals();
        console.log('Fetched org goals:', data);
        setGoals(data);
      } catch (err) {
        setError("Failed to load org goals.");
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  return (
    <>
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
                        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{goal.goal_description}</div>
                        {/* Stand-in progress bar */}
                        <div style={{
                          height: 12,
                          background: '#eee',
                          borderRadius: 6,
                          overflow: 'hidden',
                          marginBottom: 4,
                          marginTop: 2,
                          width: '100%'
                        }}>
                          <div style={{
                            width: '40%', // Stand-in width
                            height: '100%',
                            background: '#4caf50',
                            borderRadius: 6,
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Third placeholder for Leaderboard Placement */}
                  <div className="progress-section" style={{ width: '100%', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', color: '#1976d2' }}>
                        Leaderboard Placement
                      </span>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                        Earn a top spot on the leaderboard this patch!
                      </div>
                      {/* Distinct progress bar for leaderboard */}
                      <div style={{
                        height: 14,
                        background: 'linear-gradient(90deg, #ffd700 0%, #fff7b2 100%)',
                        borderRadius: 7,
                        overflow: 'hidden',
                        marginBottom: 4,
                        marginTop: 2,
                        width: '100%',
                        border: '2px solid #ffd700',
                        boxShadow: '0 0 8px #ffd70055'
                      }}>
                        <div style={{
                          width: '20%', // Stand-in width for leaderboard progress
                          height: '100%',
                          background: 'linear-gradient(90deg, #ffec80 0%, #ffe066 100%)',
                          borderRadius: 7,
                          transition: 'width 0.3s',
                          boxShadow: '0 0 6px #ffd70099'
                        }} />
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {modalOpen && (
        <CreateOrgGoalModal
          open={modalOpen}
          mode={modalMode}
          goal={modalGoal}
          position={modalPosition}
          overGoal={modalMode === 'create' ? modalOverGoal : undefined}
          latestPatch={latestPatch}
          onClose={() => setModalOpen(false)}
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