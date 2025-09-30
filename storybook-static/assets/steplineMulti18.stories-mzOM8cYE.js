import{C as s}from"./Chart-BZaGO-9J.js";import{S as i}from"./steplineTests-DBiEB0JC.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:m}=__STORYBOOK_MODULE_TEST__,h={title:"Basic Charts/Line Charts/Multi Stepline Charts",render:n=>s(n)},e={name:"Pokemon: Holographic Pokemon Card Price (18)",args:{filename:"manifests/autogen/line-multi/line-multi-manifest-Pokemon.json",forcecharttype:"stepline"},play:async({canvas:n,userEvent:o})=>{await(await new i(n,o,m).loadManifest("manifests/autogen/line-multi/line-multi-manifest-Pokemon.json")).run()}};var t,a,r;e.parameters={...e.parameters,docs:{...(t=e.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: "Pokemon: Holographic Pokemon Card Price (18)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-Pokemon.json",
    forcecharttype: "stepline"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-multi/line-multi-manifest-Pokemon.json");
    await runner.run();
  }
}`,...(r=(a=e.parameters)==null?void 0:a.docs)==null?void 0:r.source}}};const P=["Chart18"];export{e as Chart18,P as __namedExportsOrder,h as default};
//# sourceMappingURL=steplineMulti18.stories-mzOM8cYE.js.map
