import{C as o}from"./Chart-BZaGO-9J.js";import{S as c}from"./scatterTests-Cp7qJf6Y.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:i}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Scatter Charts",render:t=>o(t)},e={name:"Old Faithful Geyser Eruptions (51)",args:{filename:"manifests/scatter-manifest-geyser.json",forcecharttype:"scatter"},play:async({canvas:t,userEvent:s})=>{await(await new c(t,s,i).loadManifest("manifests/scatter-manifest-geyser.json")).run()}};var a,r,n;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "Old Faithful Geyser Eruptions (51)",
  args: {
    filename: "manifests/scatter-manifest-geyser.json",
    forcecharttype: "scatter"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/scatter-manifest-geyser.json");
    await runner.run();
  }
}`,...(n=(r=e.parameters)==null?void 0:r.docs)==null?void 0:n.source}}};const h=["Chart51"];export{e as Chart51,h as __namedExportsOrder,d as default};
//# sourceMappingURL=scatter51.stories-B2g60yXB.js.map
