import{A as i}from"./Chart-BZaGO-9J.js";import{S as o}from"./scatterTests-Cp7qJf6Y.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";import"./TestRunner-al5jZUR9.js";const{expect:c}=__STORYBOOK_MODULE_TEST__,h={title:"AI-enhanced Charts/Scatter Charts",render:a=>i(a)},e={name:"Iris Flower Data Set (54)",args:{filename:"manifests/scatter-manifest-iris-petal.json",forcecharttype:"scatter"},play:async({canvas:a,userEvent:s})=>{await(await new o(a,s,c).loadManifest("manifests/scatter-manifest-iris-petal.json")).run()}};var t,r,n;e.parameters={...e.parameters,docs:{...(t=e.parameters)==null?void 0:t.docs,source:{originalSource:`{
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
}`,...(n=(r=e.parameters)==null?void 0:r.docs)==null?void 0:n.source}}};const w=["AiChart54"];export{e as AiChart54,w as __namedExportsOrder,h as default};
//# sourceMappingURL=AIscatter54.stories-CkyOvGzf.js.map
