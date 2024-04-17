export interface MapBoxContextItem {
  id: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mapbox_id: string;
  text: string;
  wikidata: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  short_code?: string;
}

// The field names here come from MapBox
export interface MapBoxFeature {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  place_type: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  place_name: string;
  text?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  properties: { short_code: string; };
  center: [number, number];
  context: MapBoxContextItem[];
}

export interface MapBoxFeatureCollection {
  type: "FeatureCollection";
  features: MapBoxFeature[];
}

const RELEVANT_FEATURE_TYPES = ["postcode", "place", "region", "country"];
const NA_COUNTRIES = ["United States", "Canada", "Mexico"];
const NA_ABBREVIATIONS = ["US-", "CA-", "MX-"];

export function findBestFeature(collection: MapBoxFeatureCollection): MapBoxFeature | null {
  const relevantFeatures = collection.features.filter(feature => RELEVANT_FEATURE_TYPES.some(type => feature.place_type.includes(type)));
  const placeFeature = relevantFeatures.find(feature => feature.place_type.includes("place")) ?? (relevantFeatures.find(feature => feature.place_type.includes("postcode")) ?? undefined);
  if (placeFeature !== undefined) {
    return placeFeature;
  }
  const regionFeature = relevantFeatures.find(feature => feature.place_type.includes("region"));
  if (regionFeature !== undefined) {
    return regionFeature;
  }
  const countryFeature = relevantFeatures.find(feature => feature.place_type.includes("country"));
  if (countryFeature !== undefined) {
    return countryFeature;
  }
  return null;
}

export function textForMapboxFeature(feature: MapBoxFeature): string {
  const pieces: string[] = [];
  if (feature.text) {
    pieces.push(feature.text);
  }
  feature.context.forEach(item => {
    const itemType = item.id.split(".")[0];
    if (!RELEVANT_FEATURE_TYPES.includes(itemType)) {
      return;
    }
    let text = null as string | null;
    const shortCode = item.short_code;
    if (itemType === "region" && shortCode != null) {
      if (NA_ABBREVIATIONS.some(abbr => shortCode.startsWith(abbr))) {
        text = shortCode.substring(3);
      }
    } else if (itemType === "country") {
      const itemText = item.text;
      if (!NA_COUNTRIES.includes(itemText)) {
        text = itemText; 
      }
    }
    if (text !== null) {
      pieces.push(text);
    }
  });
  return pieces.join(", ");
}

export function textForMapboxResults(results: MapBoxFeatureCollection): string {
  const feature = findBestFeature(results);
  return feature !== null ? textForMapboxFeature(feature) : "";
}

export async function textForLocation(longitudeDeg: number, latitudeDeg: number): Promise<string> {
  const accessToken = process.env.VUE_APP_MAPBOX_ACCESS_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitudeDeg},${latitudeDeg}.json?access_token=${accessToken}`;
  return fetch(url)
    .then(response => response.json())
    .then((result: MapBoxFeatureCollection) => {
      if (result.features.length === 0) {
        const ns = latitudeDeg >= 0 ? 'N' : 'S';
        const ew = longitudeDeg >= 0 ? 'E' : 'W';
        const lat = Math.abs(latitudeDeg).toFixed(3);
        const lon = Math.abs(longitudeDeg).toFixed(3);
        return `${lat}° ${ns}, ${lon}° ${ew}`;
      }
      return textForMapboxResults(result);
    });
}

export async function geocodingInfoForSearch(searchText: string): Promise<MapBoxFeatureCollection> {
  const accessToken = process.env.VUE_APP_MAPBOX_ACCESS_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json?access_token=${accessToken}&types=place,postcode`;
  return fetch(url).then(response => response.json());
}
