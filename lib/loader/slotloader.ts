import { type Datatype } from '@fizz/dataframe';
import { ChartType, DisplayType, Facet, Manifest, SeriesManifest } from '@fizz/paramanifest';
import { Logger, getLogger } from '@fizz/logger';

/*interface DataVar {
  name: string;
  isIndep?: boolean;
  type: Datatype;
}*/

export class SlotLoader {
  private log: Logger = getLogger("SlotLoader");
  canLoadData(els: HTMLElement[]): boolean {
    return els.length !== 0 && els[0].tagName === 'TABLE';
  }

  async findManifest(
    els: HTMLElement[], 
    manifestID?: string,
    description?: string
  ): Promise<{ result: string; manifest?: Manifest; }> {
    if (manifestID) {
      this.log.info(`Loading from manifest ID: ${manifestID}`)
      if (document.getElementById(manifestID)) {
        if (document.getElementById(manifestID)!.hasAttribute('src')) {
          const manifestRaw 
            = await fetch(document.getElementById(manifestID)!.getAttribute('src') as string);
          const manifest = await manifestRaw.json() as Manifest;
          if (description) {
            manifest.datasets[0].description = description;
            this.log.info('manifest description changed');
          }
          return { result: 'success', manifest: manifest };
        } else {
            let manifest = JSON.parse(document.getElementById(manifestID)!.innerHTML);
            let filledManifest = this.validateManifest(els, manifest, description).manifest;
            return { result: 'success', manifest: filledManifest };
            /*
            if (JSON.parse(document.getElementById(manifestID)!.innerHTML).datasets[0].series[0].records.length > 0){
                return { result: 'success', manifest: manifest}
            }
            else {
                //this.log.info('Test')
                //this.log.info(this.loadDataFromElement(els, manifest))
                manifest.datasets[0].series[0].records = this.loadDataFromElement(els, manifest)
                this.log.info(manifest)
                return {result: 'success', manifest: manifest};
            }
                */
        }
      }
    }

    if (document.getElementsByClassName('manifest').length > 0) {
      let manifest = JSON.parse(document.getElementsByClassName('manifest')[0]!.innerHTML);
      let filledManifest = this.validateManifest(els, manifest, description).manifest;
      return { result: 'success', manifest: filledManifest };
    } else {
      this.log.info('Manifest ID not found or not present, attempting manifest construction from data');
      let manifest: Manifest = {
        datasets: [{
          representation: {
            type: 'chart',
            subtype: '' as 'line'
          }, 
          //chartTheme: {baseQuantity: 'Y unit', baseKind: 'number'}, 
          title: '', 
          facets: {}, 
          series: [], 
          data: {source: 'inline'}
        }]
      }
      return {result: 'success', manifest: this.validateManifest(els, manifest, description).manifest}
    }
    return {result: 'failure', manifest: undefined};
  }

  validateManifest(
    els: HTMLElement[], 
    manifest: Manifest,
    description?: string
  ): {result: string, manifest: Manifest | undefined} {
    const paraChart = document.getElementsByTagName('para-chart')[0];
    const table = els[0] as HTMLTableElement;
    const dataset = manifest.datasets[0];

    if (!dataset.title){
      dataset.title = this.findManifestTitle(table);
    }

    if (!dataset.facets || !dataset.facets.keys) {
      dataset.facets = this.loadFacets(table.rows[0]);
    }

    const vars = this.loadHeaders(table.rows[0]);
    if (!dataset.series || dataset.series.length === 0) {
      dataset.series = [];
      for (let i = 1; i < vars.length; i++) {
        const series: SeriesManifest = {
          key: vars[i].label,
          /*theme: { 
            baseQuantity: '',
            baseKind: 'number',
            entity: vars[i].label 
          },*/
          records: this.loadDataFromElement(els, manifest, vars[i].label)
        };
        dataset.series.push(series)
      }
    }

    /*if (isPastryType(paraChart.type!)) {
      dataset.series[0].theme!.baseKind = 'proportion';
    }*/
    for (let i = 1; i < vars.length; i++) {
      if (manifest!.datasets[0]!.series[0]!.records!.length === 0) {
        dataset.series[i].records = this.loadDataFromElement(els, manifest, vars[i].label);
      }
    }
    if (!dataset.representation.subtype) {
      dataset.representation.subtype = this.findManifestType(els, manifest);
    }
    if (!dataset.data) {
      dataset.data = { source: 'inline' };
    }
    if (!dataset.settings) {
      dataset.settings = { 'sonification.isSoniEnabled': true };
    }

    const cols = vars.map(v => [] as string[]);
    Array.from(table.rows).slice(1).forEach((tr: HTMLTableRowElement) => {
      const vals = this.loadRow(tr, vars);
      vals.forEach((val, j) => {
        cols[j].push(val);
      });
    });
    for (let i = 0; i < 2; i++) {
      let facet = dataset.facets[Object.keys(dataset.facets)[i]];
      if (/%/.test(cols[i][0])) {
        facet.measure = 'ratio';
      }
      if (/\b(year|month|day)\b/i.test(vars[i].label)) {
        facet.datatype = 'date';
      }
      else if (!isNaN(Number(cols[i][0].replace('%', '')))) {
        facet.datatype = 'number';
      }
      else {
        facet.datatype = 'string';
      }
    }
    if (description) {
      manifest.datasets[0].description = description;
      this.log.info('manifest description changed');
    }
    return {result: 'success', manifest: manifest };
  }

  loadDataFromElement(els: HTMLElement[], manifest: Manifest, key?: string){
    if (!els.length || els[0].tagName !== 'TABLE') {
      this.log.info(els);
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
    const paraChart = document.getElementsByTagName('para-chart')[0]
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
      const isIndep = (kid as HTMLElement).dataset.independent === 'true' ? 'independent' : 'dependent';
      let measure = (kid as HTMLElement).dataset.measure ?? 'nominal';

      const isRadial =paraChart.type == 'pie' || paraChart.type == 'donut'
      const horizVert = ['horizontal', 'vertical']
      let displayType;
      if (isRadial){
         displayType = (kid as HTMLElement).dataset.displayType ?? { type: 'marking' }
      }
      else{
         displayType = (kid as HTMLElement).dataset.displayType ?? { type: 'axis', orientation: horizVert[i] }
      }
      facets.push({
        label: name,
        datatype: type as Datatype,
        variableType: isIndep,
        measure: measure as 'nominal' | 'ordinal' | 'interval' | 'ratio',
        displayType: displayType as DisplayType
      })
      i++
    }
    return facets;
  }

  private loadFacets(el?: HTMLTableRowElement) {
    let vars = this.loadHeaders(el);
    if (vars.length < 2) {
      throw new Error('Error: please provide at least two variables');
    } else if (vars.length === 2) {
      let facets = { x: vars[0], y: vars[1] };
      facets['x'].variableType = 'independent';
      if (['Year', 'year', 'Years', 'years'].includes(facets['x'].label)){
        facets['x'].units = 'year';
      } else if (!facets['x'].units) {
        facets['x'].units = 'point';
      }
      return facets;
    };

    let indepFacet;
    for (let facet of vars) {
      if (facet.variableType == 'independent') {
        indepFacet = facet;
        break;
      }
    }
    if (indepFacet === undefined) {
      indepFacet = vars[0];
    }
    let depFacetName = '';
    for (let facet of vars.toSpliced(vars.indexOf(indepFacet), 1)) {
      //Truncate generated facet name if it's too long
      if (depFacetName.concat(facet.label, ' ').length > 50) {
        depFacetName = depFacetName.concat('...')
        break;
      }
      depFacetName = depFacetName.concat(facet.label, ', ')
    }
    let facets = {x: vars[0], y: vars[1]};
    facets['x'].variableType = 'independent';
    facets['y'].label = depFacetName;
    if (['Year', 'year', 'Years', 'years'].includes(facets['x'].label)) {
      facets['x'].units = 'year';
    } else if (!facets['x'].units) {
      facets['x'].units = 'point';
    }
    return facets;
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

  findManifestTitle(table: HTMLTableElement): string {
    for (const kid of table.children) {
      if (kid.nodeName === 'CAPTION') {
        return kid.innerHTML;
      }
    }
    if (table.hasAttribute('aria-label')) {
      return table.getAttribute('aria-label')!;
    }
    if (table.hasAttribute('title')) {
      return table.getAttribute('title')!;
    }
    return `'${this.loadHeaders(table.rows[0])[0].label}' vs '${this.loadHeaders(table.rows[0])[1].label}'`;
  }

  findManifestType(els: HTMLElement[], manifest: Manifest): ChartType {
    if (document.getElementsByTagName('para-chart')[0].hasAttribute('type')){
      return document.getElementsByTagName('para-chart')[0].getAttribute('type') as ChartType;
    }
    /*
    let title = this.findManifestTitle(els, manifest);
    const table = els[0] as HTMLTableElement;
    const vars = this.loadHeaders(table.rows[0]);
    const radialKeywords = ['proportion', 'proportions', 'ratio']
    return 'line'
    */
    throw new Error('Error: please provide a type for the para-chart');
  }
}