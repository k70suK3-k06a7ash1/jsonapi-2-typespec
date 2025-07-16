/**
 * JSON API serializer type definitions
 */

export interface JsonApiAttribute {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  nullable?: boolean;
  description?: string;
  format?: string;
  enum?: string[];
}

export interface JsonApiRelationship {
  name: string;
  type: 'has_one' | 'has_many' | 'belongs_to';
  resource: string;
  nullable?: boolean;
  description?: string;
  inverse?: string;
}

export interface JsonApiResource {
  type: string;
  attributes: JsonApiAttribute[];
  relationships: JsonApiRelationship[];
  description?: string;
  meta?: Record<string, unknown>;
}

export interface JsonApiSerializer {
  name: string;
  resource: JsonApiResource;
  version?: string;
  namespace?: string;
  description?: string;
  meta?: Record<string, unknown>;
}

export interface JsonApiSchema {
  serializers: JsonApiSerializer[];
  version?: string;
  title?: string;
  description?: string;
  meta?: Record<string, unknown>;
}