import{C as i}from"./Chart-BZaGO-9J.js";import{S as o}from"./steplineTests-DBiEB0JC.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Line Charts/Single Stepline Charts",render:n=>i(n)},e={name:"541: USA - number of arrests for all offenses 1990 to 2018 (28)",args:{filename:"manifests/autogen/line-single/line-single-manifest-541.json",forcecharttype:"stepline"},play:async({canvas:n,userEvent:r})=>{await(await new o(n,r,l).loadManifest("manifests/autogen/line-single/line-single-manifest-541.json")).run()}};var s,a,t;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  name: "541: USA - number of arrests for all offenses 1990 to 2018 (28)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-541.json",
    forcecharttype: "stepline"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-single/line-single-manifest-541.json");
    await runner.run();
  }
}`,...(t=(a=e.parameters)==null?void 0:a.docs)==null?void 0:t.source}}};const S=["Chart28"];export{e as Chart28,S as __namedExportsOrder,d as default};
//# sourceMappingURL=steplineSingle28.stories-BW6Ygxva.js.map
