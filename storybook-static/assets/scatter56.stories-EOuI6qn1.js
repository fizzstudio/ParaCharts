import{C as c}from"./Chart-BZaGO-9J.js";import{S as o}from"./scatterTests-Cp7qJf6Y.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:i}=__STORYBOOK_MODULE_TEST__,_={title:"Basic Charts/Scatter Charts",render:t=>c(t)},a={name:"s1 (56)",args:{filename:"manifests/scatter-manifest-s1.json",forcecharttype:"scatter"},play:async({canvas:t,userEvent:r})=>{await(await new o(t,r,i).loadManifest("manifests/scatter-manifest-s1.json")).run()}};var e,n,s;a.parameters={...a.parameters,docs:{...(e=a.parameters)==null?void 0:e.docs,source:{originalSource:`{
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
}`,...(s=(n=a.parameters)==null?void 0:n.docs)==null?void 0:s.source}}};const h=["Chart56"];export{a as Chart56,h as __namedExportsOrder,_ as default};
//# sourceMappingURL=scatter56.stories-EOuI6qn1.js.map
