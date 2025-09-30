import{A as i}from"./Chart-BZaGO-9J.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";const{expect:o}=__STORYBOOK_MODULE_TEST__,l={title:"Chart",render:n=>i(n)},e={args:{filename:"manifests/autogen/line-single/line-single-manifest-843.json",description:"An unrelated description"},play:async({canvas:n,userEvent:c})=>{const s=await n.findByTestId("para-chart");await o(s).toBeInTheDocument()}};var a,t,r;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  args: {
    filename: 'manifests/autogen/line-single/line-single-manifest-843.json',
    description: 'An unrelated description'
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
  }
}`,...(r=(t=e.parameters)==null?void 0:t.docs)==null?void 0:r.source}}};const u=["DescriptionOverride"];export{e as DescriptionOverride,u as __namedExportsOrder,l as default};
//# sourceMappingURL=descriptionOverride.stories-CQxuPY9I.js.map
