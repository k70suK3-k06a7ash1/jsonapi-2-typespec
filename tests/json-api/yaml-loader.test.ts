import { describe, it, expect } from 'vitest';
import { YamlLoader } from '../../src/json-api/yaml-loader';
import type { JsonApiSchema } from '../../src/json-api/types';

describe('YamlLoader', () => {
  const sampleSchema: JsonApiSchema = {
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
          ],
          relationships: [
            {
              name: 'posts',
              type: 'has_many',
              resource: 'posts',
            },
          ],
        },
      },
    ],
  };

  const sampleYaml = `title: Test API
version: 1.0.0
serializers:
  - name: UserSerializer
    resource:
      type: users
      attributes:
        - name: email
          type: string
          description: User email address
        - name: age
          type: number
          nullable: true
      relationships:
        - name: posts
          type: has_many
          resource: posts`;

  describe('loadFromString', () => {
    it('should parse YAML string to JsonApiSchema', () => {
      const result = YamlLoader.loadFromString(sampleYaml);
      
      expect(result.title).toBe('Test API');
      expect(result.version).toBe('1.0.0');
      expect(result.serializers).toHaveLength(1);
      expect(result.serializers[0].name).toBe('UserSerializer');
      expect(result.serializers[0].resource.type).toBe('users');
      expect(result.serializers[0].resource.attributes).toHaveLength(2);
      expect(result.serializers[0].resource.relationships).toHaveLength(1);
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: content: [unclosed';
      
      expect(() => YamlLoader.loadFromString(invalidYaml)).toThrow('Failed to parse YAML content');
    });
  });

  describe('saveToString', () => {
    it('should convert JsonApiSchema to YAML string', () => {
      const yamlString = YamlLoader.saveToString(sampleSchema);
      
      expect(yamlString).toContain('title: Test API');
      expect(yamlString).toContain('version: 1.0.0');
      expect(yamlString).toContain('serializers:');
      expect(yamlString).toContain('- name: UserSerializer');
      expect(yamlString).toContain('type: users');
    });

    it('should produce valid YAML that can be parsed back', () => {
      const yamlString = YamlLoader.saveToString(sampleSchema);
      const parsedBack = YamlLoader.loadFromString(yamlString);
      
      expect(parsedBack).toEqual(sampleSchema);
    });
  });

  describe('isYamlFile', () => {
    it('should detect YAML files by extension', () => {
      expect(YamlLoader.isYamlFile('schema.yml')).toBe(true);
      expect(YamlLoader.isYamlFile('schema.yaml')).toBe(true);
      expect(YamlLoader.isYamlFile('SCHEMA.YML')).toBe(true);
      expect(YamlLoader.isYamlFile('schema.json')).toBe(false);
      expect(YamlLoader.isYamlFile('schema.txt')).toBe(false);
      expect(YamlLoader.isYamlFile('schema')).toBe(false);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain data integrity through YAML conversion', () => {
      const yamlString = YamlLoader.saveToString(sampleSchema);
      const convertedBack = YamlLoader.loadFromString(yamlString);
      
      expect(convertedBack).toEqual(sampleSchema);
    });
  });
});