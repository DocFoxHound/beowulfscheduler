
import React, { useEffect, useState } from 'react';
import { Emoji } from '../../types/emoji';
import { fetchRecentFleetsByPatch } from '../../api/recentGangsApi';
import { fetchAllEmojis } from '../../api/emojiApi';
import { RecentGang } from '../../types/recent_gangs';
import GangLongCard from './gangLogCard';
import CreateBadgeModal from '../adminComponents/CreateBadgeModal';

interface FleetLogFeedProps {
  isModerator: boolean;
  dbUser: any;
  isMember: boolean;
  recentFleets: RecentGang[];
}

const FleetLogFeed: React.FC<FleetLogFeedProps> = ({ isModerator, dbUser, isMember, recentFleets = [] }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [showAccoladeModal, setShowAccoladeModal] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState<RecentGang | null>(null);

  useEffect(() => {
    fetchAllEmojis()
      .then(setEmojis)
      .catch(() => setEmojis([]));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  const handleAwardAccolade = (fleet: RecentGang) => {
    setSelectedFleet(fleet);
    setShowAccoladeModal(true);
  };

  // Sort fleets by timestamp descending (newest first)
  const sortedFleets = [...recentFleets].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  });

  return (
    <div className="fleet-log-feed">
      <h3 style={{ color: '#2d7aee', fontWeight: 'bold', marginBottom: '1.2rem' }}>Recent Fleet Logs</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedFleets.length === 0 ? (
          <div style={{ color: '#2d7aee', fontWeight: 'bold' }}>No recent fleets found.</div>
        ) : sortedFleets.map((fleet, idx) => (
          <GangLongCard
            key={fleet.id}
            fleet={fleet}
            expanded={expanded === fleet.id}
            onToggleExpand={() => toggleExpand(fleet.id)}
            isModerator={isModerator}
            emojis={emojis}
            onAwardAccolade={() => handleAwardAccolade(fleet)}
          />
        ))}
      </div>
      {/* Global Accolade Modal */}
      {showAccoladeModal && selectedFleet && (
        
        (() => {
          // Transform selectedFleet.users to array of User objects with only id, username, nickname
          const userObjects = Array.isArray(selectedFleet.users)
            ? selectedFleet.users.map((user: any) => ({
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                corsair_level: 0,
                raptor_level: 0,
                raider_level: 0,
                rank: 0,
                roles: [],
                fleet: '',
                rsi_handle: '',
              }))
            : [];
          return (
            <CreateBadgeModal
              isOpen={showAccoladeModal}
              onClose={() => setShowAccoladeModal(false)}
              onSubmit={async (badge: any) => {
                // TODO: Implement accolade creation logic here
                setShowAccoladeModal(false);
              }}
              initialData={undefined}
              mode="create"
              submitLabel="Award Accolade"
              users={userObjects}
              fleet={selectedFleet}
              emojis={emojis}
              badgeType="accolade"
            />
          );
        })()
      )}
    </div>
  );
};

export default FleetLogFeed;
