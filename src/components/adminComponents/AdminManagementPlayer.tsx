
import React, { useEffect, useState } from "react";
import { fetchBadgesByUserId } from "../../api/badgeRecordApi";
// Player stats are now provided from parent to avoid per-click fetches
import BadgeProgress from "./PlayerBadgeProgress";
import PromotionProgress from "./PlayerPromotionProgress";
import PrestigeProgress from "./PlayerPrestigeProgress";

interface AdminManagementPlayerProps {
  player: any; // Replace 'any' with your UserWithData type if available
  playerStats?: any | null;
  playerStatsLoading?: boolean;
  emojis?: any[];
  activeBadgeReusables: any[];
  dbUser?: any; // Optional prop for database user context
}

const AdminManagementPlayer: React.FC<AdminManagementPlayerProps> = ({ player, playerStats, playerStatsLoading = false, emojis, activeBadgeReusables, dbUser }) => {
  const [badgeReusables, setBadgeReusables] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [badgesArrayLoading, setBadgesArrayLoading] = useState(false);
  
  //check if player is a moderator or not
  const BLOODED_IDS = (import.meta.env.VITE_BLOODED_ID || "").split(",");
  const isModerator = dbUser?.roles?.some((role: string) => BLOODED_IDS.includes(role)) ?? false;
  
  useEffect(() => {
    if (player && player.id) {
      // Single fetch used to populate both: the user's badges and any dependent views
      const run = async () => {
        setBadgesLoading(true);
        setBadgesArrayLoading(true);
        try {
          const data = await fetchBadgesByUserId(player.id);
          const arr = Array.isArray(data) ? data : [];
          setBadgeReusables(arr);
          setBadges(arr);
        } catch {
          setBadgeReusables([]);
          setBadges([]);
        } finally {
          setBadgesLoading(false);
          setBadgesArrayLoading(false);
        }
      };
      run();
    } else {
      setBadgeReusables([]);
      setBadges([]);
    }
  }, [player]);

  // Refresh functions for badge reusables and player badges
  const refreshBadgeReusables = () => {
    if (player && player.id) {
      setBadgesLoading(true);
      fetchBadgesByUserId(player.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          setBadgeReusables(arr);
          setBadges(arr); // keep both in sync
        })
        .catch(() => {
          setBadgeReusables([]);
          setBadges([]);
        })
        .finally(() => setBadgesLoading(false));
    }
  };

  const refreshPlayerBadges = () => {
    if (player && player.id) {
      setBadgesArrayLoading(true);
      fetchBadgesByUserId(player.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          setBadges(arr);
          setBadgeReusables(arr); // keep both in sync
        })
        .catch(() => {
          setBadges([]);
          setBadgeReusables([]);
        })
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
        badgeReusables={activeBadgeReusables}
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