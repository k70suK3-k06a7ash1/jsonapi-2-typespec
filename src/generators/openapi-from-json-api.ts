/**
 * OpenAPI generator from JSON API serializers
 */

import { JsonApiSchema, JsonApiSerializer, JsonApiAttribute, JsonApiRelationship } from '../json-api/types';
import { OpenApiSpec, OpenApiSchema, OpenApiOperation, GeneratorOptions } from './types';

export class OpenApiFromJsonApiGenerator {
  generate(schema: JsonApiSchema, options: GeneratorOptions = {}): OpenApiSpec {
    const spec: OpenApiSpec = {
      openapi: '3.0.3',
      info: {
        title: schema.title || 'JSON API Schema',
        version: schema.version || '1.0.0',
        description: schema.description,
      },
      servers: options.servers || [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server',
        },
      ],
      paths: {},
      components: {
        schemas: {},
      },
    };

    schema.serializers.forEach(serializer => {
      this.addResourceToSpec(spec, serializer, options);
    });

    return spec;
  }

  private addResourceToSpec(spec: OpenApiSpec, serializer: JsonApiSerializer, options: GeneratorOptions): void {
    const resourceType = serializer.resource.type;
    const resourcePath = `/${resourceType}`;
    const resourceIdPath = `${resourcePath}/{id}`;

    const resourceSchema = this.generateResourceSchema(serializer, options);
    const collectionSchema = this.generateCollectionSchema(serializer, options);

    if (spec.components?.schemas) {
      spec.components.schemas[this.pascalCase(resourceType)] = resourceSchema;
      spec.components.schemas[`${this.pascalCase(resourceType)}Collection`] = collectionSchema;
    }

    spec.paths[resourcePath] = {
      get: this.generateListOperation(serializer),
      post: this.generateCreateOperation(serializer),
    };

    spec.paths[resourceIdPath] = {
      get: this.generateGetOperation(serializer),
      patch: this.generateUpdateOperation(serializer),
      delete: this.generateDeleteOperation(serializer),
    };
  }

  private generateResourceSchema(serializer: JsonApiSerializer, options: GeneratorOptions): OpenApiSchema {
    if (options.jsonApiFormat) {
      return this.generateJsonApiResourceSchema(serializer);
    }

    const properties: Record<string, OpenApiSchema> = {
      id: {
        type: 'string',
        description: 'Unique identifier for the resource',
      },
      type: {
        type: 'string',
        enum: [serializer.resource.type],
        description: 'Resource type',
      },
    };

    const required = ['id', 'type'];

    serializer.resource.attributes.forEach(attr => {
      properties[attr.name] = this.convertAttributeToSchema(attr);
      if (!attr.nullable) {
        required.push(attr.name);
      }
    });

    serializer.resource.relationships.forEach(rel => {
      properties[rel.name] = this.convertRelationshipToSchema(rel);
      if (!rel.nullable) {
        required.push(rel.name);
      }
    });

    return {
      type: 'object',
      properties,
      required,
      description: serializer.description || serializer.resource.description,
    };
  }

  private generateJsonApiResourceSchema(serializer: JsonApiSerializer): OpenApiSchema {
    const attributeProperties: Record<string, OpenApiSchema> = {};
    const relationshipProperties: Record<string, OpenApiSchema> = {};

    serializer.resource.attributes.forEach(attr => {
      attributeProperties[attr.name] = this.convertAttributeToSchema(attr);
    });

    serializer.resource.relationships.forEach(rel => {
      relationshipProperties[rel.name] = {
        type: 'object',
        properties: {
          data: rel.type === 'has_many' 
            ? {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string', enum: [rel.resource] },
                  },
                  required: ['id', 'type'],
                },
              }
            : {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', enum: [rel.resource] },
                },
                required: ['id', 'type'],
              },
        },
        required: ['data'],
      };
    });

    return {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the resource',
        },
        type: {
          type: 'string',
          enum: [serializer.resource.type],
          description: 'Resource type',
        },
        attributes: {
          type: 'object',
          properties: attributeProperties,
        },
        relationships: {
          type: 'object',
          properties: relationshipProperties,
        },
      },
      required: ['id', 'type'],
      description: serializer.description || serializer.resource.description,
    };
  }

  private generateCollectionSchema(serializer: JsonApiSerializer, options: GeneratorOptions): OpenApiSchema {
    const resourceSchema = this.generateResourceSchema(serializer, options);

    if (options.jsonApiFormat) {
      return {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: resourceSchema,
          },
          meta: {
            type: 'object',
            description: 'Collection metadata',
          },
        },
        required: ['data'],
      };
    }

    return {
      type: 'array',
      items: resourceSchema,
    };
  }

  private convertAttributeToSchema(attribute: JsonApiAttribute): OpenApiSchema {
    const typeMapping: Record<string, { type: string; format?: string }> = {
      string: { type: 'string' },
      number: { type: 'number' },
      boolean: { type: 'boolean' },
      date: { type: 'string', format: 'date-time' },
      array: { type: 'array' },
      object: { type: 'object' },
    };

    const mapping = typeMapping[attribute.type] || { type: 'string' };

    const schema: OpenApiSchema = {
      type: mapping.type,
      format: mapping.format,
      description: attribute.description,
      nullable: attribute.nullable,
    };

    if (attribute.enum && attribute.enum.length > 0) {
      schema.enum = attribute.enum;
    }

    if (attribute.type === 'array') {
      schema.items = { type: 'string' };
    }

    return schema;
  }

  private convertRelationshipToSchema(relationship: JsonApiRelationship): OpenApiSchema {
    const relatedType = this.pascalCase(relationship.resource);

    if (relationship.type === 'has_many') {
      return {
        type: 'array',
        items: {
          $ref: `#/components/schemas/${relatedType}`,
        },
        description: relationship.description,
        nullable: relationship.nullable,
      };
    }

    return {
      $ref: `#/components/schemas/${relatedType}`,
      description: relationship.description,
      nullable: relationship.nullable,
    };
  }

  private generateListOperation(serializer: JsonApiSerializer): OpenApiOperation {
    const resourceType = serializer.resource.type;
    const collectionRef = `#/components/schemas/${this.pascalCase(resourceType)}Collection`;

    return {
      summary: `List ${resourceType} resources`,
      description: `Retrieve a list of ${resourceType} resources`,
      operationId: `list${this.pascalCase(resourceType)}`,
      responses: {
        '200': {
          description: `List of ${resourceType} resources`,
          content: {
            'application/vnd.api+json': {
              schema: { $ref: collectionRef },
            },
          },
        },
      },
      tags: [this.pascalCase(resourceType)],
    };
  }

  private generateCreateOperation(serializer: JsonApiSerializer): OpenApiOperation {
    const resourceType = serializer.resource.type;
    const resourceRef = `#/components/schemas/${this.pascalCase(resourceType)}`;

    return {
      summary: `Create ${resourceType} resource`,
      description: `Create a new ${resourceType} resource`,
      operationId: `create${this.pascalCase(resourceType)}`,
      requestBody: {
        required: true,
        content: {
          'application/vnd.api+json': {
            schema: { $ref: resourceRef },
          },
        },
      },
      responses: {
        '201': {
          description: `Created ${resourceType} resource`,
          content: {
            'application/vnd.api+json': {
              schema: { $ref: resourceRef },
            },
          },
        },
        '400': {
          description: 'Bad request',
        },
      },
      tags: [this.pascalCase(resourceType)],
    };
  }

  private generateGetOperation(serializer: JsonApiSerializer): OpenApiOperation {
    const resourceType = serializer.resource.type;
    const resourceRef = `#/components/schemas/${this.pascalCase(resourceType)}`;

    return {
      summary: `Get ${resourceType} resource`,
      description: `Retrieve a specific ${resourceType} resource`,
      operationId: `get${this.pascalCase(resourceType)}`,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: `The ${resourceType} ID`,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: `The ${resourceType} resource`,
          content: {
            'application/vnd.api+json': {
              schema: { $ref: resourceRef },
            },
          },
        },
        '404': {
          description: 'Resource not found',
        },
      },
      tags: [this.pascalCase(resourceType)],
    };
  }

  private generateUpdateOperation(serializer: JsonApiSerializer): OpenApiOperation {
    const resourceType = serializer.resource.type;
    const resourceRef = `#/components/schemas/${this.pascalCase(resourceType)}`;

    return {
      summary: `Update ${resourceType} resource`,
      description: `Update a specific ${resourceType} resource`,
      operationId: `update${this.pascalCase(resourceType)}`,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: `The ${resourceType} ID`,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/vnd.api+json': {
            schema: { $ref: resourceRef },
          },
        },
      },
      responses: {
        '200': {
          description: `Updated ${resourceType} resource`,
          content: {
            'application/vnd.api+json': {
              schema: { $ref: resourceRef },
            },
          },
        },
        '404': {
          description: 'Resource not found',
        },
      },
      tags: [this.pascalCase(resourceType)],
    };
  }

  private generateDeleteOperation(serializer: JsonApiSerializer): OpenApiOperation {
    const resourceType = serializer.resource.type;

    return {
      summary: `Delete ${resourceType} resource`,
      description: `Delete a specific ${resourceType} resource`,
      operationId: `delete${this.pascalCase(resourceType)}`,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: `The ${resourceType} ID`,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '204': {
          description: 'Resource deleted successfully',
        },
        '404': {
          description: 'Resource not found',
        },
      },
      tags: [this.pascalCase(resourceType)],
    };
  }

  private pascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}