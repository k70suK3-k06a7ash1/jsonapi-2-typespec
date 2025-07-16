/**
 * OpenAPI generator from TypeSpec definitions
 */

import { 
  TypeSpecDefinition, 
  TypeSpecModel, 
  TypeSpecOperation, 
  TypeSpecProperty,
  TypeSpecParameter,
  TypeSpecResponse 
} from '../typespec/types';
import { OpenApiSpec, OpenApiSchema, OpenApiOperation, OpenApiParameter, GeneratorOptions } from './types';

export class OpenApiFromTypeSpecGenerator {
  generate(definition: TypeSpecDefinition, options: GeneratorOptions = {}): OpenApiSpec {
    const spec: OpenApiSpec = {
      openapi: '3.0.3',
      info: {
        title: definition.title || 'TypeSpec API',
        version: definition.version || '1.0.0',
        description: definition.description,
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

    definition.namespaces.forEach(namespace => {
      namespace.models.forEach(model => {
        this.addModelToComponents(spec, model);
      });

      namespace.operations.forEach(operation => {
        this.addOperationToPath(spec, operation);
      });
    });

    return spec;
  }

  private addModelToComponents(spec: OpenApiSpec, model: TypeSpecModel): void {
    if (!spec.components?.schemas) return;

    const schema = this.convertModelToSchema(model);
    spec.components.schemas[model.name] = schema;
  }

  private convertModelToSchema(model: TypeSpecModel): OpenApiSchema {
    const properties: Record<string, OpenApiSchema> = {};
    const required: string[] = [];

    model.properties.forEach(property => {
      properties[property.name] = this.convertPropertyToSchema(property);
      if (!property.optional) {
        required.push(property.name);
      }
    });

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      description: model.description,
    };
  }

  private convertPropertyToSchema(property: TypeSpecProperty): OpenApiSchema {
    let type = property.type;
    let nullable = false;

    if (type.includes(' | null')) {
      nullable = true;
      type = type.replace(' | null', '').trim();
    }

    if (type.includes(' | ')) {
      const unionTypes = type.split(' | ').map(t => t.trim().replace(/"/g, ''));
      return {
        type: 'string',
        enum: unionTypes,
        description: property.description,
        nullable,
      };
    }

    if (type.endsWith('[]')) {
      const itemType = type.slice(0, -2);
      return {
        type: 'array',
        items: this.getSchemaForType(itemType),
        description: property.description,
        nullable,
      };
    }

    return {
      ...this.getSchemaForType(type),
      description: property.description,
      nullable: nullable || undefined,
    };
  }

  private getSchemaForType(type: string): OpenApiSchema {
    const typeMapping: Record<string, OpenApiSchema> = {
      string: { type: 'string' },
      int32: { type: 'integer', format: 'int32' },
      int64: { type: 'integer', format: 'int64' },
      float32: { type: 'number', format: 'float' },
      float64: { type: 'number', format: 'double' },
      boolean: { type: 'boolean' },
      utcDateTime: { type: 'string', format: 'date-time' },
      plainDate: { type: 'string', format: 'date' },
      plainTime: { type: 'string', format: 'time' },
      bytes: { type: 'string', format: 'byte' },
      url: { type: 'string', format: 'uri' },
      unknown: {},
    };

    if (typeMapping[type]) {
      return typeMapping[type];
    }

    if (type.startsWith('Record<')) {
      return { type: 'object' };
    }

    return { $ref: `#/components/schemas/${type}` };
  }

  private addOperationToPath(spec: OpenApiSpec, operation: TypeSpecOperation): void {
    if (!spec.paths[operation.path]) {
      spec.paths[operation.path] = {};
    }

    const openApiOperation = this.convertOperation(operation);
    spec.paths[operation.path][operation.method] = openApiOperation;
  }

  private convertOperation(operation: TypeSpecOperation): OpenApiOperation {
    const openApiOp: OpenApiOperation = {
      summary: operation.name,
      description: operation.description,
      operationId: operation.name,
      responses: this.convertResponses(operation.responses),
    };

    if (operation.parameters && operation.parameters.length > 0) {
      openApiOp.parameters = operation.parameters.map(param => this.convertParameter(param));
    }

    if (operation.requestBody) {
      openApiOp.requestBody = {
        description: operation.requestBody.description,
        required: true,
        content: {
          [operation.requestBody.contentType || 'application/json']: {
            schema: this.getSchemaForType(operation.requestBody.type),
          },
        },
      };
    }

    return openApiOp;
  }

  private convertParameter(param: TypeSpecParameter): OpenApiParameter {
    return {
      name: param.name,
      in: param.in,
      required: param.required,
      description: param.description,
      schema: this.getSchemaForType(param.type),
    };
  }

  private convertResponses(responses: TypeSpecResponse[]): Record<string, any> {
    const openApiResponses: Record<string, any> = {};

    responses.forEach(response => {
      const statusCode = response.statusCode === 'default' ? 'default' : response.statusCode.toString();
      
      openApiResponses[statusCode] = {
        description: response.description || `Response ${statusCode}`,
      };

      if (response.type) {
        openApiResponses[statusCode].content = {
          [response.contentType || 'application/json']: {
            schema: this.getSchemaForType(response.type),
          },
        };
      }
    });

    return openApiResponses;
  }
}