import{C as i}from"./Chart-BZaGO-9J.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";const{expect:c}=__STORYBOOK_MODULE_TEST__,u={title:"Chart",render:a=>i(a)},e={name:"Multi-series Line Chart with Legend and No Symbols",args:{filename:"manifests/autogen/line-multi/line-multi-manifest-16.json",forcecharttype:"line",config:{"chart.hasDirectLabels":!1,"chart.isDrawSymbols":!1,"legend.isAlwaysDrawLegend":!0}},play:async({canvas:a,userEvent:o})=>{const n=await a.findByTestId("para-chart");await c(n).toBeInTheDocument()}};var t,r,s;e.parameters={...e.parameters,docs:{...(t=e.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: "Multi-series Line Chart with Legend and No Symbols",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-16.json",
    forcecharttype: "line",
    config: {
      'chart.hasDirectLabels': false,
      'chart.isDrawSymbols': false,
      'legend.isAlwaysDrawLegend': true
    }
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const parachart = await canvas.findByTestId('para-chart');
    //await userEvent.click(button);
    await expect(parachart).toBeInTheDocument();
  }
}`,...(s=(r=e.parameters)==null?void 0:r.docs)==null?void 0:s.source}}};const p=["FeaturesChart0"];export{e as FeaturesChart0,p as __namedExportsOrder,u as default};
//# sourceMappingURL=lineMultiFeatures.stories-DE40OYV0.js.map
