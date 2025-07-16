/**
 * Integration Test Suite for All User Scenarios
 * Based on USER_SCENARIOS.md - Comprehensive test runner
 */

import { describe, it, expect } from 'vitest';
import { Ruby, TypeSpec, Generators } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('User Scenarios Integration Tests', () => {
  describe('End-to-End Workflow Integration', () => {
    it('should complete full Ruby → TypeSpec → OpenAPI pipeline', () => {
      // Arrange - Real-world Ruby serializer
      const realWorldSerializer = `
module Ecommerce
  module Api
    module V1
      class ProductSerializer
        include JSONAPI::Serializer
        
        set_type :products
        set_id :sku
        
        attributes :name, :description, :price, :currency, :created_at
        
        attribute :formatted_price do |product|
          "#{product.currency} #{product.price}"
        end
        
        attribute :availability_status do |product|
          case product.stock_level
          when 0
            'out_of_stock'
          when 1..5
            'low_stock'
          else
            'in_stock'
          end
        end
        
        attribute :seo_friendly_name do |product|
          product.name.parameterize
        end
        
        belongs_to :category
        belongs_to :vendor
        has_many :reviews
        has_many :product_variants
        has_many :related_products
      end
    end
  end
end
      `.trim();

      // Act - Complete pipeline execution
      const tempFile = path.join(__dirname, '../../temp_product_serializer.rb');
      fs.writeFileSync(tempFile, realWorldSerializer);
      
      try {
        // Step 1: Parse Ruby serializer
        const parsedSerializer = Ruby.RubySerializerParser.parseFile(tempFile);
        
        // Step 2: Convert to JSON API schema
        const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
        
        // Step 3: Generate TypeSpec
        const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
          namespace: 'EcommerceApi',
          generateOperations: true,
          includeRelationships: true,
          title: 'E-commerce API',
          version: '1.0.0',
        })([parsedSerializer]);
        
        // Step 4: Generate OpenAPI
        const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
        const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
          jsonApiFormat: true,
          servers: [
            { url: 'https://api.ecommerce.com/v1', description: 'Production' },
            { url: 'https://staging.ecommerce.com/v1', description: 'Staging' }
          ]
        });
        
        // Assert - Comprehensive validation
        
        // Ruby Parser Results
        expect(parsedSerializer.className).toBe('ProductSerializer');
        expect(parsedSerializer.namespace).toBe('Ecommerce::Api::V1');
        expect(parsedSerializer.resourceType).toBe('products');
        expect(parsedSerializer.idAttribute).toBe('sku');
        expect(parsedSerializer.attributes).toHaveLength(8); // 5 standard + 3 custom
        expect(parsedSerializer.relationships).toHaveLength(5);
        
        // JSON API Schema Results
        expect(jsonApiSchema.serializers).toHaveLength(1);
        expect(jsonApiSchema.serializers[0].resource.type).toBe('products');
        expect(jsonApiSchema.serializers[0].resource.attributes).toHaveLength(8);
        expect(jsonApiSchema.serializers[0].resource.relationships).toHaveLength(5);
        
        // TypeSpec Results
        expect(typeSpecCode).toContain('namespace EcommerceApi');
        expect(typeSpecCode).toContain('@service({');
        expect(typeSpecCode).toContain('title: "E-commerce API"');
        expect(typeSpecCode).toContain('model Products');
        expect(typeSpecCode).toContain('formatted_price: string;');
        expect(typeSpecCode).toContain('availability_status: string;');
        expect(typeSpecCode).toContain('seo_friendly_name: string;');
        expect(typeSpecCode).toContain('category: Categories;');
        expect(typeSpecCode).toContain('reviews: Reviews[];');
        expect(typeSpecCode).toContain('@route("/products")');
        expect(typeSpecCode).toContain('op listProducts(): Products[];');
        
        // OpenAPI Results
        expect(openApiSpec.openapi).toBe('3.0.3');
        expect(openApiSpec.servers).toHaveLength(2);
        expect(openApiSpec.paths['/products']).toBeDefined();
        expect(openApiSpec.paths['/products/{id}']).toBeDefined();
        expect(openApiSpec.components.schemas.Products).toBeDefined();
        
        const productSchema = openApiSpec.components.schemas.Products;
        expect(productSchema.properties.name).toBeDefined();
        expect(productSchema.properties.formatted_price).toBeDefined();
        expect(productSchema.properties.availability_status).toBeDefined();
        expect(productSchema.required).toContain('name');
        expect(productSchema.required).toContain('price');
        
      } finally {
        // Cleanup
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should handle complex multi-service scenario', () => {
      // Arrange - Multiple related services
      const userServiceSerializer = `
class UserSerializer
  include JSONAPI::Serializer
  set_type :users
  attributes :email, :name
  has_many :orders
end
      `.trim();

      const orderServiceSerializer = `
class OrderSerializer
  include JSONAPI::Serializer
  set_type :orders
  attributes :total, :status
  belongs_to :user
  has_many :line_items
end
      `.trim();

      const productServiceSerializer = `
class LineItemSerializer
  include JSONAPI::Serializer
  set_type :line_items
  attributes :quantity, :unit_price
  belongs_to :order
  belongs_to :product
end
      `.trim();

      // Act
      const serializers = [
        { content: userServiceSerializer, name: 'user_serializer.rb' },
        { content: orderServiceSerializer, name: 'order_serializer.rb' },
        { content: productServiceSerializer, name: 'line_item_serializer.rb' }
      ].map(({ content, name }) => {
        const tempFile = path.join(__dirname, `../../temp_${name}`);
        fs.writeFileSync(tempFile, content);
        
        try {
          return Ruby.RubySerializerParser.parseFile(tempFile);
        } finally {
          fs.unlinkSync(tempFile);
        }
      });

      // Generate unified documentation
      const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
      const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'MultiServiceApi',
        generateOperations: true,
        title: 'Multi-Service E-commerce API',
        version: '1.0.0',
      })(serializers);

      // Assert
      expect(serializers).toHaveLength(3);
      expect(jsonApiSchema.serializers).toHaveLength(3);
      
      // Verify all services are represented
      const resourceTypes = jsonApiSchema.serializers.map(s => s.resource.type);
      expect(resourceTypes).toContain('users');
      expect(resourceTypes).toContain('orders');
      expect(resourceTypes).toContain('line_items');
      
      // Verify TypeSpec contains all models
      expect(typeSpecCode).toContain('model Users');
      expect(typeSpecCode).toContain('model Orders');
      expect(typeSpecCode).toContain('model LineItems');
      
      // Verify relationships are preserved across services
      expect(typeSpecCode).toContain('orders: Orders[]'); // User has many orders
      expect(typeSpecCode).toContain('user: Users;'); // Order belongs to user
      expect(typeSpecCode).toContain('line_items: LineItems[]'); // Order has many line items
    });

    it('should maintain data consistency across all output formats', () => {
      // Arrange
      const consistencyTestSerializer = `
class ConsistencySerializer
  include JSONAPI::Serializer
  
  set_type :consistency_tests
  set_id :uuid
  
  attributes :string_field, :number_field, :boolean_field, :date_field
  
  attribute :computed_field do |obj|
    "computed_#{obj.id}"
  end
  
  belongs_to :parent
  has_many :children
end
      `.trim();

      const tempFile = path.join(__dirname, '../../temp_consistency_serializer.rb');
      fs.writeFileSync(tempFile, consistencyTestSerializer);

      try {
        // Act - Generate all formats
        const parsedSerializer = Ruby.RubySerializerParser.parseFile(tempFile);
        const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
        
        const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
          namespace: 'ConsistencyTest',
          generateOperations: true,
        })([parsedSerializer]);

        const openApiSpec = new Generators.OpenApiFromJsonApiGenerator()
          .generate(jsonApiSchema);

        const yamlOutput = Ruby.rubyToOutputPipeline('yaml', {
          namespace: 'ConsistencyTest',
        })([parsedSerializer]);

        // Assert - Data consistency across formats
        
        // Resource type consistency
        expect(parsedSerializer.resourceType).toBe('consistency_tests');
        expect(jsonApiSchema.serializers[0].resource.type).toBe('consistency_tests');
        expect(typeSpecCode).toContain('model ConsistencyTests');
        expect(openApiSpec.components.schemas.ConsistencyTests).toBeDefined();
        
        // ID attribute consistency
        expect(parsedSerializer.idAttribute).toBe('uuid');
        
        // Attributes consistency
        const expectedAttributes = ['string_field', 'number_field', 'boolean_field', 'date_field', 'computed_field'];
        
        expect(parsedSerializer.attributes.map(a => a.name)).toEqual(
          expect.arrayContaining(expectedAttributes)
        );
        
        expect(jsonApiSchema.serializers[0].resource.attributes.map(a => a.name)).toEqual(
          expect.arrayContaining(expectedAttributes)
        );
        
        expectedAttributes.forEach(attr => {
          expect(typeSpecCode).toContain(`${attr}: string;`);
        });
        
        expectedAttributes.forEach(attr => {
          expect(openApiSpec.components.schemas.ConsistencyTests.properties[attr]).toBeDefined();
        });
        
        // Relationships consistency
        expect(parsedSerializer.relationships.map(r => r.name)).toEqual(['parent', 'children']);
        expect(jsonApiSchema.serializers[0].resource.relationships.map(r => r.name)).toEqual(['parent', 'children']);
        expect(typeSpecCode).toContain('parent: Parents;');
        expect(typeSpecCode).toContain('children: Children[];');
        
        // YAML output should contain the schema
        expect(yamlOutput).toContain('consistency_tests');
        expect(yamlOutput).toContain('string_field');
        expect(yamlOutput).toContain('computed_field');

      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle all scenarios gracefully with error recovery', () => {
      // Test error scenarios from all user scenarios
      
      // Scenario 1: Legacy migration with malformed files
      expect(() => {
        const malformedRuby = 'class BadSerializer\n  # missing everything\n';
        const tempFile = path.join(__dirname, '../../temp_bad.rb');
        fs.writeFileSync(tempFile, malformedRuby);
        
        try {
          Ruby.RubySerializerParser.parseFile(tempFile);
        } finally {
          fs.unlinkSync(tempFile);
        }
      }).toThrow();

      // Scenario 2: Multi-platform with empty serializers
      const emptySchema = Ruby.rubyToJsonApiSchema([]);
      expect(emptySchema.serializers).toHaveLength(0);
      
      const emptyTypeSpec = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'Empty',
        generateOperations: true,
      })([]);
      expect(emptyTypeSpec).toContain('namespace Empty');

      // Scenario 3: Microservices with no matching files
      // This should not crash but return empty results
      const noSerializers = Ruby.rubyToJsonApiSchema([]);
      expect(noSerializers.serializers).toHaveLength(0);

      // Scenario 4: Version comparison with identical schemas
      const sameSchema1 = Ruby.rubyToJsonApiSchema([]);
      const sameSchema2 = Ruby.rubyToJsonApiSchema([]);
      // Comparing identical schemas should show no changes
      expect(sameSchema1).toEqual(sameSchema2);
    });

    it('should provide meaningful error messages for debugging', () => {
      // Test that error messages are helpful for development
      const invalidPath = '/non/existent/path/serializer.rb';
      
      expect(() => {
        Ruby.RubySerializerParser.parseFile(invalidPath);
      }).toThrow(/ENOENT|no such file/i);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete all scenarios within performance budgets', () => {
      // Arrange - Performance test data
      const performanceSerializer = `
class PerformanceSerializer
  include JSONAPI::Serializer
  set_type :performance
  attributes :field1, :field2, :field3
  has_many :related
end
      `.trim();

      // Create multiple serializers for performance testing
      const serializers: Ruby.RubySerializerClass[] = [];
      const startTime = Date.now();

      // Act - Process multiple serializers
      for (let i = 0; i < 10; i++) {
        const content = performanceSerializer.replace('PerformanceSerializer', `PerformanceSerializer${i}`)
                                           .replace(':performance', `:performance${i}`);
        const tempFile = path.join(__dirname, `../../temp_perf_${i}.rb`);
        fs.writeFileSync(tempFile, content);
        
        try {
          const parsed = Ruby.RubySerializerParser.parseFile(tempFile);
          serializers.push(parsed);
        } finally {
          fs.unlinkSync(tempFile);
        }
      }

      // Generate all outputs
      const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
      const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'Performance',
        generateOperations: true,
      })(serializers);
      const openApiSpec = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Assert - Performance requirements
      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(serializers).toHaveLength(10);
      expect(jsonApiSchema.serializers).toHaveLength(10);
      expect(typeSpecCode).toContain('namespace Performance');
      expect(Object.keys(openApiSpec.components.schemas)).toHaveLength(10);
    });
  });

  describe('Real-world Integration Validation', () => {
    it('should work with actual Ruby on Rails serializer patterns', () => {
      // Arrange - Real Rails patterns
      const railsPatternSerializer = `
module Api
  module V2
    class ProductSerializer < ApplicationSerializer
      include JSONAPI::Serializer
      
      set_type :products
      set_id :slug
      set_key_transform :camel_lower
      
      attributes :title, :description, :price_cents, :currency_code, :published_at
      
      attribute :price do |product, params|
        {
          amount: product.price_cents,
          currency: product.currency_code,
          formatted: params[:locale] == 'ja' ? "¥#{product.price_cents}" : "$#{product.price_cents / 100}"
        }
      end
      
      attribute :status, if: Proc.new { |record, params| params[:include_status] }
      
      attribute :meta_description do |product|
        ActionView::Base.full_sanitizer.sanitize(product.description).truncate(160)
      end
      
      belongs_to :brand, serializer: BrandSerializer
      belongs_to :category, id_method_name: :primary_category_id
      has_many :variants, serializer: ProductVariantSerializer
      has_many :reviews, serializer: ReviewSerializer, if: Proc.new { |record| record.reviews.published.any? }
      
      link :self do |product|
        api_v2_product_path(product.slug)
      end
      
      link :related do |product|
        api_v2_product_related_products_path(product.slug)
      end
      
      meta do |product, params|
        {
          view_count: product.view_count,
          created_by: params[:current_user]&.id == product.user_id ? 'you' : 'other'
        }
      end
    end
  end
end
      `.trim();

      const tempFile = path.join(__dirname, '../../temp_rails_serializer.rb');
      fs.writeFileSync(tempFile, railsPatternSerializer);

      try {
        // Act
        const parsedSerializer = Ruby.RubySerializerParser.parseFile(tempFile);
        const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
        const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
          namespace: 'RailsApi',
          generateOperations: true,
          title: 'Rails API v2',
          version: '2.0.0',
        })([parsedSerializer]);

        // Assert - Should handle Rails-specific patterns
        expect(parsedSerializer.className).toBe('ProductSerializer');
        expect(parsedSerializer.namespace).toBe('Api::V2');
        expect(parsedSerializer.resourceType).toBe('products');
        expect(parsedSerializer.idAttribute).toBe('slug');
        
        // Should parse complex attributes
        const priceAttr = parsedSerializer.attributes.find(a => a.name === 'price');
        expect(priceAttr).toBeDefined();
        expect(priceAttr?.customMethod).toBe(true);
        
        const metaDescAttr = parsedSerializer.attributes.find(a => a.name === 'meta_description');
        expect(metaDescAttr).toBeDefined();
        expect(metaDescAttr?.customMethod).toBe(true);
        
        // Should handle relationships
        expect(parsedSerializer.relationships).toHaveLength(4);
        const brandRel = parsedSerializer.relationships.find(r => r.name === 'brand');
        expect(brandRel).toBeDefined();
        expect(brandRel?.type).toBe('belongs_to');
        
        // TypeSpec should be generated correctly
        expect(typeSpecCode).toContain('namespace RailsApi');
        expect(typeSpecCode).toContain('model Products');
        expect(typeSpecCode).toContain('price: string;');
        expect(typeSpecCode).toContain('meta_description: string;');
        expect(typeSpecCode).toContain('brand: Brands;');
        expect(typeSpecCode).toContain('variants: ProductVariants[];');

      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });
});