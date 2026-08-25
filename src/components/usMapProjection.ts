// Used by the Career page (src/pages/career/index.astro) and
// USLocationMap.astro to place location markers on the map.
//
// Real geographic data end to end, not a hand-calibrated guess:
// - `us-atlas` (Mike Bostock's pre-built TopoJSON from real US Census
//   Bureau boundary data, ISC licensed) for the state shapes themselves.
// - `d3-geo`'s `geoAlbersUsa()` projection (the standard, exact projection
//   used throughout cartography for "USA-shaped" maps -- it's what
//   positions Alaska/Hawaii as insets) to convert real lat/lon to x/y.
// The SAME projection instance draws the state outlines AND places every
// marker, so the map and the dots are geometrically consistent by
// construction -- not by calibrating one against the other after the fact.
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
// @ts-expect-error -- us-atlas ships data only, no type declarations
import statesTopology from "us-atlas/states-10m.json";

const STATE_NAME_TO_ABBR: Record<string, string> = {
	Alabama: "AL",
	Alaska: "AK",
	Arizona: "AZ",
	Arkansas: "AR",
	California: "CA",
	Colorado: "CO",
	Connecticut: "CT",
	Delaware: "DE",
	"District of Columbia": "DC",
	Florida: "FL",
	Georgia: "GA",
	Hawaii: "HI",
	Idaho: "ID",
	Illinois: "IL",
	Indiana: "IN",
	Iowa: "IA",
	Kansas: "KS",
	Kentucky: "KY",
	Louisiana: "LA",
	Maine: "ME",
	Maryland: "MD",
	Massachusetts: "MA",
	Michigan: "MI",
	Minnesota: "MN",
	Mississippi: "MS",
	Missouri: "MO",
	Montana: "MT",
	Nebraska: "NE",
	Nevada: "NV",
	"New Hampshire": "NH",
	"New Jersey": "NJ",
	"New Mexico": "NM",
	"New York": "NY",
	"North Carolina": "NC",
	"North Dakota": "ND",
	Ohio: "OH",
	Oklahoma: "OK",
	Oregon: "OR",
	Pennsylvania: "PA",
	"Rhode Island": "RI",
	"South Carolina": "SC",
	"South Dakota": "SD",
	Tennessee: "TN",
	Texas: "TX",
	Utah: "UT",
	Vermont: "VT",
	Virginia: "VA",
	Washington: "WA",
	"West Virginia": "WV",
	Wisconsin: "WI",
	Wyoming: "WY",
};

const statesGeoJson = feature(statesTopology as any, (statesTopology as any).objects.states) as unknown as {
	features: { properties: { name: string }; [key: string]: unknown }[];
};

// D3's standard geoAlbersUsa() with its default scale/translate (1070,
// [480,300]) -- the well-known, widely-used default that pairs with a
// 960x600 canvas. Not a custom fit; this is the same projection (and the
// same default parameters) used throughout countless real D3 US maps.
export const projection = geoAlbersUsa();
const pathGenerator = geoPath(projection);

export function projectLatLon(lat: number, lon: number): { x: number; y: number } | null {
	const result = projection([lon, lat]);
	return result ? { x: result[0], y: result[1] } : null;
}

export function getStatePaths(): { abbr: string; d: string }[] {
	return statesGeoJson.features
		.map((f) => ({
			abbr: STATE_NAME_TO_ABBR[f.properties.name],
			d: pathGenerator(f as any) ?? "",
		}))
		.filter((s): s is { abbr: string; d: string } => Boolean(s.abbr) && s.d.length > 0);
}
