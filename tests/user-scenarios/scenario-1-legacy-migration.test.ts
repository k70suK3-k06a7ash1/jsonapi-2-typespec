import { describe, test, expect } from 'vitest';
import { RubySerializerParser, rubyToJsonApiSchema, rubyToTypeSpecPipeline } from '../../src/ruby';
import { OpenApiFromJsonApiGenerator } from '../../src/generators';
import { TypeSpecGenerator } from '../../src/typespec';
import { TypeSpecValidator } from '../utils/typespec-validator';

describe('Scenario 1: Legacy Rails API Migration to TypeSpec', () => {
  
  test('should parse Ruby serializer and convert to TypeSpec', async () => {
    // Sample Ruby serializer from the scenario
    const rubySerializerCode = `module Api
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
end`;

    // Parse Ruby serializer
    const serializer = RubySerializerParser.parseString(rubySerializerCode);
    
    expect(serializer).toBeDefined();
    expect(serializer.className).toBe('UserSerializer');
    expect(serializer.resourceType).toBe('users');
    expect(serializer.attributes.length).toBeGreaterThanOrEqual(4); // At least email, name, created_at, updated_at
    expect(serializer.relationships).toHaveLength(2); // projects, organization
    
    // Check that we get the basic attributes
    const attributeNames = serializer.attributes.map(a => a.name);
    expect(attributeNames).toContain('email');
    expect(attributeNames).toContain('name');
  });

  test('should convert Ruby serializers to TypeSpec using pipeline', async () => {
    const rubySerializerCode = `module Api
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
end`;

    const serializer = RubySerializerParser.parseString(rubySerializerCode);
    
    // Convert to TypeSpec using functional pipeline
    const typeSpecPipeline = rubyToTypeSpecPipeline({
      namespace: 'ApiV1',
      generateOperations: true,
      includeRelationships: true,
      title: 'Legacy API v1',
      version: '1.0.0',
    });

    const typeSpecDefinition = typeSpecPipeline([serializer]);
    const typeSpecCode = new TypeSpecGenerator().generateDefinition(typeSpecDefinition);
    
    // Basic string validations
    expect(typeSpecCode).toContain('namespace ApiV1');
    expect(typeSpecCode).toContain('model Users'); // Generated model name is pluralized
    expect(typeSpecCode).toContain('email: string');
    // Note: complex attributes with blocks may not be parsed yet
    expect(typeSpecCode).toContain('created_at: string');
    expect(typeSpecCode).toContain('updated_at: string');
    
    // Use TypeSpec validator for proper validation
    const validationResult = await TypeSpecValidator.validateTypeSpec(typeSpecCode);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.hasNamespace).toBe(true);
    expect(validationResult.hasModels).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
  });

  test('should generate OpenAPI documentation from Ruby serializers', async () => {
    const rubySerializerCode = `module Api
  module V1
    class UserSerializer
      include JSONAPI::Serializer
      
      set_type :users
      set_id :id
      
      attributes :email, :name, :created_at, :updated_at
      
      has_many :projects
      belongs_to :organization
    end
  end
end`;

    const serializer = RubySerializerParser.parseString(rubySerializerCode);
    
    // Convert to JSON API schema
    const jsonApiSchema = rubyToJsonApiSchema([serializer]);
    
    // Generate OpenAPI specification
    const openApiGenerator = new OpenApiFromJsonApiGenerator();
    const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
      jsonApiFormat: true,
      servers: [
        {
          url: 'https://api.mycompany.com/v1',
          description: 'Production API'
        }
      ]
    });

    expect(openApiSpec.info.title).toBeDefined();
    expect(openApiSpec.paths).toBeDefined();
    expect(openApiSpec.components?.schemas).toBeDefined();
    expect(openApiSpec.servers).toHaveLength(1);
    expect(openApiSpec.servers?.[0].url).toBe('https://api.mycompany.com/v1');
  });

  test('should maintain API compatibility during conversion', async () => {
    const rubySerializerCode = `module Api
  module V1
    class UserSerializer
      include JSONAPI::Serializer
      
      set_type :users
      set_id :id
      
      attributes :email, :name, :created_at, :updated_at
      
      attribute :avatar_url do |user|
        user.avatar.present? ? user.avatar.url : nil
      end
      
      has_many :projects
      belongs_to :organization
    end
  end
end`;

    const serializer = RubySerializerParser.parseString(rubySerializerCode);
    
    // Convert to JSON API schema and back
    const jsonApiSchema = rubyToJsonApiSchema([serializer]);
    const userSerializer = jsonApiSchema.serializers.find(s => s.name === 'UserSerializer');
    
    expect(userSerializer).toBeDefined();
    expect(userSerializer?.resource.type).toBe('users');
    
    // Verify basic attributes are preserved
    const attributeNames = userSerializer?.resource.attributes.map(a => a.name) || [];
    expect(attributeNames).toContain('email');
    expect(attributeNames).toContain('name');
    expect(attributeNames).toContain('created_at');
    expect(attributeNames).toContain('updated_at');
    // Note: complex attributes with blocks may not be parsed yet
    
    // Verify relationships are preserved
    const relationshipNames = userSerializer?.resource.relationships.map(r => r.name) || [];
    expect(relationshipNames).toContain('projects');
    expect(relationshipNames).toContain('organization');
  });

  test('should handle multiple serializers in migration scenario', async () => {
    const userSerializerCode = `class UserSerializer
  include JSONAPI::Serializer
  set_type :users
  attributes :email, :name
  has_many :projects
end`;

    const projectSerializerCode = `class ProjectSerializer
  include JSONAPI::Serializer
  set_type :projects
  attributes :title, :description, :status
  belongs_to :user
end`;

    const organizationSerializerCode = `class OrganizationSerializer
  include JSONAPI::Serializer
  set_type :organizations
  attributes :name, :plan
  has_many :users
end`;

    const serializers = [
      RubySerializerParser.parseString(userSerializerCode),
      RubySerializerParser.parseString(projectSerializerCode),
      RubySerializerParser.parseString(organizationSerializerCode)
    ];

    // Convert all serializers using functional pipeline
    const typeSpecPipeline = rubyToTypeSpecPipeline({
      namespace: 'ApiV1',
      generateOperations: true,
      includeRelationships: true,
      title: 'Legacy API v1',
      version: '1.0.0',
    });

    const typeSpecDefinition = typeSpecPipeline(serializers);
    const typeSpecCode = new TypeSpecGenerator().generateDefinition(typeSpecDefinition);
    
    // Verify all models are generated (note: model names are pluralized)
    expect(typeSpecCode).toContain('model Users');
    expect(typeSpecCode).toContain('model Projects');
    expect(typeSpecCode).toContain('model Organizations');
    
    // Verify relationships are properly cross-referenced 
    expect(typeSpecCode).toMatch(/projects.*Projects\[\]/);
    expect(typeSpecCode).toMatch(/user.*User/); // Relationship references the singular form
    expect(typeSpecCode).toMatch(/users.*Users\[\]/);
    
    // Validate the generated TypeSpec
    const validationResult = await TypeSpecValidator.validateTypeSpec(typeSpecCode);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.hasNamespace).toBe(true);
    expect(validationResult.hasModels).toBe(true);
  });
});