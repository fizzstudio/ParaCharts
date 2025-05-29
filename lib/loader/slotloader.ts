import { type Data } from '@fizz/chart-metadata-validation';
import { type Datatype } from '@fizz/dataframe';
import { Dataset, DisplayType, Facet, Manifest } from '@fizz/paramanifest';
import { FacetSignature } from '@fizz/paramodel';

interface DataVar {
  name: string;
  isIndep?: boolean;
  type: Datatype;
}
/**
 * Mapping of input data variable names to their types.
 * @public
 */
export type Datatypes = { [key: string]: Datatype };

/**
 * How chart data should be formatted in a data file or when provided 
 * to the TodoChart `data` property.
 * @public
 */
export type DataAndTypes = { data: Data, types: Datatypes };

export class SlotLoader {

  canLoadData(els: HTMLElement[]) {
    return els.length && els[0].tagName === 'TABLE';
  }

  async findManifest(els: HTMLElement[], manifestID?: string): Promise<{ result: string; manifest?: Manifest; }> {
    if (manifestID) {
      console.log("manifest ID present")
      if (document.getElementById(manifestID)) {
        if (document.getElementById(manifestID)!.hasAttribute("src")) {
          const manifestRaw = await fetch(document.getElementById(manifestID)!.getAttribute("src") as string);
          const manifest = await manifestRaw.json() as Manifest;
          return { result: "success", manifest: JSON.parse(document.getElementById(manifestID)!.outerHTML) }
        }
        else {
          return { result: "success", manifest: JSON.parse(document.getElementById(manifestID)!.outerHTML) }
        }

      }
    }
    else {
      console.log("no manifest ID present")
      return {result: "success", manifest: {datasets: [this.loadDataFromElement(els)]}}
    }
  }


  loadDataFromElement(els: HTMLElement[]): Dataset{
    console.log("els[0]")
    console.log(els[0])
    console.log("Start: loadDataFromElement")
    if (!els.length || els[0].tagName !== 'TABLE') {
      console.log(els);
      throw new Error("'table' element must be provided");
    }
    const table = els[0] as HTMLTableElement;
    const title = "test"
    console.log(table.rows[0])
    const vars = this.loadHeaders(table.rows[0]);
    console.log("vars")
    console.log(vars)
    const cols = vars.map(v => [] as string[]);
    Array.from(table.rows).slice(1).forEach((tr: HTMLTableRowElement) => {
      const vals = this.loadRow(tr, vars);
      vals.forEach((val, j) => {
        cols[j].push(val);
      });
    });
    console.log("cols")
    console.log(cols)
    const types: Datatypes = {};
    /*
    vars.forEach(v => {
      types[v.name] = v.type;
    });
    */
    const indepVar = vars.find(v => v.variableType == "independent") ?? vars[0];
    const data: Dataset = {
      type: els[0].getAttribute("type") as "line" | "column" | "bar" | "scatter" | "lollipop" | "stepline" | "pie" | "donut" ?? "bar",
      title: "Test",
      //independentUnit: indepVar.label,
      //independentLabels: cols[vars.indexOf(indepVar)],
      facets: {},
      series: [{key: "test", theme: {baseQuantity: "baseQuantity", baseKind: "number"}, records: []}],
      data: {source: "inline"},
    };

    /*
   const data: Manifest = {
    datasets: [{
      //type:
      //title:
      //facets:
      //series:
      //dataFromManifest:
    }]
   }
    */
   /*
    vars.forEach((v, i) => {
      if (v.variableType == "dependent") {
        data.series[0].records?.push({x: cols[0], y: cols[1]});
      }
    });
*/
    for (let i = 0; i < cols[0].length; i++){
      console.log()
      data.series[0].records!.push({x: cols[0][i], y: cols[1][i]});
    }
    data.facets["x"] = vars[0]
    data.facets["y"] = vars[1]
    console.log("data")
    console.log(data)
    return data;
  }

  private loadHeaders(el?: HTMLTableRowElement) {
    if (!el) {
      throw new Error('table must include a header row');
    }
    const facets: Facet[] = [];
    for (const kid of el.children) {
      if (kid.tagName !== 'TD') {
        throw new Error("immediate children of 'tr' element must be 'td' elements");
      }
      const name = kid.textContent?.trim() ?? '';
      if (!name) {
        throw new Error("var name must be provided as 'td' element text content");
      }
      const type = (kid as HTMLElement).dataset.type ?? '';
      if (!['string', 'number', 'date'].includes(type)) {
        throw new Error("var type must be provided as 'td' element 'data-type' attribute. Must be string, number, or date");
      }
      const isIndep = (kid as HTMLElement).dataset.independent === 'true' ? "independent" : "dependent";
      const measure = (kid as HTMLElement).dataset.measure ?? 'nominal';
      const displayType = (kid as HTMLElement).dataset.displayType ?? { type: "marking" }
      facets.push({
        label: name,
        datatype: type as Datatype ?? "string",
        variableType: isIndep,
        measure: measure as "nominal" | "ordinal" | "interval" | "ratio",
        displayType: displayType as DisplayType
      })
    }
    return facets;
  }

  private loadRow(el: HTMLTableRowElement | null, vars: DataVar[]) {
    if (!el || el.tagName !== 'TR') {
      throw new Error("immediate children of 'table' element must be 'tr' elements");
    }
    const cols = vars.map(v => '');
    Array.from(el.children).forEach((kid, i) => {
      if (kid.tagName !== 'TD') {
        throw new Error("immediate children of 'tr' element must be 'td' elements");
      }
      const value = kid.textContent;
      if (!value) {
        throw new Error("var value must be provided as 'td' element text content");
      }
      cols[i] = value;
    });
    return cols;
  }

}