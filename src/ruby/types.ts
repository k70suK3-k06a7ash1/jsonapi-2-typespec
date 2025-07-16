/**
 * Ruby jsonapi-serializer types and definitions
 */

export interface RubySerializerAttribute {
  name: string;
  type?: string;
  block?: string;
  description?: string;
  customName?: string; // For attributes with different method names
}

export interface RubySerializerRelationship {
  name: string;
  type: 'has_many' | 'belongs_to' | 'has_one';
  className?: string;
  recordType?: string;
  description?: string;
}

export interface RubySerializerClass {
  className: string;
  resourceType?: string; // from set_type
  idField?: string; // from set_id
  attributes: RubySerializerAttribute[];
  relationships: RubySerializerRelationship[];
  cacheOptions?: Record<string, unknown>;
  description?: string;
  filePath?: string;
}

export interface RubySerializerProject {
  serializers: RubySerializerClass[];
  projectName?: string;
  description?: string;
}

export interface RubyParseResult {
  data: RubySerializerProject;
  warnings: string[];
  errors: string[];
}