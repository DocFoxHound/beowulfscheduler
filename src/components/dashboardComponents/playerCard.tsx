import React, { useEffect, useState } from "react";
import "./playerCard.css";
import PlayerPromotionProgress from "../adminComponents/PlayerPromotionProgress";
import RsiHandleModal from "./RsiHandleModal";
import { fetchPlayerStatsByUserId } from "../../api/playerStatsApi";

interface PlayerCardProps {
  dbUser: any;
  user: any;
  playerStats?: any;
  playerStatsLoading?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ dbUser, user, playerStats, playerStatsLoading }) => {
  const [showRsiModal, setShowRsiModal] = useState(false);
  // Local stats state to ensure PromotionProgress can render outside admin page
  const [localStats, setLocalStats] = useState<any | null>(playerStats ?? null);
  const [localLoading, setLocalLoading] = useState<boolean>(!!playerStatsLoading);
  const username = dbUser?.username || "Unknown";
  const discriminator = dbUser?.discriminator || "0000";
  const avatar = user?.avatar;
  const userId = user?.id;
  const nickname = dbUser?.nickname || "";
  const rsiHandle = dbUser?.rsi_handle || "N/A";
  const avatarUrl =
    avatar && userId
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`
      : undefined;

  // If parent didn't provide stats, fetch them by userId
  useEffect(() => {
    let cancelled = false;

    // Derive rank name from Discord roles as a fallback when stats are missing
    const deriveRankNameFromRoles = (): string | undefined => {
      const roles: string[] = Array.isArray(dbUser?.roles) ? dbUser.roles : [];
      const toIds = (v: string | undefined) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);
      const bloodedIds = toIds(import.meta.env.VITE_BLOODED_ID);
      const marauderIds = toIds(import.meta.env.VITE_MARAUDER_ID);
      const crewIds = toIds(import.meta.env.VITE_CREW_ID);
      const prospectIds = toIds(import.meta.env.VITE_PROSPECT_ID);
      const friendlyIds = toIds(import.meta.env.VITE_FRIENDLY_ID);
      const hasAny = (ids: string[]) => roles.some((r) => ids.includes(r));
      if (hasAny(bloodedIds)) return "Blooded";
      if (hasAny(marauderIds)) return "Marauder";
      if (hasAny(crewIds)) return "Crew";
      if (hasAny(prospectIds)) return "Prospect";
      if (hasAny(friendlyIds)) return "Friendly";
      return undefined;
    };

    const run = async () => {
      // If props provided, mirror them
      if (playerStats) {
        setLocalStats(playerStats);
        setLocalLoading(!!playerStatsLoading);
        return;
      }

      if (!userId) {
        setLocalStats(null);
        setLocalLoading(false);
        return;
      }

      try {
        setLocalLoading(true);
        const stats = await fetchPlayerStatsByUserId(String(userId));
        if (!cancelled) {
          if (stats) {
            setLocalStats(stats);
          } else {
            // Build minimal stats so PlayerPromotionProgress can still render requirements
            setLocalStats({ user_id: userId, rank_name: deriveRankNameFromRoles() });
          }
        }
      } catch {
        if (!cancelled) setLocalStats({ user_id: userId, rank_name: deriveRankNameFromRoles() });
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [playerStats, playerStatsLoading, userId]);

  return (
    <>
      <div className="playercard-centered">
        <div className="org-goals-user-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" className="avatar" />
          ) : (
            <div className="avatar avatar-placeholder" />
          )}
        </div>
        <div className="org-goals-user-details">
          <h3>
            {username}
            <span className="discriminator">#{discriminator}</span>
            <br />{nickname}
            <br />
            <span className="rsi-handle">
              RSI: {rsiHandle}
              <button
                className="rsi-edit-btn"
                title="Edit RSI Handle"
                style={{ marginLeft: 6, padding: 0, background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowRsiModal(true)}
              >
                <span role="img" aria-label="edit">✏️</span>
              </button>
            </span>
          </h3>
        </div>
      </div>
      {/* Promotion progress below RSI handle */}
      <PlayerPromotionProgress
    playerStats={localStats ?? {}}
        playerStatsLoading={!!localLoading}
        player={user}
        dbUser={dbUser}
      />
      {showRsiModal && (
        <RsiHandleModal dbUser={dbUser} onClose={() => setShowRsiModal(false)} />
      )}
    </>
  );
};

export default PlayerCard;