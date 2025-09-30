import{C as r}from"./Chart-BZaGO-9J.js";import{S as o}from"./steplineTests-DBiEB0JC.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,d={title:"Basic Charts/Line Charts/Single Stepline Charts",render:n=>r(n)},e={name:"172: Median household income in the United States 1990 to 2018 (23)",args:{filename:"manifests/autogen/line-single/line-single-manifest-172.json",forcecharttype:"stepline"},play:async({canvas:n,userEvent:i})=>{await(await new o(n,i,l).loadManifest("manifests/autogen/line-single/line-single-manifest-172.json")).run()}};var t,a,s;e.parameters={...e.parameters,docs:{...(t=e.parameters)==null?void 0:t.docs,source:{originalSource:`{
  name: "172: Median household income in the United States 1990 to 2018 (23)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-172.json",
    forcecharttype: "stepline"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/autogen/line-single/line-single-manifest-172.json");
    await runner.run();
  }
}`,...(s=(a=e.parameters)==null?void 0:a.docs)==null?void 0:s.source}}};const h=["Chart23"];export{e as Chart23,h as __namedExportsOrder,d as default};
//# sourceMappingURL=steplineSingle23.stories-DmmvxM8X.js.map
