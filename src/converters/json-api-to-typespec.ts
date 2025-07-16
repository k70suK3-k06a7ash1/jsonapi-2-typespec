/**
 * JSON API to TypeSpec converter
 */

import { JsonApiSchema, JsonApiSerializer, JsonApiAttribute, JsonApiRelationship } from '../json-api/types';
import { 
  TypeSpecDefinition, 
  TypeSpecNamespace, 
  TypeSpecModel, 
  TypeSpecProperty, 
  TypeSpecOperation,
  TypeSpecDecorator 
} from '../typespec/types';
import { ConversionOptions, JsonApiToTypeSpecResult } from './types';

export class JsonApiToTypeSpecConverter {
  convert(jsonApiSchema: JsonApiSchema, options: ConversionOptions = {}): JsonApiToTypeSpecResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const definition = this.convertSchema(jsonApiSchema, options, warnings);
      
      return {
        data: definition,
        warnings,
        errors,
      };
    } catch (error) {
      errors.push(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        data: { namespaces: [] },
        warnings,
        errors,
      };
    }
  }

  private convertSchema(schema: JsonApiSchema, options: ConversionOptions, warnings: string[]): TypeSpecDefinition {
    const namespace: TypeSpecNamespace = {
      name: options.namespace || 'JsonApi',
      models: [],
      operations: [],
      imports: ['@typespec/rest', '@typespec/openapi3'],
    };

    schema.serializers.forEach(serializer => {
      try {
        const model = this.convertSerializer(serializer, options, warnings);
        namespace.models.push(model);

        if (options.generateOperations) {
          const operations = this.generateOperationsForResource(serializer);
          namespace.operations.push(...operations);
        }
      } catch (error) {
        warnings.push(`Failed to convert serializer '${serializer.name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    return {
      namespaces: [namespace],
      imports: ['@typespec/rest', '@typespec/openapi3'],
      title: options.title || schema.title || 'JSON API Schema',
      version: options.version || schema.version || '1.0.0',
      description: options.description || schema.description,
    };
  }

  private convertSerializer(serializer: JsonApiSerializer, options: ConversionOptions, warnings: string[]): TypeSpecModel {
    const properties: TypeSpecProperty[] = [];

    serializer.resource.attributes.forEach(attr => {
      try {
        const property = this.convertAttribute(attr);
        properties.push(property);
      } catch (error) {
        warnings.push(`Failed to convert attribute '${attr.name}' in '${serializer.name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    if (options.includeRelationships !== false) {
      serializer.resource.relationships.forEach(rel => {
        try {
          const property = this.convertRelationship(rel);
          properties.push(property);
        } catch (error) {
          warnings.push(`Failed to convert relationship '${rel.name}' in '${serializer.name}': ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }

    const decorators: TypeSpecDecorator[] = [
      { name: 'discriminator', arguments: ['type'] },
    ];

    return {
      name: this.pascalCase(serializer.resource.type),
      properties,
      description: serializer.description || serializer.resource.description,
      decorators,
    };
  }

  private convertAttribute(attribute: JsonApiAttribute): TypeSpecProperty {
    const typeMapping: Record<string, string> = {
      string: 'string',
      number: 'float64',
      boolean: 'boolean',
      date: 'utcDateTime',
      array: 'unknown[]',
      object: 'Record<unknown>',
    };

    let type = typeMapping[attribute.type] || 'unknown';

    if (attribute.enum && attribute.enum.length > 0) {
      type = attribute.enum.map(val => `"${val}"`).join(' | ');
    }

    if (attribute.nullable) {
      type = `${type} | null`;
    }

    return {
      name: attribute.name,
      type,
      optional: attribute.nullable,
      description: attribute.description,
    };
  }

  private convertRelationship(relationship: JsonApiRelationship): TypeSpecProperty {
    const resourceType = this.pascalCase(relationship.resource);
    
    let type: string;
    switch (relationship.type) {
      case 'has_one':
      case 'belongs_to':
        type = resourceType;
        break;
      case 'has_many':
        type = `${resourceType}[]`;
        break;
      default:
        type = 'unknown';
    }

    if (relationship.nullable) {
      type = `${type} | null`;
    }

    return {
      name: relationship.name,
      type,
      optional: relationship.nullable,
      description: relationship.description,
    };
  }

  private generateOperationsForResource(serializer: JsonApiSerializer): TypeSpecOperation[] {
    const resourceName = this.pascalCase(serializer.resource.type);
    const resourcePath = `/${serializer.resource.type}`;

    return [
      {
        name: `list${resourceName}`,
        method: 'get',
        path: resourcePath,
        responses: [
          {
            statusCode: 200,
            type: `${resourceName}[]`,
            description: `List of ${serializer.resource.type} resources`,
          },
        ],
        description: `List all ${serializer.resource.type} resources`,
      },
      {
        name: `get${resourceName}`,
        method: 'get',
        path: `${resourcePath}/{id}`,
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: `The ${serializer.resource.type} ID`,
          },
        ],
        responses: [
          {
            statusCode: 200,
            type: resourceName,
            description: `The ${serializer.resource.type} resource`,
          },
          {
            statusCode: 404,
            description: 'Resource not found',
          },
        ],
        description: `Get a specific ${serializer.resource.type} resource`,
      },
      {
        name: `create${resourceName}`,
        method: 'post',
        path: resourcePath,
        requestBody: {
          type: resourceName,
          description: `The ${serializer.resource.type} resource to create`,
        },
        responses: [
          {
            statusCode: 201,
            type: resourceName,
            description: `The created ${serializer.resource.type} resource`,
          },
          {
            statusCode: 400,
            description: 'Bad request',
          },
        ],
        description: `Create a new ${serializer.resource.type} resource`,
      },
      {
        name: `update${resourceName}`,
        method: 'patch',
        path: `${resourcePath}/{id}`,
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: `The ${serializer.resource.type} ID`,
          },
        ],
        requestBody: {
          type: resourceName,
          description: `The ${serializer.resource.type} resource updates`,
        },
        responses: [
          {
            statusCode: 200,
            type: resourceName,
            description: `The updated ${serializer.resource.type} resource`,
          },
          {
            statusCode: 404,
            description: 'Resource not found',
          },
        ],
        description: `Update a ${serializer.resource.type} resource`,
      },
      {
        name: `delete${resourceName}`,
        method: 'delete',
        path: `${resourcePath}/{id}`,
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: `The ${serializer.resource.type} ID`,
          },
        ],
        responses: [
          {
            statusCode: 204,
            description: 'Resource deleted successfully',
          },
          {
            statusCode: 404,
            description: 'Resource not found',
          },
        ],
        description: `Delete a ${serializer.resource.type} resource`,
      },
    ];
  }

  private pascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}