/**
 * JSON API serializer utilities
 */

import { JsonApiSerializer, JsonApiResource, JsonApiAttribute, JsonApiRelationship } from './types';

export class JsonApiSerializerBuilder {
  private serializer: Partial<JsonApiSerializer> = {};

  constructor(name: string, type: string) {
    this.serializer = {
      name,
      resource: {
        type,
        attributes: [],
        relationships: [],
      },
    };
  }

  addAttribute(attribute: JsonApiAttribute): this {
    this.serializer.resource!.attributes.push(attribute);
    return this;
  }

  addRelationship(relationship: JsonApiRelationship): this {
    this.serializer.resource!.relationships.push(relationship);
    return this;
  }

  setDescription(description: string): this {
    this.serializer.description = description;
    return this;
  }

  setNamespace(namespace: string): this {
    this.serializer.namespace = namespace;
    return this;
  }

  setVersion(version: string): this {
    this.serializer.version = version;
    return this;
  }

  build(): JsonApiSerializer {
    if (!this.serializer.name || !this.serializer.resource) {
      throw new Error('Serializer name and resource are required');
    }
    return this.serializer as JsonApiSerializer;
  }
}

export function validateJsonApiSerializer(serializer: JsonApiSerializer): string[] {
  const errors: string[] = [];

  if (!serializer.name) {
    errors.push('Serializer name is required');
  }

  if (!serializer.resource) {
    errors.push('Serializer resource is required');
  } else {
    if (!serializer.resource.type) {
      errors.push('Resource type is required');
    }

    serializer.resource.attributes.forEach((attr, index) => {
      if (!attr.name) {
        errors.push(`Attribute at index ${index} is missing name`);
      }
      if (!attr.type) {
        errors.push(`Attribute '${attr.name}' is missing type`);
      }
    });

    serializer.resource.relationships.forEach((rel, index) => {
      if (!rel.name) {
        errors.push(`Relationship at index ${index} is missing name`);
      }
      if (!rel.type) {
        errors.push(`Relationship '${rel.name}' is missing type`);
      }
      if (!rel.resource) {
        errors.push(`Relationship '${rel.name}' is missing resource`);
      }
    });
  }

  return errors;
}