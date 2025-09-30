import{C as i}from"./Chart-BZaGO-9J.js";import{S as o}from"./steplineTests-DBiEB0JC.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,w={title:"Basic Charts/Line Charts/Multi Stepline Charts",render:n=>i(n)},e={name:"261: Passenger cars - sales in selected countries worldwide 2005 to 2018 (13)",args:{filename:"manifests/autogen/line-multi/line-multi-manifest-261.json",forcecharttype:"stepline"},play:async({canvas:n,userEvent:r})=>{await(await new o(n,r,l).loadManifest("manifests/autogen/line-multi/line-multi-manifest-261.json")).run()}};var t,a,s;e.parameters={...e.parameters,docs:{...(t=e.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: "261: Passenger cars - sales in selected countries worldwide 2005 to 2018 (13)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-261.json",
    forcecharttype: "stepline"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-multi/line-multi-manifest-261.json");
    await runner.run();
  }
}`,...(s=(a=e.parameters)==null?void 0:a.docs)==null?void 0:s.source}}};const g=["Chart13"];export{e as Chart13,g as __namedExportsOrder,w as default};
//# sourceMappingURL=steplineMulti13.stories-DBIpFEdR.js.map
