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
      console.log(`Loading from manifest ID: ${manifestID}`)
      if (document.getElementById(manifestID)) {
        if (document.getElementById(manifestID)!.hasAttribute("src")) {
          const manifestRaw = await fetch(document.getElementById(manifestID)!.getAttribute("src") as string);
          const manifest = await manifestRaw.json() as Manifest;
          return { result: "success", manifest: manifest}
        }
        else {
            let manifest = JSON.parse(document.getElementById(manifestID)!.innerHTML)
            let filledManifest = this.validateManifest(els, manifest).manifest
            return { result: "success", manifest: filledManifest}
            /*
            if (JSON.parse(document.getElementById(manifestID)!.innerHTML).datasets[0].series[0].records.length > 0){
                return { result: "success", manifest: manifest}
            }
            else {
                //console.log("Test")
                //console.log(this.loadDataFromElement(els, manifest))
                manifest.datasets[0].series[0].records = this.loadDataFromElement(els, manifest)
                console.log(manifest)
                return {result: "success", manifest: manifest};
            }
                */
        }

      }
    }

    if (document.getElementsByClassName("manifest").length > 0){
      let manifest = JSON.parse(document.getElementsByClassName("manifest")[0]!.innerHTML)
      let filledManifest = this.validateManifest(els, manifest).manifest
      return { result: "success", manifest: filledManifest}
    }
    else {
      console.log("Manifest ID not found or not present, attempting manifest construction from data")
      let manifest = {datasets: [{type: '' as 'line',  title: '', facets: {}, series: [], data: {source: 'inline' as 'inline'}}]}
      return {result: "success", manifest: this.validateManifest(els, manifest).manifest}
    }
    return {result: "failure", manifest: undefined};
  }

  validateManifest(els: HTMLElement[], manifest: Manifest): {result: string, manifest: Manifest | undefined}{
    //console.log("validateManifest start")
    //console.log(els)
    //console.log(manifest)
    //console.log("test1")
    //console.log(manifest.datasets[0].title)
    //console.log("test2")
    if (!manifest.datasets[0].title){
      manifest.datasets[0].title = this.findManifestTitle(els, manifest)
    }
    //console.log("this.loadManifestFromElement(els)")
    //console.log(this.loadManifestFromElement(els).facets)
    //console.log("existing facets")
    //console.log(manifest.datasets[0].facets)
    if (!manifest.datasets[0].facets){
      manifest.datasets[0].facets = this.loadManifestFromElement(els).facets
    }
    if (manifest.datasets[0]!.facets){
      if (!manifest.datasets[0]!.facets.keys){
        manifest.datasets[0].facets = this.loadManifestFromElement(els).facets
      }
    }
    if (!manifest.datasets[0]!.series){
      let series = {key: manifest.datasets[0].facets.y.label, theme: {baseQuantity: '', baseKind: "number" as "number"}, records: this.loadDataFromElement(els, manifest)}
      manifest.datasets[0].series = [series]
    }
    if (manifest.datasets[0]!.series){
      if (manifest.datasets[0]!.series.keys.length == 0){
      let series = {key: manifest.datasets[0].facets.y.label, theme: {baseQuantity: '', baseKind: "number" as "number"}, records: this.loadDataFromElement(els, manifest)}
      manifest.datasets[0].series = [series]
      }
    }
    if (manifest!.datasets[0]!.series[0]!.records!.length == 0){
      manifest.datasets[0].series[0].records = this.loadDataFromElement(els, manifest)
    }
    if (manifest!.datasets[0]!.series[0]!.records!.length == 0){
      manifest.datasets[0].series[0].records = this.loadDataFromElement(els, manifest)
    }
    if (!manifest.datasets[0]!.type){
      manifest.datasets[0]!.type = this.findManifestType(els, manifest) as "line" | "column" | "bar" | "scatter" | "lollipop" | "stepline" | "pie" | "donut";;
    }
    if (!manifest.datasets[0]!.data){
      manifest.datasets[0]!.data = {source: "inline"}
    }
    if (!manifest.datasets[0]!.settings){
      manifest.datasets[0]!.settings = {"sonification.isEnabled": true}
    }
    return {result: "success", manifest: manifest}
  }

  loadManifestFromElement(els: HTMLElement[]): Dataset{
    //console.log("Start: loadDataFromElement")
    if (!els.length || els[0].tagName !== 'TABLE') {
      console.log(els);
      throw new Error("'table' element must be provided");
    }
    const table = els[0] as HTMLTableElement;
    const vars = this.loadHeaders(table.rows[0]);
    const cols = vars.map(v => [] as string[]);
    Array.from(table.rows).slice(1).forEach((tr: HTMLTableRowElement) => {
      const vals = this.loadRow(tr, vars);
      vals.forEach((val, j) => {
        cols[j].push(val);
      });
    });

    for (let i = 0; i < cols.length; i++){
      if (/%/.test(cols[i][0])) {
        vars[i].measure = "ratio"
      }
    }

    for (let i = 0; i < cols.length; i++){
      if (/\d/.test(cols[i][0])) {
        vars[i].datatype = "number"
      }
    }
    //console.log("cols")
    //console.log(cols)
    const types: Datatypes = {};
    /*
    vars.forEach(v => {
      types[v.name] = v.type;
    });
    */
    //const indepVar = vars.find(v => v.variableType == "independent") ?? vars[0];
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
    vars.forEach((v, i) => {
      if (v.variableType == "dependent") {
        data.series[0].records?.push({x: cols[0], y: cols[1]});
      }
    });
*/
    for (let i = 0; i < cols[0].length; i++){
      data.series[0].records!.push({x: cols[0][i], y: cols[1][i]});
    }
    data.facets["x"] = vars[0]
    data.facets["y"] = vars[1]
    data.facets["x"].variableType = "independent"
    return data;
  }

  loadDataFromElement(els: HTMLElement[], manifest: Manifest){
    //console.log("loadDataFromElement start")
    let facetLabels = [manifest.datasets[0].facets.x.label, manifest.datasets[0].facets.y.label]
    //console.log(facetLabels)
    if (!els.length || els[0].tagName !== 'TABLE') {
      console.log(els);
      throw new Error("'table' element must be provided");
    }
    const table = els[0] as HTMLTableElement;
    const vars = this.loadHeaders(table.rows[0]);
    const cols = vars.map(v => [] as string[]);
    //console.log("vars")
    //console.log(vars)
    //console.log("cols")
    //console.log(cols)
    Array.from(table.rows).slice(1).forEach((tr: HTMLTableRowElement) => {
      const vals = this.loadRow(tr, vars);
      vals.forEach((val, j) => {
        cols[j].push(val);
      });
    });
    for (let i = 0; i < cols.length; i++){
      if (/%/.test(cols[i][0])) {
        vars[i].measure = "ratio"
      }
    }
    for (let i = 0; i < cols.length; i++){
      if (/\d/.test(cols[i][0])) {
        vars[i].datatype = "number"
      }
    }
    /*
console.log("kid")
    console.log(kid)
    console.log(kid.innerHTML)
    

    const types: Datatypes = {};
    vars.forEach(v => {
      types[v.name] = v.type;
    });
    */
   /*
    const indepVar = vars.find(v => v.variableType == "independent") ?? vars[0];
    if (!indepVar) {
      throw new Error('no independent variable specified');
    }
    const data: Data = {
      independentUnit: indepVar.name,
      independentLabels: cols[vars.indexOf(indepVar)],
      series: {}
    };
    vars.forEach((v, i) => {
      if (!v.isIndep) {
        data.series[v.name] = cols[i];
      }
    });
    */
    let data = []
    for (let i = 0; i < cols[0].length; i++){
      data.push({x: cols[0][i], y: cols[1][i]})
    }
    return data;
  }

  private loadHeaders(el?: HTMLTableRowElement) {
    //console.log("loadHeaders start")
    if (!el) {
      throw new Error('table must include a header row');
    }
    const facets: Facet[] = [];
    //console.log(el)
    for (const kid of el.children) {
      //console.log(kid)
      if (kid.tagName !== 'TD' && kid.tagName !== 'TH') {
        throw new Error("immediate children of 'tr' element must be 'td' or 'th' elements");
      }
      const name = kid.textContent?.trim() ?? '';
      if (!name) {
        throw new Error("var name must be provided as 'td' element text content");
      }
      const type = (kid as HTMLElement).dataset.type ?? 'string';
      //console.log((kid as HTMLElement).dataset)
      //console.log(type)
      if (!['string', 'number', 'date'].includes(type)) {
        throw new Error("var type must be provided as 'td' element 'data-type' attribute. Must be string, number, or date");
      }
      const isIndep = (kid as HTMLElement).dataset.independent === 'true' ? "independent" : "dependent";
      let measure = (kid as HTMLElement).dataset.measure ?? 'nominal';
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

  private loadRow(el: HTMLTableRowElement | null, vars: Facet[]) {
    //console.log("Start: loadRow")
    //console.log(el)
    //console.log(el!.tagName)
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

  findManifestTitle(els: HTMLElement[], manifest: Manifest): string{
    //console.log("findManifestTitle start")
    const table = els[0] as HTMLTableElement
    for (const kid of els[0].children){
      if (kid.nodeName === "CAPTION"){
        return kid.innerHTML
      }
    }
    if (els[0].hasAttribute("aria-label")){
      return els[0].getAttribute("aria-label")!
    }
    else if (els[0].hasAttribute("title")){
      return els[0].getAttribute("title")!
    }
    else{
      
      return `\'${this.loadHeaders(table.rows[0])[0].label}\' vs \'${this.loadHeaders(table.rows[0])[1].label}\'`
    }
    return ''
    //els[0].childNodes.forEach((node) => console.log(node.nodeName))
  }

  findManifestType(els: HTMLElement[], manifest: Manifest): string{
    //console.log("findManifestType start ")
    if (document.getElementsByTagName("para-chart")[0].hasAttribute("type")){
      return document.getElementsByTagName("para-chart")[0].getAttribute("type") as string
    }
    let title = this.findManifestTitle(els, manifest);
    const table = els[0] as HTMLTableElement;
    const vars = this.loadHeaders(table.rows[0]);
    const radialKeywords = ["proportion", "proportions", "ratio"]
    return "line"
  }
}