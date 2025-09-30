import{C as i}from"./Chart-BZaGO-9J.js";import{S as o}from"./scatterTests-Cp7qJf6Y.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:c}=__STORYBOOK_MODULE_TEST__,w={title:"Basic Charts/Scatter Charts",render:t=>i(t)},a={name:"Iris Flower Data Set (54)",args:{filename:"manifests/scatter-manifest-iris-petal.json",forcecharttype:"scatter"},play:async({canvas:t,userEvent:s})=>{await(await new o(t,s,c).loadManifest("manifests/scatter-manifest-iris-petal.json")).run()}};var e,r,n;a.parameters={...a.parameters,docs:{...(e=a.parameters)==null?void 0:e.docs,source:{originalSource:`{
  name: "Iris Flower Data Set (54)",
  args: {
    filename: "manifests/scatter-manifest-iris-petal.json",
    forcecharttype: "scatter"
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const runner = await new Runner(canvas, userEvent, expect).loadManifest("manifests/scatter-manifest-iris-petal.json");
    await runner.run();
  }
}`,...(n=(r=a.parameters)==null?void 0:r.docs)==null?void 0:n.source}}};const S=["Chart54"];export{a as Chart54,S as __namedExportsOrder,w as default};
//# sourceMappingURL=scatter54.stories-BhqGpqoT.js.map
