/**
 * Functional converters for Ruby to JSON API to TypeSpec pipeline
 */

import { RubySerializerClass } from './types';
import { JsonApiSchema, JsonApiSerializer, JsonApiAttribute, JsonApiRelationship } from '../json-api/types';
import { TypeSpecDefinition } from '../typespec/types';
import { JsonApiToTypeSpecConverter } from '../converters/json-api-to-typespec';
import { ConversionOptions } from '../converters/types';

export type ConversionPipeline<T, U> = (input: T) => U;
export type AsyncConversionPipeline<T, U> = (input: T) => Promise<U>;

/**
 * Convert Ruby serializer to JSON API schema
 */
export const rubyToJsonApiSchema: ConversionPipeline<RubySerializerClass[], JsonApiSchema> = (serializers) => {
  const jsonApiSerializers = serializers.map(rubyToJsonApiSerializer);
  
  return {
    title: 'Ruby Serializers API',
    version: '1.0.0',
    description: 'Generated from Ruby jsonapi-serializer classes',
    serializers: jsonApiSerializers,
  };
};

/**
 * Convert single Ruby serializer to JSON API serializer
 */
export const rubyToJsonApiSerializer: ConversionPipeline<RubySerializerClass, JsonApiSerializer> = (ruby) => {
  return {
    name: ruby.className,
    resource: {
      type: ruby.resourceType || inferResourceType(ruby.className),
      attributes: ruby.attributes.map(rubyToJsonApiAttribute),
      relationships: ruby.relationships.map(rubyToJsonApiRelationship),
      description: ruby.description,
    },
    description: `Generated from Ruby ${ruby.className}`,
    namespace: extractNamespace(ruby.className),
  };
};

/**
 * Convert Ruby attribute to JSON API attribute
 */
export const rubyToJsonApiAttribute: ConversionPipeline<import('./types').RubySerializerAttribute, JsonApiAttribute> = (ruby) => {
  return {
    name: ruby.name,
    type: mapRubyTypeToJsonApi(ruby.type || 'string'),
    nullable: ruby.block ? true : false, // Custom blocks might return nil
    description: ruby.description || `Attribute ${ruby.name}`,
  };
};

/**
 * Convert Ruby relationship to JSON API relationship
 */
export const rubyToJsonApiRelationship: ConversionPipeline<import('./types').RubySerializerRelationship, JsonApiRelationship> = (ruby) => {
  return {
    name: ruby.name,
    type: ruby.type,
    resource: ruby.recordType || ruby.name,
    description: ruby.description || `Relationship ${ruby.name}`,
  };
};

/**
 * Convert JSON API schema to TypeSpec using existing converter
 */
export const jsonApiToTypeSpec = (options: ConversionOptions = {}): ConversionPipeline<JsonApiSchema, TypeSpecDefinition> => {
  const converter = new JsonApiToTypeSpecConverter();
  
  return (schema: JsonApiSchema) => {
    const result = converter.convert(schema, {
      namespace: 'RubyApi',
      generateOperations: true,
      includeRelationships: true,
      ...options,
    });
    
    if (result.errors.length > 0) {
      throw new Error(`TypeSpec conversion failed: ${result.errors.join(', ')}`);
    }
    
    return result.data;
  };
};

/**
 * Compose the full pipeline: Ruby → JSON API → TypeSpec
 */
export const rubyToTypeSpecPipeline = (options: ConversionOptions = {}): ConversionPipeline<RubySerializerClass[], TypeSpecDefinition> => {
  return compose(
    rubyToJsonApiSchema,
    jsonApiToTypeSpec(options)
  );
};

/**
 * Function composition utility
 */
export const compose = <A, B, C>(f: ConversionPipeline<A, B>, g: ConversionPipeline<B, C>): ConversionPipeline<A, C> => {
  return (input: A) => g(f(input));
};

/**
 * Pipe utility for better readability
 */
export const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value);

/**
 * Helper functions
 */
const inferResourceType = (className: string): string => {
  // Convert UserSerializer -> users, PostSerializer -> posts
  const baseName = className.replace(/Serializer$/, '');
  return pluralize(camelToSnake(baseName));
};

const extractNamespace = (className: string): string => {
  // Extract namespace if present (e.g., Api::V1::UserSerializer -> Api::V1)
  const parts = className.split('::');
  return parts.length > 1 ? parts.slice(0, -1).join('::') : 'Api';
};

const mapRubyTypeToJsonApi = (rubyType: string): JsonApiAttribute['type'] => {
  const typeMap: Record<string, JsonApiAttribute['type']> = {
    'string': 'string',
    'integer': 'number',
    'number': 'number',
    'boolean': 'boolean',
    'date': 'date',
    'datetime': 'date',
    'array': 'array',
    'object': 'object',
    'hash': 'object',
  };
  
  return typeMap[rubyType.toLowerCase()] || 'string';
};

const camelToSnake = (str: string): string => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
};

const pluralize = (word: string): string => {
  // Simple pluralization rules
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es';
  }
  return word + 's';
};

/**
 * Export utility for generating YAML/JSON/TypeSpec output
 */
export type OutputFormat = 'json' | 'yaml' | 'typespec';

export const generateOutput = (format: OutputFormat) => 
  <T>(data: T): string => {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'yaml':
        // Import YAML stringify function
        const { stringify } = require('yaml');
        return stringify(data);
      case 'typespec':
        // For TypeSpec, we expect the data to be a TypeSpecDefinition
        const { TypeSpecGenerator } = require('../typespec');
        const generator = new TypeSpecGenerator();
        return generator.generateDefinition(data);
      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
  };

/**
 * Complete pipeline with output generation
 */
export const rubyToOutputPipeline = (
  format: OutputFormat, 
  options: ConversionOptions = {}
): ConversionPipeline<RubySerializerClass[], string> => {
  if (format === 'typespec') {
    return compose(
      rubyToTypeSpecPipeline(options),
      generateOutput(format)
    );
  } else {
    // For JSON/YAML, convert to JSON API schema first
    return compose(
      rubyToJsonApiSchema,
      generateOutput(format)
    );
  }
};