const GOOGLE_MAPS_HOSTS = new Set(["google.com", "www.google.com"]);

function officialSearchUrl(query, placeId = "") {
  if (!query) return "";
  const params = new URLSearchParams({ api: "1", query });
  if (placeId) params.set("query_place_id", placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * Normalizes the project's legacy hand-built Google Maps URLs to Google's
 * documented Maps URL search format.
 *
 * Legacy example:
 *   https://www.google.com/maps/place/Place+Name%2C+Full+Address/
 * becomes:
 *   https://www.google.com/maps/search/?api=1&query=Place+Name%2C+Full+Address
 *
 * Existing Place-ID links are upgraded to query_place_id, which is Google's
 * strongest cross-platform identifier for a specific POI.
 *
 * @param {string | undefined | null} rawUrl
 * @param {string} fallbackQuery Human-readable POI name/address used with a Place ID.
 * @returns {string}
 */
export function googleMapsHref(rawUrl, fallbackQuery = "") {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl ?? "";

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  if (!GOOGLE_MAPS_HOSTS.has(parsed.hostname.toLowerCase())) return rawUrl;
  if (!parsed.pathname.startsWith("/maps/")) return rawUrl;

  // Already uses the documented Maps URL API. Keep it byte-for-byte stable.
  if (parsed.pathname.startsWith("/maps/search")) return rawUrl;

  // Legacy exact Place ID bookmark used in the current data set.
  if (parsed.pathname === "/maps/place/" || parsed.pathname === "/maps/place") {
    const q = parsed.searchParams.get("q") ?? "";
    if (q.startsWith("place_id:")) {
      const placeId = q.slice("place_id:".length).trim();
      const query = fallbackQuery.trim() || placeId;
      return placeId && query ? officialSearchUrl(query, placeId) : rawUrl;
    }
    return rawUrl;
  }

  if (!parsed.pathname.startsWith("/maps/place/")) return rawUrl;

  // A real copied Google Maps share/detail URL can contain @lat,lng and /data=.
  // Those URLs already identify a POI; do not degrade them to text search.
  const legacyPath = parsed.pathname.slice("/maps/place/".length).replace(/\/$/, "");
  if (!legacyPath || legacyPath.includes("/@") || legacyPath.includes("/data=")) return rawUrl;

  let query;
  try {
    query = decodeURIComponent(legacyPath.replace(/\+/g, " ")).trim();
  } catch {
    return rawUrl;
  }

  if (!query) return rawUrl;
  return officialSearchUrl(query);
}

export function isLegacyHandBuiltGoogleMapsUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl);
    if (!GOOGLE_MAPS_HOSTS.has(parsed.hostname.toLowerCase())) return false;
    if (!parsed.pathname.startsWith("/maps/place/")) return false;
    if (parsed.pathname === "/maps/place/") return false;
    const rest = parsed.pathname.slice("/maps/place/".length);
    return Boolean(rest) && !rest.includes("/@") && !rest.includes("/data=");
  } catch {
    return false;
  }
}
