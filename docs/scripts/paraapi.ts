import { ApiModel, ApiClass, ApiMethod, ApiPropertyItem, ApiItemKind } from '@microsoft/api-extractor-model';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractSummaryText(item: ApiClass | ApiMethod | ApiPropertyItem): string {
    const summary = item.tsdocComment?.summarySection;
    if (!summary) return '';
    let text = '';
    for (const node of summary.nodes) {
        if (node.kind === 'Paragraph') {
            for (const child of (node as any).nodes) {
                if (child.kind === 'PlainText') {
                    text += (child as any).text;
                }
            }
        }
    }
    return text.trim();
}

const apiModel = new ApiModel();
const apiJsonPath = path.resolve(__dirname, '../../temp/paracharts.api.json');
apiModel.loadPackage(apiJsonPath);

let paraApiClass: ApiClass | undefined;
for (const pkg of apiModel.packages) {
    for (const ep of pkg.entryPoints) {
        for (const member of ep.members) {
            if (member.kind === ApiItemKind.Class && member.displayName === 'ParaAPI') {
                paraApiClass = member as ApiClass;
            }
        }
    }
}

const methods: { heading: string; description: string }[] = [];

if (paraApiClass) {
    for (const member of paraApiClass.members) {
        if (member.kind === ApiItemKind.Constructor) continue;
        if ((member as any).isProtected) continue;

        if (member.kind === ApiItemKind.Method) {
            const method = member as ApiMethod;
            const params = method.parameters.map(p => p.name).join(', ');
            methods.push({
                heading: `${method.displayName}(${params})`,
                description: extractSummaryText(method),
            });
        } else if (member.kind === ApiItemKind.Property) {
            const prop = member as ApiPropertyItem;
            methods.push({
                heading: `get ${prop.displayName}`,
                description: extractSummaryText(prop),
            });
        }
    }
}

export default {
    classDescription: paraApiClass ? extractSummaryText(paraApiClass) : '',
    methods,
};
