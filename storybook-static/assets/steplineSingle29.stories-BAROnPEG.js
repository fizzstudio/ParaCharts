import{C as i}from"./Chart-BZaGO-9J.js";import{S as o}from"./steplineTests-DBiEB0JC.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Line Charts/Single Stepline Charts",render:e=>i(e)},n={name:"595: Number of births in Canada 2000 to 2019 (29)",args:{filename:"manifests/autogen/line-single/line-single-manifest-595.json",forcecharttype:"stepline"},play:async({canvas:e,userEvent:r})=>{await(await new o(e,r,l).loadManifest("manifests/autogen/line-single/line-single-manifest-595.json")).run()}};var a,s,t;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "595: Number of births in Canada 2000 to 2019 (29)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-595.json",
    forcecharttype: "stepline"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-single/line-single-manifest-595.json");
    await runner.run();
  }
}`,...(t=(s=n.parameters)==null?void 0:s.docs)==null?void 0:t.source}}};const h=["Chart29"];export{n as Chart29,h as __namedExportsOrder,d as default};
//# sourceMappingURL=steplineSingle29.stories-BAROnPEG.js.map
