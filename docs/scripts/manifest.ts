import schema from '../../node_modules/@fizz/paramanifest/schema/manifest_bundle.schema.json' with { type: 'json' };

type AnySchema = any;

function resolveRef(ref: string, root: AnySchema): AnySchema | null {
  if (!ref || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let cur: any = root;
  for (const p of parts) {
    if (!cur) return null;
    cur = cur[p];
  }
  return cur || null;
}

function schemaType(s: AnySchema): string {
  if (!s) return 'unknown';
  if (s.$ref) return `ref:${s.$ref.replace('#/definitions/', '')}`;
  if (Array.isArray(s.type)) return s.type.join('|');
  if (s.type) return s.type;
  if (s.enum) return `enum(${(s.enum || []).join(',')})`;
  if (s.anyOf) return 'anyOf';
  return 'object';
}

function extractProperties(s: AnySchema, root: AnySchema, parentPath?: string): Array<any> {
  const props: Array<any> = [];
  const properties = s?.properties || {};
  const required: string[] = s?.required || [];

  for (const [name, propSchema] of Object.entries(properties)) {
    let resolved = propSchema as AnySchema;
    if ((resolved as AnySchema).$ref) {
      const r = resolveRef((resolved as AnySchema).$ref, root);
      if (r) resolved = r;
    }

    const path = parentPath ? `${parentPath}.${name}` : name;

    const item: any = {
      name,
      path,
      description: resolved.description || resolved.title || '',
      type: schemaType(resolved),
      required: required.includes(name) || false,
    };

    if (resolved.type === 'object' && resolved.properties) {
      item.children = extractProperties(resolved, root, path);
    }

    if (resolved.type === 'array' && resolved.items) {
      let items = resolved.items as AnySchema;
      if (items.$ref) {
        const r = resolveRef(items.$ref, root);
        if (r) items = r;
      }
      item.itemsType = schemaType(items);
      if (items.type === 'object' && items.properties) {
        item.children = extractProperties(items, root, path);
      }
    }

    props.push(item);
  }

  return props;
}

function nestedSections(properties: Array<any>): Array<{ path: string; properties: Array<any> }> {
  return properties.flatMap(property => property.children?.length
    ? [
        { path: property.path, properties: property.children },
        ...nestedSections(property.children),
      ]
    : []);
}

const manifestSchema: AnySchema = (schema as AnySchema) || {};
if (!manifestSchema.definitions && manifestSchema.$defs) {
  manifestSchema.definitions = manifestSchema.$defs;
}

const properties = extractProperties(manifestSchema, manifestSchema);
if (properties.length === 0) throw new Error('Manifest schema has no documentable properties');

const context = {
  title: manifestSchema.title || 'Manifest',
  description: manifestSchema.description || '',
  properties,
  nestedSections: nestedSections(properties),
};

export default context;
