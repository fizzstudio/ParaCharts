import{C as c}from"./Chart-BZaGO-9J.js";import{S as o}from"./scatterTests-Cp7qJf6Y.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:i}=__STORYBOOK_MODULE_TEST__,_={title:"Basic Charts/Scatter Charts",render:t=>c(t)},a={name:"d3 (49)",args:{filename:"manifests/scatter-manifest-d3.json",forcecharttype:"scatter"},play:async({canvas:t,userEvent:s})=>{await(await new o(t,s,i).loadManifest("manifests/scatter-manifest-d3.json")).run()}};var e,n,r;a.parameters={...a.parameters,docs:{...(e=a.parameters)==null?void 0:e.docs,source:{originalSource:`{
  name: "d3 (49)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "scatter"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/scatter-manifest-d3.json");
    await runner.run();
  }
}`,...(r=(n=a.parameters)==null?void 0:n.docs)==null?void 0:r.source}}};const h=["Chart49"];export{a as Chart49,h as __namedExportsOrder,_ as default};
//# sourceMappingURL=scatter49.stories-B2vbGmNC.js.map
