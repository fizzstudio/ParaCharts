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
      let manifest = {datasets: [{type: '' as 'line', chartTheme: {baseQuantity: 'Y unit', baseKind: "number" as "number"},  title: '', facets: {}, series: [], data: {source: 'inline' as 'inline'}}]}
      return {result: "success", manifest: this.validateManifest(els, manifest).manifest}
    }
    return {result: "failure", manifest: undefined};
  }

  validateManifest(els: HTMLElement[], manifest: Manifest): {result: string, manifest: Manifest | undefined}{
    const paraChart = document.getElementsByTagName("para-chart")[0]
    const table = els[0] as HTMLTableElement;
    const dataset = manifest.datasets[0]
    if (!dataset.title){
      dataset.title = this.findManifestTitle(els, manifest)
    }
    const vars = this.loadHeaders(table.rows[0]);
    const facets = this.loadFacets(table.rows[0])

    if (!dataset.facets){
      dataset.facets = facets
    }
    if (dataset!.facets){
      if (!dataset!.facets.keys){
        dataset.facets = facets
      }
    }
    if (!dataset!.series){
      dataset.series = [];
      for (let i = 1; i< vars.length; i++){
          let series = {key:vars[i].label, theme: {baseQuantity: '', baseKind: "number" as "number", entity: vars[i].label}, records: this.loadDataFromElement(els, manifest, vars[i].label)}
          dataset.series.push(series)
        }
    }
    if (dataset!.series){
      if (dataset!.series.keys.length == 0){
        for (let i = 1; i< vars.length; i++){
          let series = {key:vars[i].label, theme: {baseQuantity: '', baseKind: "number" as "number", entity: vars[i].label}, records: this.loadDataFromElement(els, manifest, vars[i].label)}
          dataset.series.push(series)
        }
      
      }
    }
    const isRadial = paraChart.type == "pie" || paraChart.type == "donut"
    if (isRadial){
      dataset.series[0].theme.baseKind = "proportion"
    }
    for (let i = 1; i < vars.length; i++) {
      if (manifest!.datasets[0]!.series[0]!.records!.length == 0) {
        dataset.series[i].records = this.loadDataFromElement(els, manifest, vars[i].label)
      }
    }
    if (!dataset!.type){
      dataset!.type = this.findManifestType(els, manifest) as "line" | "column" | "bar" | "scatter" | "lollipop" | "stepline" | "pie" | "donut";;
    }
    if (!dataset!.data){
      dataset!.data = {source: "inline"}
    }
    if (!dataset!.settings){
      dataset!.settings = {"sonification.isEnabled": true}
    }

    const cols = vars.map(v => [] as string[]);
    Array.from(table.rows).slice(1).forEach((tr: HTMLTableRowElement) => {
      const vals = this.loadRow(tr, vars);
      vals.forEach((val, j) => {
        cols[j].push(val);
      });
    });
    for (let i = 0; i < 2; i++) {
      let facet = dataset.facets[Object.keys(dataset.facets)[i]]
      if (/%/.test(cols[i][0])) {
        facet.measure = "ratio"
      }
      if (/\b(year|month|day)\b/i.test(vars[i].label)) {
        facet.datatype = "date"
      }
      else if (/\d/.test(cols[i][0])) {
        facet.datatype = "number"
      }
    }
    return {result: "success", manifest: manifest}
  }

  loadDataFromElement(els: HTMLElement[], manifest: Manifest, key?: string){
    if (!els.length || els[0].tagName !== 'TABLE') {
      console.log(els);
      throw new Error("'table' element must be provided");
    }
    const table = els[0] as HTMLTableElement;
    let vars = this.loadHeaders(table.rows[0]);
    let varsFiltered;
    if (key){
      varsFiltered = vars.filter(v => v.label == key)[0]
    }
    let index = vars.indexOf(varsFiltered!)
    if (index == -1){
      index = 1;
    }
    const cols = vars.map(v => [] as string[]);
    Array.from(table.rows).slice(1).forEach((tr: HTMLTableRowElement) => {
      const vals = this.loadRow(tr, vars);
      vals.forEach((val, j) => {
        cols[j].push(val);
      });
    });
    let data = []
    for (let i = 0; i < cols[0].length; i++){
      data.push({x: cols[0][i], y: cols[index][i]})
    }
    return data;
  }

  private loadHeaders(el?: HTMLTableRowElement) {
    const paraChart = document.getElementsByTagName("para-chart")[0]
    if (!el) {
      throw new Error('table must include a header row');
    }
    const facets: Facet[] = [];
    let i = 0;
    for (const kid of el.children) {      
      if (kid.tagName !== 'TD' && kid.tagName !== 'TH') {
        throw new Error("immediate children of 'tr' element must be 'td' or 'th' elements");
      }
      const name = kid.textContent?.trim() ?? '';
      if (!name) {
        throw new Error("var name must be provided as 'td' element text content");
      }
      let type = (kid as HTMLElement).dataset.type ?? 'string';
      if (!['string', 'number', 'date'].includes(type)) {
        throw new Error("var type must be provided as 'td' element 'data-type' attribute. Must be string, number, or date");
      }
      const isIndep = (kid as HTMLElement).dataset.independent === 'true' ? "independent" : "dependent";
      let measure = (kid as HTMLElement).dataset.measure ?? 'nominal';

      const isRadial =paraChart.type == "pie" || paraChart.type == "donut"
      const horizVert = ["horizontal", "vertical"]
      let displayType;
      if (isRadial){
         displayType = (kid as HTMLElement).dataset.displayType ?? { type: "marking" }
      }
      else{
         displayType = (kid as HTMLElement).dataset.displayType ?? { type: "axis", orientation: horizVert[i] }
      }
      facets.push({
        label: name,
        datatype: type as Datatype,
        variableType: isIndep,
        measure: measure as "nominal" | "ordinal" | "interval" | "ratio",
        displayType: displayType as DisplayType
      })
      i++
    }
    return facets;
  }

  private loadFacets(el?: HTMLTableRowElement){
    let vars = this.loadHeaders(el);
    if (vars.length < 2){
      throw new Error("Error: please provide at least two variables")
    }
    else if (vars.length == 2){
      let facets = { x: vars[0], y: vars[1] };
      facets["x"].variableType = "independent"
      if (["Year", "year", "Years", "years"].includes(facets["x"].label)){
        facets["x"].units = "year"
      }
      else if (!facets["x"].units) {
        facets["x"].units = "point"
      }
      return facets;
    }
    else{
    let indepFacet;
    for (let facet of vars){
      if (facet.variableType == "independent"){
        indepFacet = facet
        break;
      }
    }
    if (indepFacet == undefined){
      indepFacet = vars[0]
    }
    let depFacetName = '';
    for (let facet of vars.toSpliced(vars.indexOf(indepFacet), 1)) {
      //Truncate generated facet name if it's too long
      if (depFacetName.concat(facet.label, " ").length > 50){
        depFacetName = depFacetName.concat("...")
        break;
      }
      depFacetName = depFacetName.concat(facet.label, ", ")
    }
    let facets = {x: vars[0], y: vars[1]};
    facets["x"].variableType = "independent"
    facets["y"].label = depFacetName
      if (["Year", "year", "Years", "years"].includes(facets["x"].label)){
        facets["x"].units = "year"
      }
      else if (!facets["x"].units) {
        facets["x"].units = "point"
      }
      return facets;
    }
    
  }
  private loadRow(el: HTMLTableRowElement | null, vars: Facet[]) {
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
  }

  findManifestType(els: HTMLElement[], manifest: Manifest): string{
    if (document.getElementsByTagName("para-chart")[0].hasAttribute("type")){
      return document.getElementsByTagName("para-chart")[0].getAttribute("type") as string
    }
    /*
    let title = this.findManifestTitle(els, manifest);
    const table = els[0] as HTMLTableElement;
    const vars = this.loadHeaders(table.rows[0]);
    const radialKeywords = ["proportion", "proportions", "ratio"]
    return "line"
    */
    throw new Error("Error: please provide a type for the para-chart")
  }
}