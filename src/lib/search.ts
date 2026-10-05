import { BUDGET_PRESETS } from "@/config/catalog";
import { firstQueryValue, queryList } from "@/lib/utils";
import { searchQuerySchema, type SearchQuery } from "@/validations/schemas";

export function parseSearchQuery(input: Record<string, string | string[] | undefined>): SearchQuery {
  const numberOrUndefined = (value: string | undefined) => {
    if (!value || !value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const preset = BUDGET_PRESETS.find((item) => item.id === firstQueryValue(input.budgetPreset));
  const presetMin = preset && preset.min ? Number(preset.min) : undefined;
  const presetMax = preset && preset.max ? Number(preset.max) : undefined;
  const bhk = queryList(input.bhk)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 8);
  const locality = queryList(input.locality).filter((item) => /^[a-z0-9-]+$/.test(item));
  const candidate = {
    type: firstQueryValue(input.type) || undefined,
    locality: locality.length > 0 ? locality : undefined,
    budgetMin: numberOrUndefined(firstQueryValue(input.budgetMin)) ?? presetMin,
    budgetMax: numberOrUndefined(firstQueryValue(input.budgetMax)) ?? presetMax,
    bhk: bhk.length > 0 ? bhk : undefined,
    areaMin: numberOrUndefined(firstQueryValue(input.areaMin)),
    areaMax: numberOrUndefined(firstQueryValue(input.areaMax)),
    authority: firstQueryValue(input.authority) || undefined,
    possession: firstQueryValue(input.possession) || undefined,
    sort: firstQueryValue(input.sort) || undefined,
    page: numberOrUndefined(firstQueryValue(input.page)),
    view: firstQueryValue(input.view) || undefined,
  };
  const parsed = searchQuerySchema.safeParse(candidate);
  if (parsed.success) return parsed.data;
  return {};
}

export function searchHref(query: SearchQuery, patch: Partial<SearchQuery> = {}): string {
  const next: SearchQuery = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.type) params.set("type", next.type);
  if (next.locality && next.locality.length > 0) params.set("locality", next.locality.join(","));
  if (next.budgetMin !== undefined) params.set("budgetMin", String(next.budgetMin));
  if (next.budgetMax !== undefined) params.set("budgetMax", String(next.budgetMax));
  if (next.bhk && next.bhk.length > 0) params.set("bhk", next.bhk.join(","));
  if (next.areaMin !== undefined) params.set("areaMin", String(next.areaMin));
  if (next.areaMax !== undefined) params.set("areaMax", String(next.areaMax));
  if (next.authority) params.set("authority", next.authority);
  if (next.possession) params.set("possession", next.possession);
  if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  if (next.view && next.view !== "list") params.set("view", next.view);
  const text = params.toString();
  return text ? `/search?${text}` : "/search";
}
