import{C as i}from"./Chart-BZaGO-9J.js";import{L as o}from"./lineTests-CVNs2w0h.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Line Charts/Single Line Charts",render:n=>i(n)},e={name:"328: General Motors - number of employees 2019 (24)",args:{filename:"manifests/autogen/line-single/line-single-manifest-328.json",forcecharttype:"line"},play:async({canvas:n,userEvent:t})=>{await(await new o(n,t,l).loadManifest("manifests/autogen/line-single/line-single-manifest-328.json")).run()}};var a,s,r;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "328: General Motors - number of employees 2019 (24)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-328.json",
    forcecharttype: "line"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-single/line-single-manifest-328.json");
    await runner.run();
  }
}`,...(r=(s=e.parameters)==null?void 0:s.docs)==null?void 0:r.source}}};const h=["Chart24"];export{e as Chart24,h as __namedExportsOrder,d as default};
//# sourceMappingURL=lineSingle24.stories-BZ7U9rAr.js.map
