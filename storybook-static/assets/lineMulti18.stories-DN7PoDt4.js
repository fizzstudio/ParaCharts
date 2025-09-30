import{C as i}from"./Chart-BZaGO-9J.js";import{L as s}from"./lineTests-CVNs2w0h.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:m}=__STORYBOOK_MODULE_TEST__,h={title:"Basic Charts/Line Charts/Multi Line Charts",render:e=>i(e)},n={name:"Pokemon: Holographic Pokemon Card Price (18)",args:{filename:"manifests/autogen/line-multi/line-multi-manifest-Pokemon.json",forcecharttype:"line"},play:async({canvas:e,userEvent:o})=>{await(await new s(e,o,m).loadManifest("manifests/autogen/line-multi/line-multi-manifest-Pokemon.json")).run()}};var a,t,r;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "Pokemon: Holographic Pokemon Card Price (18)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-Pokemon.json",
    forcecharttype: "line"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-multi/line-multi-manifest-Pokemon.json");
    await runner.run();
  }
}`,...(r=(t=n.parameters)==null?void 0:t.docs)==null?void 0:r.source}}};const P=["Chart18"];export{n as Chart18,P as __namedExportsOrder,h as default};
//# sourceMappingURL=lineMulti18.stories-DN7PoDt4.js.map
