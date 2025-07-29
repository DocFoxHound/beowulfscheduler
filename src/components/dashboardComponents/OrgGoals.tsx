


import React from "react";
import PlayerCard from "./playerCard";

interface OrgGoalsProps {
  dbUser: any;
  user: any;
}

const OrgGoals: React.FC<OrgGoalsProps> = ({ dbUser, user }) => {

  const rsiHandle = dbUser?.rsi_handle || "N/A";

  return (
    <div className="org-goals-card org-goals-flex-horizontal">
      {/* Divider */}
      <div className="org-goals-divider" />
      {/* Right Section */}
      <div className="org-goals-right">
        <h2>Org Goals</h2>
        <div className="org-goals-progress">
          <div className="progress-section">
            <span>Org Goal 1</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: "40%" }} />
            </div>
          </div>
          <div className="progress-section">
            <span>Org Goal 2</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: "60%" }} />
            </div>
          </div>
          <div className="progress-section">
            <span>Leaderboard Goal</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: "25%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
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