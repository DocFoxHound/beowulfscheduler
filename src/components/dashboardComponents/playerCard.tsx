import React from "react";

interface PlayerCardProps {
  dbUser: any;
  user: any;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ dbUser, user }) => {
  const username = dbUser?.username || "Unknown";
  const discriminator = dbUser?.discriminator || "0000";
  const avatar = user?.avatar;
  const userId = user?.id;
  const nickname = dbUser?.nickname || "";
  const avatarUrl =
    avatar && userId
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`
      : undefined;

  return (
    <>
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
        </h3>
      </div>
    </>
  );
};

export default PlayerCard;