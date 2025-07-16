/**
 * Test Suite for Scenario 2: Multi-Platform API Design
 * Based on USER_SCENARIOS.md - Fintech API serving mobile, web, and partners
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Ruby, TypeSpec, Generators } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Scenario 2: Multi-Platform API Design', () => {
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multiplatform-test-'));
  });
  
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Financial Account Serializer', () => {
    const accountSerializer = `
module Financial
  class AccountSerializer
    include JSONAPI::Serializer
    
    set_type :accounts
    set_id :uuid
    
    attributes :account_number, :account_type, :currency
    
    attribute :balance do |account|
      {
        available: account.available_balance.to_f,
        pending: account.pending_balance.to_f,
        total: account.total_balance.to_f
      }
    end
    
    attribute :status do |account|
      account.active? ? 'active' : 'suspended'
    end
    
    has_many :transactions
    belongs_to :customer
  end
end
    `.trim();

    it('should parse financial serializer with complex attributes', () => {
      // Arrange
      const serializerPath = path.join(tempDir, 'account_serializer.rb');
      fs.writeFileSync(serializerPath, accountSerializer);

      // Act
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(serializerPath);

      // Assert
      expect(parsedSerializer.className).toBe('AccountSerializer');
      expect(parsedSerializer.namespace).toBe('Financial');
      expect(parsedSerializer.resourceType).toBe('accounts');
      expect(parsedSerializer.idAttribute).toBe('uuid');
      
      // Check standard attributes
      expect(parsedSerializer.attributes.find(a => a.name === 'account_number')).toBeDefined();
      expect(parsedSerializer.attributes.find(a => a.name === 'account_type')).toBeDefined();
      expect(parsedSerializer.attributes.find(a => a.name === 'currency')).toBeDefined();
      
      // Check custom method attributes
      const balanceAttr = parsedSerializer.attributes.find(a => a.name === 'balance');
      expect(balanceAttr).toBeDefined();
      expect(balanceAttr?.customMethod).toBe(true);
      
      const statusAttr = parsedSerializer.attributes.find(a => a.name === 'status');
      expect(statusAttr).toBeDefined();
      expect(statusAttr?.customMethod).toBe(true);
      
      // Check relationships
      expect(parsedSerializer.relationships.find(r => r.name === 'transactions' && r.type === 'has_many')).toBeDefined();
      expect(parsedSerializer.relationships.find(r => r.name === 'customer' && r.type === 'belongs_to')).toBeDefined();
    });

    it('should generate TypeScript-compatible TypeSpec', () => {
      // Arrange
      const serializerPath = path.join(tempDir, 'account_serializer.rb');
      fs.writeFileSync(serializerPath, accountSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(serializerPath);

      // Act
      const typeSpecResult = Ruby.rubyToTypeSpecPipeline({
        namespace: 'FinancialApi',
        generateOperations: true,
        title: 'Financial API',
        version: '2.0.0',
      })([parsedSerializer]);

      // Assert
      expect(typeSpecResult).toContain('namespace FinancialApi');
      expect(typeSpecResult).toContain('@service({');
      expect(typeSpecResult).toContain('title: "Financial API"');
      expect(typeSpecResult).toContain('version: "2.0.0"');
      
      // Check model definition
      expect(typeSpecResult).toContain('model Accounts {');
      expect(typeSpecResult).toContain('account_number: string;');
      expect(typeSpecResult).toContain('account_type: string;');
      expect(typeSpecResult).toContain('currency: string;');
      expect(typeSpecResult).toContain('balance: string;'); // Custom attributes become strings
      expect(typeSpecResult).toContain('status: string;');
      
      // Check relationships
      expect(typeSpecResult).toContain('transactions: Transactions[];');
      expect(typeSpecResult).toContain('customer: Customers;');
      
      // Check operations
      expect(typeSpecResult).toContain('@route("/accounts")');
      expect(typeSpecResult).toContain('op listAccounts(): Accounts[];');
      expect(typeSpecResult).toContain('op getAccounts(id: string): Accounts;');
    });

    it('should generate partner-compatible OpenAPI', () => {
      // Arrange
      const serializerPath = path.join(tempDir, 'account_serializer.rb');
      fs.writeFileSync(serializerPath, accountSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(serializerPath);

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
      const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
      const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
        servers: [
          { url: 'https://api.fintech.com/v2', description: 'Production' },
          { url: 'https://sandbox.fintech.com/v2', description: 'Sandbox' }
        ]
      });

      // Assert
      expect(openApiSpec.openapi).toBe('3.0.3');
      expect(openApiSpec.servers).toHaveLength(2);
      expect(openApiSpec.servers[0].url).toBe('https://api.fintech.com/v2');
      expect(openApiSpec.servers[1].url).toBe('https://sandbox.fintech.com/v2');
      
      // Check paths
      expect(openApiSpec.paths['/accounts']).toBeDefined();
      expect(openApiSpec.paths['/accounts/{id}']).toBeDefined();
      
      // Check schema
      const accountSchema = openApiSpec.components.schemas.Accounts;
      expect(accountSchema).toBeDefined();
      expect(accountSchema.properties.account_number).toBeDefined();
      expect(accountSchema.properties.balance).toBeDefined();
      expect(accountSchema.properties.status).toBeDefined();
      expect(accountSchema.required).toContain('account_number');
    });
  });

  describe('Multi-Service Platform Generation', () => {
    const transactionSerializer = `
module Financial
  class TransactionSerializer
    include JSONAPI::Serializer
    
    set_type :transactions
    set_id :uuid
    
    attributes :amount, :currency, :description, :timestamp
    
    attribute :formatted_amount do |transaction|
      "$#{transaction.amount}"
    end
    
    belongs_to :account
    belongs_to :category
  end
end
    `.trim();

    const customerSerializer = `
module Financial
  class CustomerSerializer
    include JSONAPI::Serializer
    
    set_type :customers
    set_id :uuid
    
    attributes :first_name, :last_name, :email, :phone
    
    attribute :full_name do |customer|
      "#{customer.first_name} #{customer.last_name}"
    end
    
    attribute :verification_status do |customer|
      customer.verified? ? 'verified' : 'pending'
    end
    
    has_many :accounts
    has_many :social_links
  end
end
    `.trim();

    it('should generate specifications for all platforms', async () => {
      // Arrange
      const serializers = [
        { content: transactionSerializer, name: 'transaction_serializer.rb' },
        { content: customerSerializer, name: 'customer_serializer.rb' }
      ].map(({ content, name }) => {
        const filePath = path.join(tempDir, name);
        fs.writeFileSync(filePath, content);
        return Ruby.RubySerializerParser.parseFile(filePath);
      });

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
      
      // Generate TypeSpec for TypeScript clients
      const typeSpecResult = Ruby.rubyToTypeSpecPipeline({
        namespace: 'FinancialApi',
        generateOperations: true,
        title: 'Financial API',
        version: '2.0.0',
      })(serializers);

      // Generate OpenAPI for partners
      const openApiSpec = new Generators.OpenApiFromJsonApiGenerator()
        .generate(jsonApiSchema, {
          servers: [
            { url: 'https://api.fintech.com/v2', description: 'Production' },
            { url: 'https://sandbox.fintech.com/v2', description: 'Sandbox' }
          ]
        });

      // Assert - TypeSpec generation
      expect(typeSpecResult).toContain('namespace FinancialApi');
      expect(typeSpecResult).toContain('model Transactions');
      expect(typeSpecResult).toContain('model Customers');
      expect(typeSpecResult).toContain('formatted_amount: string');
      expect(typeSpecResult).toContain('full_name: string');
      expect(typeSpecResult).toContain('verification_status: string');

      // Assert - OpenAPI generation
      expect(openApiSpec.components.schemas.Transactions).toBeDefined();
      expect(openApiSpec.components.schemas.Customers).toBeDefined();
      expect(Object.keys(openApiSpec.paths)).toHaveLength(4); // 2 resources × 2 operations each

      // Assert - Platform-specific features
      expect(jsonApiSchema.serializers).toHaveLength(2);
      expect(jsonApiSchema.serializers[0].namespace).toBe('Financial');
    });

    it('should save specifications in multiple formats', () => {
      // Arrange
      const serializers = [customerSerializer].map((content, index) => {
        const filePath = path.join(tempDir, `serializer_${index}.rb`);
        fs.writeFileSync(filePath, content);
        return Ruby.RubySerializerParser.parseFile(filePath);
      });

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
      const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'FinancialApi',
        generateOperations: true,
      })(serializers);

      const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
      const openApiSpec = openApiGenerator.generate(jsonApiSchema);

      // Save files
      const typeSpecPath = path.join(tempDir, 'financial-api.tsp');
      const openApiYamlPath = path.join(tempDir, 'financial-api-openapi.yml');
      const openApiJsonPath = path.join(tempDir, 'financial-api-openapi.json');

      fs.writeFileSync(typeSpecPath, typeSpecCode);
      Generators.YamlOutput.saveToYamlFile(openApiSpec, openApiYamlPath);
      Generators.YamlOutput.saveToJsonFile(openApiSpec, openApiJsonPath);

      // Assert
      expect(fs.existsSync(typeSpecPath)).toBe(true);
      expect(fs.existsSync(openApiYamlPath)).toBe(true);
      expect(fs.existsSync(openApiJsonPath)).toBe(true);

      // Verify file contents
      const savedTypeSpec = fs.readFileSync(typeSpecPath, 'utf8');
      expect(savedTypeSpec).toContain('namespace FinancialApi');
      
      const savedOpenApiJson = JSON.parse(fs.readFileSync(openApiJsonPath, 'utf8'));
      expect(savedOpenApiJson.openapi).toBe('3.0.3');
    });
  });

  describe('Platform Consistency Validation', () => {
    it('should maintain consistent data models across platforms', () => {
      // Arrange
      const multiPlatformSerializer = `
class MultiPlatformSerializer
  include JSONAPI::Serializer
  
  set_type :resources
  set_id :uuid
  
  attributes :name, :value, :created_at
  
  attribute :computed_field do |resource|
    resource.compute_value
  end
  
  has_many :children
  belongs_to :parent
end
      `.trim();

      const filePath = path.join(tempDir, 'multiplatform_serializer.rb');
      fs.writeFileSync(filePath, multiPlatformSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(filePath);

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
      const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'MultiPlatform',
        generateOperations: true,
      })([parsedSerializer]);
      const openApiSpec = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema);

      // Assert - Check consistency across all platforms
      
      // JSON API Schema
      const jsonApiResource = jsonApiSchema.serializers[0].resource;
      expect(jsonApiResource.type).toBe('resources');
      expect(jsonApiResource.attributes.map(a => a.name)).toContain('name');
      expect(jsonApiResource.attributes.map(a => a.name)).toContain('computed_field');
      
      // TypeSpec
      expect(typeSpecCode).toContain('model Resources');
      expect(typeSpecCode).toContain('name: string;');
      expect(typeSpecCode).toContain('computed_field: string;');
      expect(typeSpecCode).toContain('children: Children[];');
      
      // OpenAPI
      const openApiSchema = openApiSpec.components.schemas.Resources;
      expect(openApiSchema.properties.name).toBeDefined();
      expect(openApiSchema.properties.computed_field).toBeDefined();
      expect(openApiSchema.required).toContain('name');
    });

    it('should handle complex nested attributes consistently', () => {
      // Arrange
      const complexSerializer = `
class ComplexSerializer
  include JSONAPI::Serializer
  
  set_type :complex
  
  attributes :simple_field
  
  attribute :nested_object do |obj|
    {
      field1: obj.field1,
      field2: obj.field2,
      nested: {
        deep_field: obj.deep_value
      }
    }
  end
  
  attribute :array_field do |obj|
    obj.items.map(&:name)
  end
end
      `.trim();

      const filePath = path.join(tempDir, 'complex_serializer.rb');
      fs.writeFileSync(filePath, complexSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(filePath);

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
      const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'Complex',
        generateOperations: true,
      })([parsedSerializer]);

      // Assert
      const attributes = jsonApiSchema.serializers[0].resource.attributes;
      expect(attributes.find(a => a.name === 'nested_object')).toBeDefined();
      expect(attributes.find(a => a.name === 'array_field')).toBeDefined();
      
      // TypeSpec should handle complex attributes as strings (simplified)
      expect(typeSpecCode).toContain('nested_object: string;');
      expect(typeSpecCode).toContain('array_field: string;');
    });
  });

  describe('API Versioning for Multi-Platform', () => {
    it('should support versioned API generation', () => {
      // Arrange
      const versionedSerializer = `
module Api
  module V2
    class VersionedSerializer
      include JSONAPI::Serializer
      
      set_type :versioned
      
      attributes :new_field, :updated_field
      
      # V2 specific attribute
      attribute :v2_feature do |obj|
        obj.enhanced_feature
      end
    end
  end
end
      `.trim();

      const filePath = path.join(tempDir, 'versioned_serializer.rb');
      fs.writeFileSync(filePath, versionedSerializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(filePath);

      // Act
      const v2TypeSpec = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'ApiV2',
        generateOperations: true,
        title: 'API v2.0',
        version: '2.0.0',
      })([parsedSerializer]);

      // Assert
      expect(v2TypeSpec).toContain('namespace ApiV2');
      expect(v2TypeSpec).toContain('title: "API v2.0"');
      expect(v2TypeSpec).toContain('version: "2.0.0"');
      expect(v2TypeSpec).toContain('v2_feature: string;');
      expect(parsedSerializer.namespace).toBe('Api::V2');
    });

    it('should generate platform-specific server configurations', () => {
      // Arrange
      const serializer = `
class PlatformSerializer
  include JSONAPI::Serializer
  set_type :platform
  attributes :name
end
      `.trim();

      const filePath = path.join(tempDir, 'platform_serializer.rb');
      fs.writeFileSync(filePath, serializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(filePath);

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
      const mobileOpenApi = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema, {
        servers: [
          { url: 'https://mobile-api.fintech.com/v1', description: 'Mobile API' }
        ]
      });

      const webOpenApi = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema, {
        servers: [
          { url: 'https://web-api.fintech.com/v1', description: 'Web API' }
        ]
      });

      const partnerOpenApi = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema, {
        servers: [
          { url: 'https://partner-api.fintech.com/v1', description: 'Partner API' }
        ]
      });

      // Assert
      expect(mobileOpenApi.servers[0].url).toBe('https://mobile-api.fintech.com/v1');
      expect(webOpenApi.servers[0].url).toBe('https://web-api.fintech.com/v1');
      expect(partnerOpenApi.servers[0].url).toBe('https://partner-api.fintech.com/v1');
      
      // All should have the same core schema
      expect(mobileOpenApi.components.schemas).toEqual(webOpenApi.components.schemas);
      expect(webOpenApi.components.schemas).toEqual(partnerOpenApi.components.schemas);
    });
  });
});