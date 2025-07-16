import { describe, it, expect } from 'vitest';
import { JsonApiSerializerBuilder, validateJsonApiSerializer } from '../../src/json-api/serializer';

describe('JsonApiSerializerBuilder', () => {
  it('should build a basic serializer', () => {
    const builder = new JsonApiSerializerBuilder('UserSerializer', 'users');
    
    const serializer = builder
      .addAttribute({
        name: 'email',
        type: 'string',
        description: 'User email address',
      })
      .addAttribute({
        name: 'age',
        type: 'number',
        nullable: true,
      })
      .setDescription('User resource serializer')
      .build();

    expect(serializer.name).toBe('UserSerializer');
    expect(serializer.resource.type).toBe('users');
    expect(serializer.resource.attributes).toHaveLength(2);
    expect(serializer.resource.attributes[0].name).toBe('email');
    expect(serializer.resource.attributes[1].name).toBe('age');
    expect(serializer.description).toBe('User resource serializer');
  });

  it('should add relationships correctly', () => {
    const builder = new JsonApiSerializerBuilder('PostSerializer', 'posts');
    
    const serializer = builder
      .addRelationship({
        name: 'author',
        type: 'belongs_to',
        resource: 'users',
        description: 'Post author',
      })
      .addRelationship({
        name: 'comments',
        type: 'has_many',
        resource: 'comments',
        nullable: true,
      })
      .build();

    expect(serializer.resource.relationships).toHaveLength(2);
    expect(serializer.resource.relationships[0].name).toBe('author');
    expect(serializer.resource.relationships[0].type).toBe('belongs_to');
    expect(serializer.resource.relationships[1].name).toBe('comments');
    expect(serializer.resource.relationships[1].type).toBe('has_many');
  });

  it('should throw error when building invalid serializer', () => {
    const builder = new JsonApiSerializerBuilder('', '');
    
    expect(() => builder.build()).toThrow('Serializer name and resource are required');
  });
});

describe('validateJsonApiSerializer', () => {
  it('should return no errors for valid serializer', () => {
    const serializer = new JsonApiSerializerBuilder('UserSerializer', 'users')
      .addAttribute({
        name: 'email',
        type: 'string',
      })
      .build();

    const errors = validateJsonApiSerializer(serializer);
    expect(errors).toHaveLength(0);
  });

  it('should return errors for invalid serializer', () => {
    const invalidSerializer = {
      name: '',
      resource: {
        type: '',
        attributes: [
          { name: '', type: 'string' },
          { name: 'valid', type: '' },
        ],
        relationships: [
          { name: '', type: 'has_one', resource: 'users' },
          { name: 'valid', type: '', resource: '' },
        ],
      },
    } as any;

    const errors = validateJsonApiSerializer(invalidSerializer);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('Serializer name is required');
    expect(errors).toContain('Resource type is required');
  });
});