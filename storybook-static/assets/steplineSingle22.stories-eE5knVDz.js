import{C as i}from"./Chart-BZaGO-9J.js";import{S as o}from"./steplineTests-DBiEB0JC.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Line Charts/Single Stepline Charts",render:n=>i(n)},e={name:"128: Cattle population worldwide 2012 to 2019 (22)",args:{filename:"manifests/autogen/line-single/line-single-manifest-128.json",forcecharttype:"stepline"},play:async({canvas:n,userEvent:r})=>{await(await new o(n,r,l).loadManifest("manifests/autogen/line-single/line-single-manifest-128.json")).run()}};var a,t,s;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "128: Cattle population worldwide 2012 to 2019 (22)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-128.json",
    forcecharttype: "stepline"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-single/line-single-manifest-128.json");
    await runner.run();
  }
}`,...(s=(t=e.parameters)==null?void 0:t.docs)==null?void 0:s.source}}};const w=["Chart22"];export{e as Chart22,w as __namedExportsOrder,d as default};
//# sourceMappingURL=steplineSingle22.stories-eE5knVDz.js.map
