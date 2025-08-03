import React, { useEffect, useState } from "react";
import { SBLeaderboardOrgSummary } from "../../types/sb_leaderboard_org_summary";
import { fetchPlayerSummaryByNickname } from "../../api/leaderboardApi";

import { getUsersByRoninRole } from "../../api/userService";



interface RoninTeamProps {
  dbUser: any;
  orgSummaries?: SBLeaderboardOrgSummary[];
}

export default function RoninTeam(props: RoninTeamProps) {
  const { dbUser, orgSummaries } = props;
  const [playerSummary, setPlayerSummary] = useState<any>(null);
  const [roninUsers, setRoninUsers] = useState<any[]>([]);
  const [roninSummaries, setRoninSummaries] = useState<any[]>([]);
  const [roninMissing, setRoninMissing] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    //   {orgSummaries && Array.isArray(orgSummaries) && orgSummaries.length > 0 && (() => {

  useEffect(() => {
    // Fetch leaderboard summary for the current user
    if (dbUser?.rsi_handle) {
      setLoading(true);
      fetchPlayerSummaryByNickname(dbUser.rsi_handle)
        .then((data) => {
          setPlayerSummary(data);
          setError(null);
        })
        .catch((err) => {
          setError("You do not have a leaderboard summary yet. Please play some matches to generate one.");
          setPlayerSummary(null);
        })
        .finally(() => setLoading(false));
    }
    // Fetch all users with Ronin role
    getUsersByRoninRole()
      .then(async (users) => {
        setRoninUsers(users || []);
        if (users && users.length > 0) {
          // Fetch summaries for all Ronin users in parallel
          const summaryResults = await Promise.all(
            users.map(async (user: any) => {
              if (user.rsi_handle) {
                try {
                  const summary = await fetchPlayerSummaryByNickname(user.rsi_handle);
                  return { user, summary };
                } catch {
                  return { user, summary: null };
                }
              }
              return { user, summary: null };
            })
          );
          // Separate valid summaries and missing records
          const validSummaries = summaryResults
            .filter(({ summary }) => summary)
            .map(({ summary, user }) => ({ ...summary, rsi_handle: user.rsi_handle, id: user.id }));
          validSummaries.sort((a, b) => (b.total_rating ?? 0) - (a.total_rating ?? 0));
          setRoninSummaries(validSummaries);

          const missing = summaryResults
            .filter(({ summary }) => !summary)
            .map(({ user }) => user);
          setRoninMissing(missing);
        }
      })
      .catch((err) => {
        // Optionally set error for Ronin users fetch
      });
  }, [dbUser?.rsi_handle]);

  return (
    <div>
      <h2>RONIN</h2>
      {/* You can use dbUser for more personalized info here if needed */}
      {loading && <p>Loading leaderboard data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {playerSummary && (
        <div style={{ marginTop: '1em' }}>
          <h3>Leaderboard Summary for {dbUser.rsi_handle}</h3>
          <ul>
            <li>Rank: {playerSummary.rank}</li>
            <li>Total Kills: {String(playerSummary.total_kills)}</li>
            <li>Total Deaths: {String(playerSummary.total_deaths)}</li>
            <li>Total Rating: {playerSummary.total_rating}</li>
            <li>Average Rank: {playerSummary.avg_rank}</li>
            <li>Flight Time: {typeof playerSummary.total_flight_time === "object" && playerSummary.total_flight_time !== null
              ? `${playerSummary.total_flight_time.hours ?? 0}:${playerSummary.total_flight_time.minutes ?? 0}:${playerSummary.total_flight_time.seconds ?? 0}`
              : playerSummary.total_flight_time}
            </li>
            {/* Add more fields as needed */}
          </ul>
        </div>
      )}
      


      <div style={{ marginTop: '2em' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.5em', letterSpacing: '1px', borderBottom: '2px solid #222', paddingBottom: '0.3em', marginBottom: '1em' }}>The Ronin</h3>
        {roninSummaries.length === 0 && roninMissing.length === 0 ? (
          <p>No Ronin pilot summaries found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2em' }}>
            {roninSummaries.length > 0 && (
              <div>
                {roninSummaries.map((summary) => (
                  <div key={summary.id} style={{ display: 'flex', alignItems: 'center', background: '#181a1b', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', padding: '1em', marginBottom: '0.5em' }}>
                    <img
                      src={summary.account_media ? `https://robertsspaceindustries.com${summary.account_media}` : 'https://robertsspaceindustries.com/media/default_avatar.png'}
                      alt={summary.rsi_handle}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginRight: '1em', border: '2px solid #444' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.15em', color: '#e0e0e0', marginBottom: '0.2em' }}>{summary.rsi_handle}</div>
                      <div style={{ color: '#b0b0b0', fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ marginRight: '1.5em' }}>Rating: <span style={{ fontWeight: 'bold', color: '#ffd700' }}>{summary.total_rating}</span></span>
                        <span style={{ marginRight: '1.5em' }}>Flight Time: <span style={{ fontWeight: 'bold' }}>{typeof summary.total_flight_time === "object" && summary.total_flight_time !== null
                          ? `${summary.total_flight_time.hours ?? 0}:${summary.total_flight_time.minutes ?? 0}:${summary.total_flight_time.seconds ?? 0}`
                          : summary.total_flight_time}</span></span>
                        <span>Rank: <span style={{ fontWeight: 'bold' }}>{summary.avg_rank !== undefined && summary.avg_rank !== null ? Math.round(summary.avg_rank) : '-'}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {roninMissing.length > 0 && (
              <div style={{ marginTop: '0.2em' }}>
                <h4 style={{ color: '#c00', fontWeight: 'bold' }}>Records could not be found for...</h4>
                <ul>
                  {roninMissing.map((user) => (
                    <li key={user.id} style={{ color: '#888', fontStyle: 'italic' }}>
                      {user.rsi_handle || user.username || user.name} - No record.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
