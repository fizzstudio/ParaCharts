import{A as o}from"./Chart-BZaGO-9J.js";import{S as c}from"./scatterTests-Cp7qJf6Y.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:i}=__STORYBOOK_MODULE_TEST__,y={title:"AI-enhanced Charts/Scatter Charts",render:t=>o(t)},e={name:"Old Faithful Geyser Eruptions (51)",args:{filename:"manifests/scatter-manifest-geyser.json",forcecharttype:"scatter"},play:async({canvas:t,userEvent:s})=>{await(await new c(t,s,i).loadManifest("manifests/scatter-manifest-geyser.json")).run()}};var a,n,r;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
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
}`,...(r=(n=e.parameters)==null?void 0:n.docs)==null?void 0:r.source}}};const h=["AiChart51"];export{e as AiChart51,h as __namedExportsOrder,y as default};
//# sourceMappingURL=AIscatter51.stories-FrkfbOYN.js.map
