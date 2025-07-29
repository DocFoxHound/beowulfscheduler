
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
  dbUser?: any; // Optional prop for database user context
}


const AdminManagementPlayer: React.FC<AdminManagementPlayerProps> = ({ player, emojis, activeBadgeReusables, dbUser }) => {
  const [badgeReusables, setBadgeReusables] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState<any | null>(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]); // New state for badges
  const [badgesArrayLoading, setBadgesArrayLoading] = useState(false); // Loading state for badges array
  
  //check if player is a moderator or not
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
  
  useEffect(() => {
    if (player && player.id) {
      refreshBadgeReusables();
      refreshPlayerBadges();
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

  // Refresh functions for badge reusables and player badges
  const refreshBadgeReusables = () => {
    if (player && player.id) {
      setBadgesLoading(true);
      fetchBadgesByUserId(player.id)
        .then((data) => setBadgeReusables(Array.isArray(data) ? data : []))
        .catch(() => setBadgeReusables([]))
        .finally(() => setBadgesLoading(false));
    }
  };

  const refreshPlayerBadges = () => {
    if (player && player.id) {
      setBadgesArrayLoading(true);
      fetchBadgesByUserId(player.id)
        .then((data) => setBadges(Array.isArray(data) ? data : []))
        .catch(() => setBadges([]))
        .finally(() => setBadgesArrayLoading(false));
    }
  };

  if (!player) {
    return <div style={{ color: "#fff" }}>No player selected.</div>;
  }

  return (
    <div style={{ color: "#fff" }}>
      <PromotionProgress
        playerStats={playerStats}
        playerStatsLoading={playerStatsLoading}
        player={player}
        isModerator={isModerator}
        dbUser={dbUser}
      />
      <BadgeProgress
        activeBadgeReusables={activeBadgeReusables}
        loading={badgesLoading}
        playerStats={playerStats}
        playerStatsLoading={playerStatsLoading}
        playerBadges={badges}
        playerBadgesLoading={badgesArrayLoading}
        isModerator={isModerator}
        dbUser={dbUser}
        player={player}
        onRefreshBadges={refreshBadgeReusables}
        onRefreshPlayerBadges={refreshPlayerBadges}
      />
      
      <PrestigeProgress 
        activeBadgeReusables={activeBadgeReusables}
        playerStats={playerStats}
        playerStatsLoading={playerStatsLoading}
        player={player}
        isModerator={isModerator}
        dbUser={dbUser}
      />
    </div>
  );
};

export default AdminManagementPlayer;