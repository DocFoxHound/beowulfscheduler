import React, { useState } from "react";
import "./playerCard.css";
import PlayerPromotionProgress from "../adminComponents/PlayerPromotionProgress";
import RsiHandleModal from "./RsiHandleModal";

interface PlayerCardProps {
  dbUser: any;
  user: any;
  playerStats?: any;
  playerStatsLoading?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ dbUser, user, playerStats, playerStatsLoading }) => {
  const [showRsiModal, setShowRsiModal] = useState(false);
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
        playerStats={playerStats}
        playerStatsLoading={!!playerStatsLoading}
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