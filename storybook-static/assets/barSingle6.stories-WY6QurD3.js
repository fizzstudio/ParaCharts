import{C as i}from"./Chart-BZaGO-9J.js";import{B as o}from"./barTests-CO1Sx6Gt.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:m}=__STORYBOOK_MODULE_TEST__,b={title:"Basic Charts/Bar Charts/Single Bar Charts",render:n=>i(n)},e={name:"1018: Unemployment rate in Greece 1999-2019 (6)",args:{filename:"manifests/autogen/bar-single/bar-single-manifest-1018.json",forcecharttype:"bar"},play:async({canvas:n,userEvent:t})=>{await(await new o(n,t,m).loadManifest("manifests/autogen/bar-single/bar-single-manifest-1018.json")).run()}};var a,r,s;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  name: "1018: Unemployment rate in Greece 1999-2019 (6)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-1018.json",
    forcecharttype: "bar"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/bar-single/bar-single-manifest-1018.json");
    await runner.run();
  }
}`,...(s=(r=e.parameters)==null?void 0:r.docs)==null?void 0:s.source}}};const d=["Chart6"];export{e as Chart6,d as __namedExportsOrder,b as default};
//# sourceMappingURL=barSingle6.stories-WY6QurD3.js.map
