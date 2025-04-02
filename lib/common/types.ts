import { XyPoint, Manifest } from "@fizz/paramanifest";

export type AllSeriesData = Record<string, XyPoint[]>;

export type ChartType = Manifest['datasets'][number]['type'];