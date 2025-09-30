import{C as i}from"./Chart-BZaGO-9J.js";import{L as o}from"./lineTests-CVNs2w0h.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Line Charts/Single Line Charts",render:e=>i(e)},n={name:"128: Cattle population worldwide 2012 to 2019 (22)",args:{filename:"manifests/autogen/line-single/line-single-manifest-128.json",forcecharttype:"line"},play:async({canvas:e,userEvent:r})=>{await(await new o(e,r,l).loadManifest("manifests/autogen/line-single/line-single-manifest-128.json")).run()}};var a,t,s;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "128: Cattle population worldwide 2012 to 2019 (22)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-128.json",
    forcecharttype: "line"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-single/line-single-manifest-128.json");
    await runner.run();
  }
}`,...(s=(t=n.parameters)==null?void 0:t.docs)==null?void 0:s.source}}};const w=["Chart22"];export{n as Chart22,w as __namedExportsOrder,d as default};
//# sourceMappingURL=lineSingle22.stories-B8M010xC.js.map
