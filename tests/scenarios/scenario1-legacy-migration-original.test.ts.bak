/**
 * Test Suite for Scenario 1: Legacy Rails API Migration to TypeSpec
 * Based on USER_SCENARIOS.md - Legacy migration scenario
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Ruby, TypeSpec, Generators } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Scenario 1: Legacy Rails API Migration', () => {
  let tempDir: string;
  
  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-migration-test-'));
  });
  
  afterEach(() => {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Legacy User Serializer Migration', () => {
    const legacyUserSerializer = `
module Api
  module V1
    class UserSerializer
      include JSONAPI::Serializer
      
      set_type :users
      set_id :id
      
      attributes :email, :name, :created_at, :updated_at
      
      attribute :avatar_url do |user|
        user.avatar.present? ? user.avatar.url : nil
      end
      
      attribute :subscription_status do |user|
        user.subscription&.status || 'free'
      end
      
      has_many :projects
      belongs_to :organization
    end
  end
end
    `.trim();

    it('should parse legacy Ruby serializer correctly', () => {
      // Arrange
      const serializerPath = path.join(tempDir, 'user_serializer.rb');
      fs.writeFileSync(serializerPath, legacyUserSerializer);

      // Act
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(serializerPath);

      // Assert
      expect(parsedSerializer.className).toBe('UserSerializer');
      expect(parsedSerializer.namespace).toBe('Api::V1');
      expect(parsedSerializer.resourceType).toBe('users');
      expect(parsedSerializer.attributes).toHaveLength(6); // email, name, created_at, updated_at, avatar_url, subscription_status
      expect(parsedSerializer.relationships).toHaveLength(2); // projects, organization
      
      // Check specific attributes
      const emailAttr = parsedSerializer.attributes.find(a => a.name === 'email');
      expect(emailAttr).toBeDefined();
      expect(emailAttr?.type).toBe('string');
      
      const avatarUrlAttr = parsedSerializer.attributes.find(a => a.name === 'avatar_url');
      expect(avatarUrlAttr).toBeDefined();
      expect(avatarUrlAttr?.customMethod).toBe(true);
      
      // Check relationships
      const projectsRel = parsedSerializer.relationships.find(r => r.name === 'projects');
      expect(projectsRel).toBeDefined();
      expect(projectsRel?.type).toBe('has_many');
      
      const orgRel = parsedSerializer.relationships.find(r => r.name === 'organization');
      expect(orgRel).toBeDefined();
      expect(orgRel?.type).toBe('belongs_to');
    });

    it('should convert legacy serializer to JSON API schema', () => {
      // Arrange
      const serializerPath = path.join(tempDir, 'user_serializer.rb');
      fs.writeFileSync(serializerPath, legacyUserSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(serializerPath);

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);

      // Assert
      expect(jsonApiSchema.title).toBe('Generated from Ruby jsonapi-serializer classes');
      expect(jsonApiSchema.serializers).toHaveLength(1);
      
      const userSerializer = jsonApiSchema.serializers[0];
      expect(userSerializer.name).toBe('UserSerializer');
      expect(userSerializer.namespace).toBe('Api::V1');
      expect(userSerializer.resource.type).toBe('users');
      expect(userSerializer.resource.attributes).toHaveLength(6);
      expect(userSerializer.resource.relationships).toHaveLength(2);
    });

    it('should generate TypeSpec from legacy serializer using functional pipeline', () => {
      // Arrange
      const serializerPath = path.join(tempDir, 'user_serializer.rb');
      fs.writeFileSync(serializerPath, legacyUserSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(serializerPath);

      // Act
      const typeSpecPipeline = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'ApiV1',
        generateOperations: true,
        includeRelationships: true,
        title: 'Legacy API v1',
        version: '1.0.0',
      });

      const typeSpecCode = typeSpecPipeline([parsedSerializer]);

      // Assert
      expect(typeSpecCode).toContain('namespace ApiV1');
      expect(typeSpecCode).toContain('model Users');
      expect(typeSpecCode).toContain('email: string');
      expect(typeSpecCode).toContain('avatar_url: string');
      expect(typeSpecCode).toContain('subscription_status: string');
      expect(typeSpecCode).toContain('projects: Projects[]');
      expect(typeSpecCode).toContain('organization: Organizations');
      expect(typeSpecCode).toContain('@route("/users")');
      expect(typeSpecCode).toContain('op listUsers()');
      expect(typeSpecCode).toContain('op getUsers(id: string)');
    });

    it('should maintain API compatibility during migration', () => {
      // Arrange
      const serializerPath = path.join(tempDir, 'user_serializer.rb');
      fs.writeFileSync(serializerPath, legacyUserSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(serializerPath);

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
      const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
      const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
        jsonApiFormat: true,
        servers: [{ url: 'https://api.mycompany.com/v1', description: 'Production API' }]
      });

      // Assert - Check that all original API elements are preserved
      expect(openApiSpec.info.title).toBeDefined();
      expect(openApiSpec.paths['/users']).toBeDefined();
      expect(openApiSpec.paths['/users/{id}']).toBeDefined();
      expect(openApiSpec.components.schemas.Users).toBeDefined();
      
      const userSchema = openApiSpec.components.schemas.Users;
      expect(userSchema.properties.email).toBeDefined();
      expect(userSchema.properties.avatar_url).toBeDefined();
      expect(userSchema.properties.subscription_status).toBeDefined();
      expect(userSchema.required).toContain('email');
      expect(userSchema.required).toContain('name');
    });
  });

  describe('Multiple Serializer Migration', () => {
    const projectSerializer = `
module Api
  module V1
    class ProjectSerializer
      include JSONAPI::Serializer
      
      set_type :projects
      set_id :uuid
      
      attributes :name, :description, :status, :created_at
      
      belongs_to :user
      has_many :tasks
    end
  end
end
    `.trim();

    const organizationSerializer = `
module Api
  module V1
    class OrganizationSerializer
      include JSONAPI::Serializer
      
      set_type :organizations
      set_id :id
      
      attributes :name, :slug, :plan
      
      has_many :users
      has_many :projects
    end
  end
end
    `.trim();

    it('should migrate multiple related serializers', () => {
      // Arrange
      const userPath = path.join(tempDir, 'user_serializer.rb');
      const projectPath = path.join(tempDir, 'project_serializer.rb');
      const orgPath = path.join(tempDir, 'organization_serializer.rb');
      
      const legacyUserSerializer = `
module Api
  module V1
    class UserSerializer
      include JSONAPI::Serializer
      set_type :users
      attributes :email, :name
      has_many :projects
      belongs_to :organization
    end
  end
end
      `.trim();
      
      fs.writeFileSync(userPath, legacyUserSerializer);
      fs.writeFileSync(projectPath, projectSerializer);
      fs.writeFileSync(orgPath, organizationSerializer);

      // Act
      const serializers = [userPath, projectPath, orgPath].map(file => 
        Ruby.RubySerializerParser.parseFile(file)
      );

      const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
      const typeSpecConverter = Ruby.jsonApiToTypeSpec({
        namespace: 'ApiV1',
        generateOperations: true,
        title: 'Legacy API v1',
        version: '1.0.0',
      });

      const typeSpecDefinition = typeSpecConverter(jsonApiSchema);

      // Assert
      expect(jsonApiSchema.serializers).toHaveLength(3);
      expect(typeSpecDefinition.namespaces[0].models).toHaveLength(3);
      expect(typeSpecDefinition.namespaces[0].operations.length).toBeGreaterThan(0);
      
      // Check relationships are preserved
      const userModel = typeSpecDefinition.namespaces[0].models.find(m => m.name === 'Users');
      expect(userModel?.properties.some(p => p.name === 'projects')).toBe(true);
      expect(userModel?.properties.some(p => p.name === 'organization')).toBe(true);
    });

    it('should generate comprehensive documentation for migrated API', () => {
      // Arrange
      const serializers = [projectSerializer, organizationSerializer].map((content, index) => {
        const filePath = path.join(tempDir, `serializer_${index}.rb`);
        fs.writeFileSync(filePath, content);
        return Ruby.RubySerializerParser.parseFile(filePath);
      });

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
      const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
      const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
        servers: [
          { url: 'https://api.mycompany.com/v1', description: 'Production' },
          { url: 'https://staging.mycompany.com/v1', description: 'Staging' }
        ]
      });

      // Assert
      expect(Object.keys(openApiSpec.paths)).toHaveLength(6); // 3 resources × 2 operations each
      expect(openApiSpec.servers).toHaveLength(2);
      expect(openApiSpec.components.schemas).toHaveProperty('Projects');
      expect(openApiSpec.components.schemas).toHaveProperty('Organizations');
      
      // Check that migration preserved all attributes
      const projectSchema = openApiSpec.components.schemas.Projects;
      expect(projectSchema.properties).toHaveProperty('name');
      expect(projectSchema.properties).toHaveProperty('description');
      expect(projectSchema.properties).toHaveProperty('status');
    });
  });

  describe('Migration Performance and Validation', () => {
    it('should complete migration quickly for multiple serializers', async () => {
      // Arrange
      const serializers = Array.from({ length: 10 }, (_, i) => {
        const content = `
class TestSerializer${i}
  include JSONAPI::Serializer
  set_type :test${i}
  attributes :name, :value
end
        `.trim();
        const filePath = path.join(tempDir, `test_serializer_${i}.rb`);
        fs.writeFileSync(filePath, content);
        return Ruby.RubySerializerParser.parseFile(filePath);
      });

      // Act
      const startTime = Date.now();
      const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
      const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'TestApi',
        generateOperations: true,
      })(serializers);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(jsonApiSchema.serializers).toHaveLength(10);
      expect(typeSpecCode).toContain('namespace TestApi');
    });

    it('should validate converted TypeSpec syntax', () => {
      // Arrange
      const serializer = `
class ValidSerializer
  include JSONAPI::Serializer
  set_type :valid
  attributes :name, :email
  belongs_to :parent
end
      `.trim();
      
      const filePath = path.join(tempDir, 'valid_serializer.rb');
      fs.writeFileSync(filePath, serializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(filePath);

      // Act
      const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'Valid',
        generateOperations: true,
      })([parsedSerializer]);

      // Assert - Basic TypeSpec syntax validation
      expect(typeSpecCode).toMatch(/import\s+"@typespec\/rest"/);
      expect(typeSpecCode).toMatch(/import\s+"@typespec\/openapi3"/);
      expect(typeSpecCode).toMatch(/namespace\s+Valid\s*{/);
      expect(typeSpecCode).toMatch(/model\s+Valids\s*{/);
      expect(typeSpecCode).toMatch(/name:\s+string;/);
      expect(typeSpecCode).toMatch(/email:\s+string;/);
      expect(typeSpecCode).toMatch(/@route\("\/valids"\)/);
      expect(typeSpecCode).toMatch(/@get/);
      expect(typeSpecCode).toMatch(/@post/);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle malformed Ruby serializer gracefully', () => {
      // Arrange
      const malformedSerializer = `
class MalformedSerializer
  # Missing include JSONAPI::Serializer
  set_type :malformed
  attributes :name
  # Syntax error: missing end
      `.trim();
      
      const filePath = path.join(tempDir, 'malformed_serializer.rb');
      fs.writeFileSync(filePath, malformedSerializer);

      // Act & Assert
      expect(() => {
        Ruby.RubySerializerParser.parseFile(filePath);
      }).toThrow(); // Should throw parsing error
    });

    it('should handle missing file gracefully', () => {
      // Arrange
      const nonExistentPath = path.join(tempDir, 'does_not_exist.rb');

      // Act & Assert
      expect(() => {
        Ruby.RubySerializerParser.parseFile(nonExistentPath);
      }).toThrow(/ENOENT|no such file/i);
    });

    it('should handle empty serializer list', () => {
      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([]);

      // Assert
      expect(jsonApiSchema.serializers).toHaveLength(0);
      expect(jsonApiSchema.title).toBe('Generated from Ruby jsonapi-serializer classes');
    });
  });
});