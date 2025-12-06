import React, { useEffect, useMemo, useState } from "react";
import "./playerCard.css";
import PlayerPromotionProgress from "../adminComponents/PlayerPromotionProgress";
import RsiHandleModal from "./RsiHandleModal";
import { fetchPlayerStatsByUserId } from "../../api/playerStatsApi";

const parseIds = (value?: string) =>
  (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const rankConfig = [
  { label: "Friendly", ids: parseIds(import.meta.env.VITE_FRIENDLY_ID) },
  { label: "Prospect", ids: parseIds(import.meta.env.VITE_PROSPECT_ID) },
  { label: "Crew", ids: parseIds(import.meta.env.VITE_CREW_ID) },
  { label: "Marauder", ids: parseIds(import.meta.env.VITE_MARAUDER_ID) },
  { label: "Blooded", ids: parseIds(import.meta.env.VITE_BLOODED_ID) },
];

const resolveRolesFromSources = (sources: any[]): string[] => {
  for (const source of sources) {
    if (Array.isArray(source) && source.length > 0) {
      return source
        .map((role) => (role === null || role === undefined ? null : String(role)))
        .filter((role): role is string => Boolean(role && role.length));
    }
  }
  return [];
};

const determineRankFromRoles = (roles: string[]): string | undefined => {
  if (!roles.length) return undefined;
  let detected: string | undefined;
  rankConfig.forEach(({ label, ids }) => {
    if (!ids.length) return;
    if (roles.some((role) => ids.includes(role))) {
      detected = label;
    }
  });
  return detected;
};

interface PlayerCardProps {
  dbUser: any;
  user: any;
  playerStats?: any;
  playerStatsLoading?: boolean;
  playerBadges?: any[]; // pass down to promotion progress for Crew Challenge badge detection
}

const PlayerCard: React.FC<PlayerCardProps> = ({ dbUser, user, playerStats, playerStatsLoading, playerBadges = [] }) => {
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
  const userRoles = useMemo(
    () =>
      resolveRolesFromSources([
        dbUser?.roles,
        dbUser?.discord_roles,
        dbUser?.role_ids,
        dbUser?.roleIds,
        user?.roles,
        user?.role_ids,
        user?.roleIds,
      ]),
    [dbUser, user]
  );
  const presentRank = useMemo(() => determineRankFromRoles(userRoles), [userRoles]);

  // If parent didn't provide stats, fetch them by userId
  useEffect(() => {
    let cancelled = false;

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
            setLocalStats({ user_id: userId, rank_name: presentRank });
          }
        }
      } catch {
        if (!cancelled) setLocalStats({ user_id: userId, rank_name: presentRank });
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [playerStats, playerStatsLoading, userId, presentRank]);

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
            <div className="player-rank-chip">
              Rank: {presentRank ?? "Unranked"}
            </div>
          </h3>
        </div>
      </div>
      {/* Promotion progress below RSI handle */}
      <PlayerPromotionProgress
        playerStats={localStats ?? {}}
        playerStatsLoading={!!localLoading}
        player={user}
        dbUser={dbUser}
        playerBadges={playerBadges}
      />
      {showRsiModal && (
        <RsiHandleModal dbUser={dbUser} onClose={() => setShowRsiModal(false)} />
      )}
    </>
  );
};

export default PlayerCard;