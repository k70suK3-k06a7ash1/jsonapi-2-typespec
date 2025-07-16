/**
 * TypeSpec definition types
 */

export interface TypeSpecProperty {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
  format?: string;
  constraints?: Record<string, unknown>;
}

export interface TypeSpecModel {
  name: string;
  properties: TypeSpecProperty[];
  extends?: string[];
  description?: string;
  decorators?: TypeSpecDecorator[];
}

export interface TypeSpecDecorator {
  name: string;
  arguments?: unknown[];
}

export interface TypeSpecOperation {
  name: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  parameters?: TypeSpecParameter[];
  requestBody?: TypeSpecRequestBody;
  responses: TypeSpecResponse[];
  description?: string;
  decorators?: TypeSpecDecorator[];
}

export interface TypeSpecParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  required?: boolean;
  description?: string;
}

export interface TypeSpecRequestBody {
  type: string;
  contentType?: string;
  description?: string;
}

export interface TypeSpecResponse {
  statusCode: number | 'default';
  type?: string;
  contentType?: string;
  description?: string;
}

export interface TypeSpecNamespace {
  name: string;
  models: TypeSpecModel[];
  operations: TypeSpecOperation[];
  imports?: string[];
  description?: string;
}

export interface TypeSpecDefinition {
  namespaces: TypeSpecNamespace[];
  imports?: string[];
  version?: string;
  title?: string;
  description?: string;
}