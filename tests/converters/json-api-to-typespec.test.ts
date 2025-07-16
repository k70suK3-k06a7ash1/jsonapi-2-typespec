import { describe, it, expect } from 'vitest';
import { JsonApiToTypeSpecConverter } from '../../src/converters/json-api-to-typespec';
import type { JsonApiSchema } from '../../src/json-api/types';

describe('JsonApiToTypeSpecConverter', () => {
  const converter = new JsonApiToTypeSpecConverter();

  const sampleJsonApiSchema: JsonApiSchema = {
    title: 'Test API',
    version: '1.0.0',
    serializers: [
      {
        name: 'UserSerializer',
        resource: {
          type: 'users',
          attributes: [
            {
              name: 'email',
              type: 'string',
              description: 'User email address',
            },
            {
              name: 'age',
              type: 'number',
              nullable: true,
            },
            {
              name: 'status',
              type: 'string',
              enum: ['active', 'inactive'],
            },
          ],
          relationships: [
            {
              name: 'posts',
              type: 'has_many',
              resource: 'posts',
              description: 'User posts',
            },
          ],
          description: 'User resource',
        },
        description: 'User serializer',
      },
    ],
  };

  it('should convert JSON API schema to TypeSpec definition', () => {
    const result = converter.convert(sampleJsonApiSchema);

    expect(result.errors).toHaveLength(0);
    expect(result.data.namespaces).toHaveLength(1);
    
    const namespace = result.data.namespaces[0];
    expect(namespace.name).toBe('JsonApi');
    expect(namespace.models).toHaveLength(1);
    
    const model = namespace.models[0];
    expect(model.name).toBe('Users');
    expect(model.properties).toHaveLength(4); // email, age, status, posts
  });

  it('should handle conversion options', () => {
    const result = converter.convert(sampleJsonApiSchema, {
      namespace: 'CustomNamespace',
      generateOperations: true,
      title: 'Custom API',
    });

    expect(result.errors).toHaveLength(0);
    expect(result.data.namespaces[0].name).toBe('CustomNamespace');
    expect(result.data.title).toBe('Custom API');
    expect(result.data.namespaces[0].operations.length).toBeGreaterThan(0);
  });

  it('should convert attributes with correct types', () => {
    const result = converter.convert(sampleJsonApiSchema);
    const model = result.data.namespaces[0].models[0];
    
    const emailProp = model.properties.find(p => p.name === 'email');
    expect(emailProp?.type).toBe('string');
    
    const ageProp = model.properties.find(p => p.name === 'age');
    expect(ageProp?.type).toBe('float64 | null');
    expect(ageProp?.optional).toBe(true);
    
    const statusProp = model.properties.find(p => p.name === 'status');
    expect(statusProp?.type).toBe('"active" | "inactive"');
  });

  it('should convert relationships correctly', () => {
    const result = converter.convert(sampleJsonApiSchema, {
      includeRelationships: true,
    });
    
    const model = result.data.namespaces[0].models[0];
    const postsProp = model.properties.find(p => p.name === 'posts');
    
    expect(postsProp).toBeDefined();
    expect(postsProp?.type).toBe('Posts[]');
  });

  it('should exclude relationships when option is false', () => {
    const result = converter.convert(sampleJsonApiSchema, {
      includeRelationships: false,
    });
    
    const model = result.data.namespaces[0].models[0];
    const postsProp = model.properties.find(p => p.name === 'posts');
    
    expect(postsProp).toBeUndefined();
  });

  it('should handle conversion errors gracefully', () => {
    const invalidSchema = {
      serializers: [
        {
          name: null,
          resource: null,
        },
      ],
    } as any;

    const result = converter.convert(invalidSchema);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.data.namespaces).toHaveLength(1);
  });
});