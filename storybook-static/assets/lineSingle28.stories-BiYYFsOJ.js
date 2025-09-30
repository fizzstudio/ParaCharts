import{C as i}from"./Chart-BZaGO-9J.js";import{L as o}from"./lineTests-CVNs2w0h.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Line Charts/Single Line Charts",render:e=>i(e)},n={name:"541: USA - number of arrests for all offenses 1990 to 2018 (28)",args:{filename:"manifests/autogen/line-single/line-single-manifest-541.json",forcecharttype:"line"},play:async({canvas:e,userEvent:t})=>{await(await new o(e,t,l).loadManifest("manifests/autogen/line-single/line-single-manifest-541.json")).run()}};var a,s,r;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "541: USA - number of arrests for all offenses 1990 to 2018 (28)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-541.json",
    forcecharttype: "line"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-single/line-single-manifest-541.json");
    await runner.run();
  }
}`,...(r=(s=n.parameters)==null?void 0:s.docs)==null?void 0:r.source}}};const h=["Chart28"];export{n as Chart28,h as __namedExportsOrder,d as default};
//# sourceMappingURL=lineSingle28.stories-BiYYFsOJ.js.map
