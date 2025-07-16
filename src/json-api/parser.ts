/**
 * JSON API serializer parser
 */

import { JsonApiSchema, JsonApiSerializer } from './types';

export function parseJsonApiFromObject(obj: unknown): JsonApiSchema {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid JSON API schema: must be an object');
  }

  const schema = obj as Record<string, unknown>;

  if (!Array.isArray(schema.serializers)) {
    throw new Error('Invalid JSON API schema: serializers must be an array');
  }

  return {
    serializers: schema.serializers.map(parseSerializer),
    version: typeof schema.version === 'string' ? schema.version : undefined,
    title: typeof schema.title === 'string' ? schema.title : undefined,
    description: typeof schema.description === 'string' ? schema.description : undefined,
    meta: schema.meta && typeof schema.meta === 'object' ? schema.meta as Record<string, unknown> : undefined,
  };
}

function parseSerializer(obj: unknown): JsonApiSerializer {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid serializer: must be an object');
  }

  const serializer = obj as Record<string, unknown>;

  if (typeof serializer.name !== 'string') {
    throw new Error('Invalid serializer: name must be a string');
  }

  if (!serializer.resource || typeof serializer.resource !== 'object') {
    throw new Error('Invalid serializer: resource must be an object');
  }

  const resource = serializer.resource as Record<string, unknown>;

  if (typeof resource.type !== 'string') {
    throw new Error('Invalid resource: type must be a string');
  }

  return {
    name: serializer.name,
    resource: {
      type: resource.type,
      attributes: Array.isArray(resource.attributes) ? resource.attributes.map(attr => ({
        name: (attr as any).name,
        type: (attr as any).type,
        nullable: (attr as any).nullable,
        description: (attr as any).description,
        format: (attr as any).format,
        enum: (attr as any).enum,
      })) : [],
      relationships: Array.isArray(resource.relationships) ? resource.relationships.map(rel => ({
        name: (rel as any).name,
        type: (rel as any).type,
        resource: (rel as any).resource,
        nullable: (rel as any).nullable,
        description: (rel as any).description,
        inverse: (rel as any).inverse,
      })) : [],
      description: typeof resource.description === 'string' ? resource.description : undefined,
      meta: resource.meta && typeof resource.meta === 'object' ? resource.meta as Record<string, unknown> : undefined,
    },
    version: typeof serializer.version === 'string' ? serializer.version : undefined,
    namespace: typeof serializer.namespace === 'string' ? serializer.namespace : undefined,
    description: typeof serializer.description === 'string' ? serializer.description : undefined,
    meta: serializer.meta && typeof serializer.meta === 'object' ? serializer.meta as Record<string, unknown> : undefined,
  };
}