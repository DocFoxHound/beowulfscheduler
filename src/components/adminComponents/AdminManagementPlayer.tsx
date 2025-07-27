
import React, { useEffect, useState } from "react";
import { fetchBadgesByUserId } from "../../api/badgeRecordApi";
import { fetchPlayerStatsByUserId } from "../../api/playerStatsApi";
import BadgeProgress from "./PlayerBadgeProgress";
import PromotionProgress from "./PlayerPromotionProgress";
import PrestigeProgress from "./PlayerPrestigeProgress";

interface AdminManagementPlayerProps {
  player: any; // Replace 'any' with your UserWithData type if available
  emojis?: any[];
  activeBadgeReusables: any[];
}


const AdminManagementPlayer: React.FC<AdminManagementPlayerProps> = ({ player, emojis, activeBadgeReusables }) => {
  const [badgeReusables, setBadgeReusables] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState<any | null>(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]); // New state for badges
  const [badgesArrayLoading, setBadgesArrayLoading] = useState(false); // Loading state for badges array

  useEffect(() => {
    if (player && player.id) {
      setBadgesLoading(true);
      fetchBadgesByUserId(player.id)
        .then((data) => setBadgeReusables(Array.isArray(data) ? data : []))
        .catch(() => setBadgeReusables([]))
        .finally(() => setBadgesLoading(false));

      setBadgesArrayLoading(true);
      fetchBadgesByUserId(player.id)
        .then((data) => setBadges(Array.isArray(data) ? data : []))
        .catch(() => setBadges([]))
        .finally(() => setBadgesArrayLoading(false));

      setPlayerStatsLoading(true);
      fetchPlayerStatsByUserId(player.id)
        .then((data) => setPlayerStats(data))
        .catch(() => setPlayerStats(null))
        .finally(() => setPlayerStatsLoading(false));
    } else {
      setBadgeReusables([]);
      setBadges([]);
      setPlayerStats(null);
    }
  }, [player]);

  if (!player) {
    return <div style={{ color: "#fff" }}>No player selected.</div>;
  }

  return (
    <div style={{ color: "#fff" }}>
      <h3>Player Management: {player.username}</h3>
      <PromotionProgress
        playerStats={playerStats}
        playerStatsLoading={playerStatsLoading}
        player={player}
      />
      <BadgeProgress
        activeBadgeReusables={activeBadgeReusables}
        loading={badgesLoading}
        playerStats={playerStats}
        playerStatsLoading={playerStatsLoading}
        playerBadges={badges}
        playerBadgesLoading={badgesArrayLoading}
      />
      
      <PrestigeProgress 
        activeBadgeReusables={activeBadgeReusables}
        playerStats={playerStats}
        playerStatsLoading={playerStatsLoading}
        player={player}
      />
    </div>
  );
};

export default AdminManagementPlayer;