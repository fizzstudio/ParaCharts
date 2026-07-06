

import { type PlaneDatapoint } from "@fizz/paramodel";
import { DatapointView } from "./datapoint";
import { type PlanePlotView } from "../layers/data/chart_type/plane_plot_view";
import { type SeriesView } from "./series";

/**
 * Abstract base class for chart views representing XYChart datapoint values
 * (e.g., points, bars, etc.).
 * @public
 */
export abstract class PlaneDatapointView extends DatapointView {

    declare readonly chart: PlanePlotView;
    declare _datapoint: PlaneDatapoint;

    protected centroid?: string;

    constructor(seriesView: SeriesView) {
        super(seriesView);
    }

    // override to get more specific return type
    get datapoint(): PlaneDatapoint {
        return super.datapoint as PlaneDatapoint;
    }

}