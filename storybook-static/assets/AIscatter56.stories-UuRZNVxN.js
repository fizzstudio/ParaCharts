import{A as c}from"./Chart-BZaGO-9J.js";import{S as o}from"./scatterTests-Cp7qJf6Y.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:i}=__STORYBOOK_MODULE_TEST__,h={title:"AI-enhanced Charts/Scatter Charts",render:a=>c(a)},e={name:"s1 (56)",args:{filename:"manifests/scatter-manifest-s1.json",forcecharttype:"scatter"},play:async({canvas:a,userEvent:r})=>{await(await new o(a,r,i).loadManifest("manifests/scatter-manifest-s1.json")).run()}};var t,n,s;e.parameters={...e.parameters,docs:{...(t=e.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: "s1 (56)",
  args: {
    filename: "manifests/scatter-manifest-s1.json",
    forcecharttype: "scatter"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/scatter-manifest-s1.json");
    await runner.run();
  }
}`,...(s=(n=e.parameters)==null?void 0:n.docs)==null?void 0:s.source}}};const _=["AiChart56"];export{e as AiChart56,_ as __namedExportsOrder,h as default};
//# sourceMappingURL=AIscatter56.stories-UuRZNVxN.js.map
