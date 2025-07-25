// * Autogenerated Stories Helpers *

// Imports

import { CHART_FAMILY_MEMBERS, type ChartTypeFamily, type ChartType } from '@fizz/paramanifest';
import CHART_CATALOG from '../../node_modules/@fizz/chart-data/data/chart_catalog.json' with { type: "json" };
import { type CatalogListing } from '@fizz/chart-data';

// Constants

const HIDE_EXTERNAL = true;

// Catalog Processing

function checkExternal(listing: CatalogListing): boolean {
  if (!HIDE_EXTERNAL) {
    return true;
  }
  return !listing.external;
}

export function familyCatalogMapMulti(family: ChartTypeFamily, multi: boolean): Record<string, CatalogListing> {
  const catalog = CHART_CATALOG.filter((listing) => {
    return CHART_FAMILY_MEMBERS[family].includes(listing.type as ChartType) 
      && listing.multi === multi && checkExternal(listing);
  });
  const map = {};
  for (const listing of catalog) {
    map[listing.selectorTitle] = listing;
  }
  return map;
}

export function familyCatalogMap(family: ChartTypeFamily): Record<string, CatalogListing> {
  const catalog = CHART_CATALOG.filter((listing) => {
    return CHART_FAMILY_MEMBERS[family].includes(listing.type as ChartType) && checkExternal(listing);
  });
  const map = {};
  for (const listing of catalog) {
    map[listing.selectorTitle] = listing;
  }
  return map;
}

export function familyManifestPathsMap(family: ChartTypeFamily, multi?: boolean): Record<string, string> {
  const catalogMap = multi === undefined
    ? familyCatalogMap(family)
    : familyCatalogMapMulti(family, multi);
  const map = {};
  for (const selectorTitle in catalogMap) {
    map[selectorTitle] = catalogMap[selectorTitle].path;
  }
  return map;
}

