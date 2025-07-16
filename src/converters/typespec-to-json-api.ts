/**
 * TypeSpec to JSON API converter
 */

import { TypeSpecDefinition, TypeSpecModel, TypeSpecProperty } from '../typespec/types';
import { 
  JsonApiSchema, 
  JsonApiSerializer, 
  JsonApiResource,
  JsonApiAttribute, 
  JsonApiRelationship 
} from '../json-api/types';
import { ConversionOptions, TypeSpecToJsonApiResult } from './types';

export class TypeSpecToJsonApiConverter {
  convert(typeSpecDefinition: TypeSpecDefinition, options: ConversionOptions = {}): TypeSpecToJsonApiResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const schema = this.convertDefinition(typeSpecDefinition, options, warnings);
      
      return {
        data: schema,
        warnings,
        errors,
      };
    } catch (error) {
      errors.push(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        data: { serializers: [] },
        warnings,
        errors,
      };
    }
  }

  private convertDefinition(definition: TypeSpecDefinition, options: ConversionOptions, warnings: string[]): JsonApiSchema {
    const serializers: JsonApiSerializer[] = [];

    definition.namespaces.forEach(namespace => {
      namespace.models.forEach(model => {
        try {
          const serializer = this.convertModel(model, options, warnings);
          if (serializer) {
            serializers.push(serializer);
          }
        } catch (error) {
          warnings.push(`Failed to convert model '${model.name}': ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    });

    return {
      serializers,
      title: options.title || definition.title,
      version: options.version || definition.version,
      description: options.description || definition.description,
    };
  }

  private convertModel(model: TypeSpecModel, options: ConversionOptions, warnings: string[]): JsonApiSerializer | null {
    const attributes: JsonApiAttribute[] = [];
    const relationships: JsonApiRelationship[] = [];

    model.properties.forEach(property => {
      try {
        if (this.isRelationshipProperty(property)) {
          const relationship = this.convertToRelationship(property);
          if (relationship) {
            relationships.push(relationship);
          }
        } else {
          const attribute = this.convertToAttribute(property);
          if (attribute) {
            attributes.push(attribute);
          }
        }
      } catch (error) {
        warnings.push(`Failed to convert property '${property.name}' in model '${model.name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    const resourceType = this.camelCase(model.name);

    const resource: JsonApiResource = {
      type: resourceType,
      attributes,
      relationships,
      description: model.description,
    };

    return {
      name: `${model.name}Serializer`,
      resource,
      description: model.description,
      namespace: options.namespace,
      version: options.version,
    };
  }

  private convertToAttribute(property: TypeSpecProperty): JsonApiAttribute | null {
    const typeMapping: Record<string, JsonApiAttribute['type']> = {
      string: 'string',
      int32: 'number',
      int64: 'number',
      float32: 'number',
      float64: 'number',
      boolean: 'boolean',
      utcDateTime: 'date',
      plainDate: 'date',
      plainTime: 'string',
    };

    let type = property.type;
    let nullable = property.optional || false;
    let enumValues: string[] | undefined;

    if (type.includes(' | null')) {
      nullable = true;
      type = type.replace(' | null', '');
    }

    if (type.includes(' | ')) {
      const unionTypes = type.split(' | ').map(t => t.trim().replace(/"/g, ''));
      if (unionTypes.every(t => t.startsWith('"') || typeof t === 'string')) {
        enumValues = unionTypes;
        type = 'string';
      }
    }

    if (type.endsWith('[]')) {
      return null;
    }

    if (type.startsWith('Record<')) {
      type = 'object';
    }

    const mappedType = typeMapping[type] || 'string';

    return {
      name: property.name,
      type: mappedType,
      nullable,
      description: property.description,
      enum: enumValues,
    };
  }

  private convertToRelationship(property: TypeSpecProperty): JsonApiRelationship | null {
    let type = property.type;
    let nullable = property.optional || false;
    let relationshipType: JsonApiRelationship['type'];

    if (type.includes(' | null')) {
      nullable = true;
      type = type.replace(' | null', '');
    }

    if (type.endsWith('[]')) {
      relationshipType = 'has_many';
      type = type.slice(0, -2);
    } else {
      relationshipType = 'has_one';
    }

    const resourceType = this.camelCase(type);

    return {
      name: property.name,
      type: relationshipType,
      resource: resourceType,
      nullable,
      description: property.description,
    };
  }

  private isRelationshipProperty(property: TypeSpecProperty): boolean {
    const type = property.type.replace(' | null', '');
    
    if (type.endsWith('[]')) {
      const baseType = type.slice(0, -2);
      return this.isCustomType(baseType);
    }
    
    return this.isCustomType(type);
  }

  private isCustomType(type: string): boolean {
    const primitiveTypes = [
      'string', 'number', 'boolean', 'object', 'unknown',
      'int32', 'int64', 'float32', 'float64',
      'utcDateTime', 'plainDate', 'plainTime',
      'Record<unknown>', 'unknown[]'
    ];

    return !primitiveTypes.includes(type) && 
           !type.startsWith('Record<') && 
           !type.includes(' | ') &&
           type.charAt(0) === type.charAt(0).toUpperCase();
  }

  private camelCase(str: string): string {
    const pascalCase = str.charAt(0).toUpperCase() + str.slice(1);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }
}