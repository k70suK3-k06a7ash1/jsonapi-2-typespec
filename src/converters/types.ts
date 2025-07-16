/**
 * Converter types and interfaces
 */

export interface ConversionOptions {
  namespace?: string;
  includeRelationships?: boolean;
  generateOperations?: boolean;
  version?: string;
  title?: string;
  description?: string;
}

export interface ConversionResult<T> {
  data: T;
  warnings: string[];
  errors: string[];
}

export type JsonApiToTypeSpecResult = ConversionResult<import('../typespec/types').TypeSpecDefinition>;
export type TypeSpecToJsonApiResult = ConversionResult<import('../json-api/types').JsonApiSchema>;