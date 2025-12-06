const normalize = (value?: string) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const ROLE_KEYS = ["id", "role_id", "roleId", "slug", "name", "code"] as const;

type RoleLike = string | Record<string, unknown> | null | undefined;

export const splitRoleIds = (csv?: string) =>
  (csv || "")
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

export const hasRoleMatch = (roles: RoleLike[] | undefined, ids: string[] = []) => {
  if (!Array.isArray(roles) || roles.length === 0 || ids.length === 0) return false;
  const normalizedIds = new Set(ids.map(normalize).filter(Boolean));
  if (normalizedIds.size === 0) return false;

  return roles.some((role) => {
    if (!role) return false;
    const candidates: string[] = [];
    if (typeof role === "string") {
      candidates.push(role);
    } else if (typeof role === "object") {
      ROLE_KEYS.forEach((key) => {
        const value = (role as Record<string, unknown>)[key];
        if (typeof value === "string") {
          candidates.push(value);
        }
      });
    }
    return candidates.some((candidate) => normalizedIds.has(normalize(candidate)));
  });
};

export const hasRoleFromEnv = (roles: RoleLike[] | undefined, csv?: string) =>
  hasRoleMatch(roles, splitRoleIds(csv));
