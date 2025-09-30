import{C as d,o as s}from"./Chart-BZaGO-9J.js";import"./iframe-1cuMuDzo.js";import"./_commonjsHelpers-BosuxZz1.js";const{expect:i}=__STORYBOOK_MODULE_TEST__,m={title:"Chart",tags:["autodocs"],render:n=>d(n),argTypes:{}},t={args:{filename:"",forcecharttype:"pie",slot:s(`
          <table>
          <caption>Division of energy in the Universe (Table)</caption>
          <thead>
            <tr>
              <th>Kind of energy</th>
              <th>Proportion of total energy in the Universe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dark Energy</td>
              <td>73%</td>
            </tr>
            <tr>
              <td>Dark Matter</td>
              <td>23%</td>
            </tr>
            <tr>
              <td>Nonluminous Matter</td>
              <td>3.6%</td>
            </tr>
            <tr>
              <td>Luminous Matter</td>
              <td>0.4%</td>
            </tr>
          </tbody>
        </table>
    `)},play:async({canvas:n,userEvent:c})=>{const o=await n.findByTestId("para-chart");await i(o).toBeInTheDocument()}};var e,r,a;t.parameters={...t.parameters,docs:{...(e=t.parameters)==null?void 0:e.docs,source:{originalSource:`{
  args: {
    filename: "",
    forcecharttype: "pie",
    slot: unsafeHTML(\`
          <table>
          <caption>Division of energy in the Universe (Table)</caption>
          <thead>
            <tr>
              <th>Kind of energy</th>
              <th>Proportion of total energy in the Universe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dark Energy</td>
              <td>73%</td>
            </tr>
            <tr>
              <td>Dark Matter</td>
              <td>23%</td>
            </tr>
            <tr>
              <td>Nonluminous Matter</td>
              <td>3.6%</td>
            </tr>
            <tr>
              <td>Luminous Matter</td>
              <td>0.4%</td>
            </tr>
          </tbody>
        </table>
    \`) as TemplateResult
  },
  play: async ({
    canvas,
    userEvent
  }) => {
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
  }
}`,...(a=(r=t.parameters)==null?void 0:r.docs)==null?void 0:a.source}}};const y=["FromSlot"];export{t as FromSlot,y as __namedExportsOrder,m as default};
//# sourceMappingURL=From Slot.stories-CBPdlwl3.js.map
