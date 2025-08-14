/*
  Centralized progression logic used by AdminUpdate, PlayerPromotionProgress,
  PlayerPrestigeProgress, and PlayerBadgeProgress.

  Goals:
  - Single source of truth for promotion, prestige, and badge eligibility/progress.
  - Pure functions (no side effects) so they're easy to test and reuse.
  - Pluggable environment for rank IDs (accept via params, fallback to import.meta.env).
*/

// Lightweight types to avoid tight coupling; feel free to replace with your project types
export type RankEnv = {
  friendlyIds: string[];
  prospectIds: string[];
  crewIds: string[];
  marauderIds: string[];
  bloodedIds: string[];
};

export type Player = {
  id?: string | number;
  user_id?: string | number;
  username?: string;
  displayName?: string;
  nickname?: string;
  rank?: string; // rank id from your system
  rank_id?: string; // alternate field name
  // Prestige levels (optional)
  raptor_level?: number;
  raider_level?: number;
  corsair_level?: number;
};

export type PlayerStatsLike = Record<string, any> & {
  user_id?: string | number;
};

export type BadgeReusable = {
  badge_name: string;
  badge_description?: string;
  badge_weight?: number;
  image_url?: string;
  badge_icon?: string;
  badge_url?: string;
  subject?: string; // e.g., "Prestige", "Combat", etc.
  series_id?: string | null;
  series_position?: number | null;
  // For Prestige
  prestige_name?: 'RAPTOR' | 'RAIDER' | string;
  prestige_level?: number;
  // Triggers stored as array of JSON strings or objects
  trigger?: Array<string | { metric: string; operator: string; value: number }>;
};

export type PlayerBadge = {
  badge_name: string;
  badge_weight?: number;
  series_id?: string | null;
  series_position?: number | null;
};

export type PromotionAssessment = {
  detectedRank: string | null;
  nextRank: string | null;
  progressPercent: number; // 0..100
};

export type PrestigeAssessment = {
  prestigeName: string; // RAPTOR or RAIDER, etc.
  currentLevel: number;
  nextLevel: number | null;
  progress: number; // 0..1
  ready: boolean; // true if progress >= 1 for next level
};

export type BadgeAssessment = {
  badge: BadgeReusable;
  progress: number; // 0..1
  ready: boolean; // true if fully met
};

export type AdminUpdateItem = {
  type: 'promotion' | 'prestige' | 'badge';
  title: string; // short line for list
  detail?: string; // optional tooltip/detail
  severity: 'info' | 'success' | 'warning';
  // For badge items, include identifiers to make lookup easier
  badgeName?: string;
  badgeSubject?: string;
};

// Helpers
const toArray = (v: string | undefined): string[] =>
  (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const getRankEnvFromMetaEnv = (): RankEnv => {
  // Works in Vite/browser; falls back to empty in non-Vite contexts
  const env: any = (import.meta as any)?.env ?? {};
  return {
    friendlyIds: toArray(env?.VITE_FRIENDLY_ID),
    prospectIds: toArray(env?.VITE_PROSPECT_ID),
    crewIds: toArray(env?.VITE_CREW_ID),
    marauderIds: toArray(env?.VITE_MARAUDER_ID),
    bloodedIds: toArray(env?.VITE_BLOODED_ID),
  };
};

export const detectRank = (userRankId: string | undefined, env?: RankEnv): string | null => {
  if (!userRankId) return null;
  // Accept plain-text rank names as well (e.g., "Crew", "Marauder")
  const idLower = String(userRankId).toLowerCase();
  if (idLower.includes('blooded')) return 'Blooded';
  if (idLower.includes('marauder')) return 'Marauder';
  if (idLower.includes('crew')) return 'Crew';
  if (idLower.includes('prospect')) return 'Prospect';
  if (idLower.includes('friendly')) return 'Friendly';
  const e = env || getRankEnvFromMetaEnv();
  if (e.bloodedIds.includes(userRankId)) return 'Blooded';
  if (e.marauderIds.includes(userRankId)) return 'Marauder';
  if (e.crewIds.includes(userRankId)) return 'Crew';
  if (e.prospectIds.includes(userRankId)) return 'Prospect';
  if (e.friendlyIds.includes(userRankId)) return 'Friendly';
  return null;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Promotion rules (mirrors PlayerPromotionProgress)
export const assessPromotion = (
  stats: PlayerStatsLike | null | undefined,
  userRankId?: string,
  env?: RankEnv
): PromotionAssessment => {
  // Prefer explicit rank ID; if missing/unmatched, fall back to stats.rank_name
  let detected = detectRank(userRankId, env);
  if (!detected) {
    const rankNameRaw = (stats as any)?.rank_name as string | undefined;
    const rn = (rankNameRaw || '').toLowerCase();
    if (rn) {
      if (rn.includes('blooded')) detected = 'Blooded';
      else if (rn.includes('marauder')) detected = 'Marauder';
      else if (rn.includes('crew')) detected = 'Crew';
      else if (rn.includes('prospect')) detected = 'Prospect';
      else if (rn.includes('friendly')) detected = 'Friendly';
    }
  }
  const rankOrder = ['Friendly', 'Prospect', 'Crew', 'Marauder', 'Blooded'] as const;
  const currentIdx = detected ? rankOrder.indexOf(detected as typeof rankOrder[number]) : -1;
  const nextRank = currentIdx >= 0 ? rankOrder[currentIdx + 1] || null : null;

  if (!stats || !detected) {
    return { detectedRank: detected, nextRank, progressPercent: 0 };
  }

  let progressPercent = 0;
  if (detected === 'Friendly') {
    progressPercent = 100; // ready to Prospect manually
  } else if (detected === 'Prospect') {
    const piracyHits = Number(stats.piracyhits) || 0;
    const fleetParticipated = Number(stats.fleetparticipated) || 0;
    // Prospect -> Crew: points are piracyHits + 0.25 * fleetParticipated
    const points = piracyHits + (fleetParticipated * 0.25);
    const pointsProgress = clamp01(points / 10);
    const flightHours = Number(stats.flighthours) || 0;
    const shipsBLeaderboardRank = Number(stats.shipsbleaderboardrank) || Infinity;
    const shipKills = Number(stats.shipkills) || 0;
    const secondaryProgress = Math.max(
      clamp01(flightHours / 20),
      shipsBLeaderboardRank <= 1000 ? 1 : 0,
      clamp01(shipKills / 100)
    );
    progressPercent = Math.round(((pointsProgress + secondaryProgress) / 2) * 100);
  } else if (detected === 'Crew') {
    const shipsBLeaderboardRank = Number(stats.shipsbleaderboardrank) || Infinity;
    const piracyHits = Number(stats.piracyhits) || 0;
    const fleetParticipated = Number(stats.fleetparticipated) || 0;
    const voiceHours = Number(stats.voicehours) || 0;
    const reqProgress = [
      shipsBLeaderboardRank <= 200 ? 1 : 0,
      // Updated thresholds: Piracy 30, Gang Participation 100, Voice 300
      piracyHits >= 30 ? 1 : clamp01(piracyHits / 30),
      fleetParticipated >= 100 ? 1 : clamp01(fleetParticipated / 100),
      voiceHours >= 300 ? 1 : clamp01(voiceHours / 300),
    ];
    const metCount = reqProgress.filter((v) => v === 1).length;
    // Any three of the four requirements
    if (metCount >= 3) {
      progressPercent = 100;
    } else if (metCount === 2) {
      progressPercent = 66;
    } else if (metCount === 1) {
      progressPercent = 33;
    } else {
      // No fully-met requirements: scale by best partial toward ~33%
      progressPercent = Math.round(Math.max(...reqProgress) * 33);
    }
  } else if (detected === 'Marauder') {
    progressPercent = 0; // manual or other criteria
  } else if (detected === 'Blooded') {
    progressPercent = 0; // top rank
  }

  return { detectedRank: detected, nextRank, progressPercent };
};

// Badge triggers
export const evaluateCondition = (playerValue: number, operator: string, targetValue: number) => {
  switch (operator) {
    case '>=':
      return playerValue >= targetValue;
    case '<=':
      return playerValue <= targetValue;
    case '>':
      return playerValue > targetValue;
    case '<':
      return playerValue < targetValue;
    case '=':
    case '==':
      return playerValue === targetValue;
    default:
      return false;
  }
};

export const getTriggerProgress = (playerValue: number, operator: string, targetValue: number) => {
  if (operator === '>=' || operator === '>') return clamp01(playerValue / targetValue);
  // Component logic treats <= and < as binary (met or not), not fractional
  if (operator === '<=' || operator === '<') return evaluateCondition(playerValue, operator, targetValue) ? 1 : 0;
  if (operator === '=' || operator === '==') return playerValue === targetValue ? 1 : 0;
  return 0;
};

export const parseTrigger = (
  t: string | { metric: string; operator?: string; conditional?: string; value: number }
) => {
  if (!t) return null as any;
  try {
    const obj: any = typeof t === 'string' ? JSON.parse(t) : t;
    if (obj && !obj.operator && obj.conditional) {
      obj.operator = obj.conditional;
    }
    return obj;
  } catch {
    return null as any;
  }
};

export const getBadgeProgress = (badge: BadgeReusable, stats?: PlayerStatsLike | null): number => {
  const triggers = Array.isArray(badge.trigger) ? badge.trigger : [];
  if (triggers.length === 0) return 0; // manually awarded badges
  if (!stats) return 0;

  // If any shipsbleaderboardrank trigger exists and player's value is 0/empty, progress is 0
  for (const t of triggers) {
    const tr = parseTrigger(t);
    if (tr?.metric === 'shipsbleaderboardrank') {
      const v = stats[tr.metric] ?? 0;
      if (!v || Number(v) === 0) return 0;
    }
  }

  let total = 0;
  let count = 0;
  for (const t of triggers) {
    const tr = parseTrigger(t);
    if (!tr?.metric || !tr?.operator || tr?.value === undefined) continue;
    const playerValue = Number(stats[tr.metric] ?? 0);
    total += getTriggerProgress(playerValue, tr.operator, Number(tr.value));
    count++;
  }
  return count > 0 ? total / count : 0;
};

export const isBadgeReady = (badge: BadgeReusable, stats?: PlayerStatsLike | null): boolean => {
  const triggers = Array.isArray(badge.trigger) ? badge.trigger : [];
  if (triggers.length === 0) return false; // manual badges not auto-ready
  if (!stats) return false;
  for (const t of triggers) {
    const tr = parseTrigger(t);
    if (!tr?.metric || !tr?.operator || tr?.value === undefined) return false;
    const playerValue = Number(stats[tr.metric] ?? 0);
    // Special-case: leaderboard rank of 0 typically means "unranked"; never treat as ready
    if (tr.metric === 'shipsbleaderboardrank' && (!playerValue || playerValue === 0)) {
      return false;
    }
    if (!evaluateCondition(playerValue, tr.operator, Number(tr.value))) return false;
  }
  return true;
};

// Prestige helpers
export const groupPrestige = (reusables: BadgeReusable[]) => {
  const groups: Record<string, BadgeReusable[]> = {};
  for (const b of reusables) {
    const name = b.prestige_name;
    if (!name) continue;
    if (!groups[name]) groups[name] = [];
    groups[name].push(b);
  }
  return groups;
};

export const getNextLevelBadges = (
  prestigeName: string,
  currentLevel: number,
  groups: Record<string, BadgeReusable[]>
): BadgeReusable[] => {
  const list = groups[prestigeName] || [];
  return list.filter((b) => (b.prestige_level ?? 0) === currentLevel + 1);
};

export const assessPrestigeFor = (
  prestigeName: string,
  currentLevel: number,
  groups: ReturnType<typeof groupPrestige>,
  stats?: PlayerStatsLike | null,
  maxLevel = 5
): PrestigeAssessment => {
  const next = getNextLevelBadges(prestigeName, currentLevel, groups);
  const nextLevel = currentLevel >= maxLevel ? null : currentLevel + 1;
  if (currentLevel >= maxLevel) {
    return { prestigeName, currentLevel, nextLevel: null, progress: 1, ready: false };
  }
  if (next.length === 0) {
    return { prestigeName, currentLevel, nextLevel, progress: 0, ready: false };
  }
  const total = next.reduce((sum, b) => sum + getBadgeProgress(b, stats), 0);
  const progress = total / next.length;
  const ready = next.every((b) => isBadgeReady(b, stats));
  return { prestigeName, currentLevel, nextLevel, progress, ready };
};

export const rankIdFromUser = (user?: Player | null): string | undefined => {
  if (!user) return undefined;
  return (user.rank as string) || (user.rank_id as string) || undefined;
};

export const prestigeLevelsFromUser = (user?: Player | null) => ({
  raptor: Number(user?.raptor_level ?? 0),
  raider: Number(user?.raider_level ?? 0),
  corsair: Number(user?.corsair_level ?? 0),
});

// High-level assessment to generate AdminUpdate items for a single player
export const assessPlayerForAdminUpdates = (args: {
  user?: Player | null;
  stats?: PlayerStatsLike | null;
  env?: RankEnv;
  activeBadgeReusables?: BadgeReusable[]; // include prestige badges too
  playerBadges?: PlayerBadge[]; // already-earned to exclude from suggestions
}): AdminUpdateItem[] => {
  const { user, stats, env, activeBadgeReusables = [], playerBadges = [] } = args;
  const updates: AdminUpdateItem[] = [];

  // Promotion
  const userRankId = rankIdFromUser(user);
  const promo = assessPromotion(stats, userRankId, env);
  if (promo.nextRank && promo.progressPercent >= 100) {
    updates.push({
      type: 'promotion',
      title: `${user?.username || user?.displayName || 'User'} is ready to promote to ${promo.nextRank}`,
      detail: `Progress ${promo.progressPercent}% towards ${promo.nextRank}`,
      severity: 'success',
    });
  } else if (promo.nextRank && promo.progressPercent > 0) {
    updates.push({
      type: 'promotion',
      title: `${promo.progressPercent}% to ${promo.nextRank}`,
      detail: `${user?.username || user?.displayName || 'User'} progression`,
      severity: 'info',
    });
  }

  // Prestige
  const prestigeGroups = groupPrestige(activeBadgeReusables);
  const levels = prestigeLevelsFromUser(user);
  const raptor = assessPrestigeFor('RAPTOR', levels.raptor, prestigeGroups, stats);
  if (raptor.nextLevel !== null) {
    updates.push({
      type: 'prestige',
      title: `RAPTOR ${levels.raptor} → ${raptor.nextLevel}: ${Math.round(raptor.progress * 100)}%`,
      severity: raptor.ready ? 'success' : 'info',
      detail: raptor.ready ? 'Ready to grant next level' : undefined,
    });
  }
  const raider = assessPrestigeFor('RAIDER', levels.raider, prestigeGroups, stats);
  if (raider.nextLevel !== null) {
    updates.push({
      type: 'prestige',
      title: `RAIDER ${levels.raider} → ${raider.nextLevel}: ${Math.round(raider.progress * 100)}%`,
      severity: raider.ready ? 'success' : 'info',
      detail: raider.ready ? 'Ready to grant next level' : undefined,
    });
  }

  // Badge eligibility (exclude already earned)
  const earnedNames = new Set((playerBadges || []).map((b) => b.badge_name));
  const nonPrestige = activeBadgeReusables.filter((b) => b.subject !== 'Prestige');
  for (const b of nonPrestige) {
    if (earnedNames.has(b.badge_name)) continue;
    const progress = getBadgeProgress(b, stats);
    const ready = isBadgeReady(b, stats);
    if (ready) {
      updates.push({
        type: 'badge',
        title: `Earned badge: ${b.badge_name}`,
        detail: b.badge_description,
        severity: 'success',
        badgeName: b.badge_name,
        badgeSubject: b.subject || 'Other',
      });
    } else if (progress > 0) {
      updates.push({
        type: 'badge',
        title: `${b.badge_name}: ${Math.round(progress * 100)}%`,
        detail: b.badge_description,
        severity: 'info',
        badgeName: b.badge_name,
        badgeSubject: b.subject || 'Other',
      });
    }
  }

  return updates;
};

// Utility to produce a compact summary status for AdminUpdate list
export const summarizeUpdates = (updates: AdminUpdateItem[]): { status: 'earned' | 'needs_award' | 'eligible'; label: string } => {
  // Priority: success badge/prestige/promotion => "earned"
  if (updates.some((u) => u.severity === 'success' && (u.type === 'badge' || u.type === 'prestige'))) {
    return { status: 'earned', label: 'earned a badge/prestige' };
  }
  if (updates.some((u) => u.type === 'promotion' && u.severity === 'success')) {
    return { status: 'eligible', label: 'is eligible to promote' };
  }
  // If there are info-level items, show eligible/needs
  if (updates.some((u) => u.type === 'badge')) {
    return { status: 'needs_award', label: 'needs to be awarded a badge' };
  }
  if (updates.length > 0) {
    return { status: 'eligible', label: 'is progressing' };
  }
  return { status: 'eligible', label: 'is eligible' };
};
