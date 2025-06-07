import React from 'react';

// Utility for normalization
const normalize = (value: number, min: number, max: number): number =>
  (value - min) / (max - min || 1);

// Returns the final ranking score for a player
export const computeRankingScore = (player: any, allPlayers: any[]): number => {
  const statRange = (getter: (p: any) => number) => {
    const values = allPlayers.map(getter).map(Number); // Ensure all are numbers
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  const getNumber = (val: any) => typeof val === "bigint" ? Number(val) : val ?? 0;

  const damagePerKill = getNumber(player.total_kills) > 0
    ? getNumber(player.total_damage_dealt) / getNumber(player.total_kills)
    : 0;

  const efficiencyRange = statRange(p => getNumber(p.avg_score_minute));
  const impactRange = statRange(p => getNumber(p.avg_score));
  const dpkRange = statRange(p => getNumber(p.total_kills) > 0 ? getNumber(p.total_damage_dealt) / getNumber(p.total_kills) : 0);
  const kdrRange = statRange(p => getNumber(p.avg_kill_death_ratio));
  const killRange = statRange(p => getNumber(p.total_kills));

  const efficiencyScore = normalize(getNumber(player.avg_score_minute), efficiencyRange.min, efficiencyRange.max);
  const impactScore = normalize(getNumber(player.avg_score), impactRange.min, impactRange.max);
  const damageScore = normalize(damagePerKill, dpkRange.min, dpkRange.max);
  const survivalScore = normalize(getNumber(player.avg_kill_death_ratio), kdrRange.min, kdrRange.max);
  const killScore = normalize(getNumber(player.total_kills), killRange.min, killRange.max);

  return (
    0.30 * efficiencyScore +
    0.25 * impactScore +
    0.20 * damageScore +
    0.15 * survivalScore +
    0.10 * killScore
  );
};