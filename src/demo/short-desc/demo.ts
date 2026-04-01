import '../../../lib-ai/index-ai';

import { ParaChartAi } from '../../../lib-ai/index-ai';

async function displayShortDesc(pElementId: string, chartElementId: string): Promise<void> {
  const pElement = document.getElementById(pElementId) as HTMLParagraphElement;
  const chartElement = document.getElementById(chartElementId) as ParaChartAi;
  const shortDesc = await chartElement.shortDescription();
  pElement.innerText = shortDesc;
}

displayShortDesc('single_line_p', 'single_line_c');
displayShortDesc('multi_line_p', 'multi_line_c');
displayShortDesc('pie_p', 'pie_c');
displayShortDesc('single_bar_p', 'single_bar_c');
displayShortDesc('multi_bar_p', 'multi_bar_c');
displayShortDesc('scatter_p', 'scatter_c');
displayShortDesc('waterfall_p', 'waterfall_c');
