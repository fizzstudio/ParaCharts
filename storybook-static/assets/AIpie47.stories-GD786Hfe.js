import{A as i}from"./Chart-BZaGO-9J.js";import{P as o}from"./pieTests-B2M7DJky.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:m}=__STORYBOOK_MODULE_TEST__,l={title:"AI-enhanced Charts/Pastry Charts/Pie Charts",render:n=>i(n)},e={name:"Division of energy in the Universe (47)",args:{filename:"manifests/pie-manifest-dark-matter.json",forcecharttype:"pie"},play:async({canvas:n,userEvent:s})=>{await(await new o(n,s,m).loadManifest("manifests/pie-manifest-dark-matter.json")).run()}};var a,r,t;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "Division of energy in the Universe (47)",
  args: {
    filename: "manifests/pie-manifest-dark-matter.json",
    forcecharttype: "pie"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/pie-manifest-dark-matter.json");
    await runner.run();
  }
}`,...(t=(r=e.parameters)==null?void 0:r.docs)==null?void 0:t.source}}};const y=["AiChart47"];export{e as AiChart47,y as __namedExportsOrder,l as default};
//# sourceMappingURL=AIpie47.stories-GD786Hfe.js.map
