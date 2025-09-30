import{C as i}from"./Chart-BZaGO-9J.js";import{B as o}from"./barTests-CO1Sx6Gt.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:m}=__STORYBOOK_MODULE_TEST__,b={title:"Basic Charts/Bar Charts/Multi Bar Charts",render:n=>i(n)},a={name:"61: Age distribution in India 2008 to 2018 (5)",args:{filename:"manifests/autogen/bar-multi/bar-multi-manifest-61.json",forcecharttype:"bar"},play:async({canvas:n,userEvent:s})=>{await(await new o(n,s,m).loadManifest("manifests/autogen/bar-multi/bar-multi-manifest-61.json")).run()}};var t,r,e;a.parameters={...a.parameters,docs:{...(t=a.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: "61: Age distribution in India 2008 to 2018 (5)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-61.json",
    forcecharttype: "bar"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/bar-multi/bar-multi-manifest-61.json");
    await runner.run();
  }
}`,...(e=(r=a.parameters)==null?void 0:r.docs)==null?void 0:e.source}}};const g=["Chart5"];export{a as Chart5,g as __namedExportsOrder,b as default};
//# sourceMappingURL=barMulti5.stories-BrEcRtiS.js.map
