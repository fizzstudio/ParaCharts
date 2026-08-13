import { ApiClass, ApiMethod, ApiPropertyItem, ApiItemKind } from '@microsoft/api-extractor-model';
import { loadApiModel, extractSummaryText } from './apiModelUtils.js';

const apiModel = loadApiModel();

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

if (!paraApiClass) throw new Error('ParaAPI was not found in the staged API model');

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

export default {
    classDescription: extractSummaryText(paraApiClass),
    methods,
};
