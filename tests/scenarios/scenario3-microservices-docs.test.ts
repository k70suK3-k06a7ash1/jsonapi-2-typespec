/**
 * Test Suite for Scenario 3: Microservices Architecture Documentation
 * Based on USER_SCENARIOS.md - Central API catalog for 15+ microservices
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Ruby, TypeSpec, Generators } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Scenario 3: Microservices Architecture Documentation', () => {
  let tempDir: string;
  let servicesDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'microservices-test-'));
    servicesDir = path.join(tempDir, 'services');
    fs.mkdirSync(servicesDir, { recursive: true });
  });
  
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  interface ServiceSpec {
    name: string;
    version: string;
    serializers: Ruby.RubySerializerClass[];
    typeSpec: string;
    openApi: object;
  }

  function toPascalCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
              .replace(/^([a-z])/, (g) => g.toUpperCase());
  }

  describe('Service Discovery and Parsing', () => {
    const userServiceSerializer = `
module UserService
  class UserSerializer
    include JSONAPI::Serializer
    
    set_type :users
    set_id :uuid
    
    attributes :email, :username, :first_name, :last_name
    
    attribute :display_name do |user|
      "#{user.first_name} #{user.last_name}"
    end
    
    attribute :avatar_url do |user|
      user.avatar&.url || '/default-avatar.png'
    end
    
    has_many :posts
    has_many :followers
    belongs_to :organization
  end
end
    `.trim();

    const productServiceSerializer = `
module ProductService
  class ProductSerializer
    include JSONAPI::Serializer
    
    set_type :products
    set_id :sku
    
    attributes :name, :description, :price, :currency
    
    attribute :formatted_price do |product|
      "#{product.currency} #{product.price}"
    end
    
    attribute :availability do |product|
      product.in_stock? ? 'available' : 'out_of_stock'
    end
    
    has_many :reviews
    has_many :categories
    belongs_to :vendor
  end
end
    `.trim();

    const orderServiceSerializer = `
module OrderService
  class OrderSerializer
    include JSONAPI::Serializer
    
    set_type :orders
    set_id :order_number
    
    attributes :total_amount, :currency, :status, :created_at
    
    attribute :formatted_total do |order|
      "#{order.currency} #{order.total_amount}"
    end
    
    attribute :estimated_delivery do |order|
      order.created_at + 5.days
    end
    
    has_many :order_items
    belongs_to :customer
    belongs_to :shipping_address
  end
end
    `.trim();

    it('should discover and parse multiple microservice serializers', () => {
      // Arrange
      const services = [
        { name: 'user-service', serializers: [userServiceSerializer] },
        { name: 'product-service', serializers: [productServiceSerializer] },
        { name: 'order-service', serializers: [orderServiceSerializer] }
      ];

      // Create service directories and serializer files
      services.forEach(service => {
        const serviceDir = path.join(servicesDir, service.name, 'app', 'serializers');
        fs.mkdirSync(serviceDir, { recursive: true });
        
        service.serializers.forEach((content, index) => {
          const fileName = `${service.name.replace('-', '_')}_serializer_${index}.rb`;
          fs.writeFileSync(path.join(serviceDir, fileName), content);
        });
      });

      // Act
      const discoveredServices: ServiceSpec[] = [];
      
      for (const service of services) {
        const serviceDir = path.join(servicesDir, service.name);
        const serializerFiles = fs.readdirSync(path.join(serviceDir, 'app', 'serializers'), { recursive: true })
          .filter(file => typeof file === 'string' && file.endsWith('.rb'))
          .map(file => path.join(serviceDir, 'app', 'serializers', file as string));

        const serializers = serializerFiles.map(file => 
          Ruby.RubySerializerParser.parseFile(file)
        );

        const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
        const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
          namespace: toPascalCase(service.name),
          generateOperations: true,
          title: `${service.name} API`,
          version: '1.0.0',
        })(serializers);

        const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
        const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
          servers: [
            {
              url: `https://api.company.com/${service.name}/v1`,
              description: `${service.name} production API`
            }
          ]
        });

        discoveredServices.push({
          name: service.name,
          version: '1.0.0',
          serializers,
          typeSpec: typeSpecCode,
          openApi: openApiSpec,
        });
      }

      // Assert
      expect(discoveredServices).toHaveLength(3);
      
      const userService = discoveredServices.find(s => s.name === 'user-service');
      expect(userService).toBeDefined();
      expect(userService!.serializers).toHaveLength(1);
      expect(userService!.typeSpec).toContain('namespace UserService');
      expect(userService!.typeSpec).toContain('model Users');
      
      const productService = discoveredServices.find(s => s.name === 'product-service');
      expect(productService).toBeDefined();
      expect(productService!.serializers[0].resourceType).toBe('products');
      expect(productService!.typeSpec).toContain('namespace ProductService');
      
      const orderService = discoveredServices.find(s => s.name === 'order-service');
      expect(orderService).toBeDefined();
      expect(orderService!.serializers[0].idAttribute).toBe('order_number');
    });

    it('should generate service catalog index', () => {
      // Arrange
      const mockServices: ServiceSpec[] = [
        {
          name: 'user-service',
          version: '1.0.0',
          serializers: [{ className: 'UserSerializer', resourceType: 'users' } as Ruby.RubySerializerClass],
          typeSpec: 'mock typespec',
          openApi: { openapi: '3.0.3' }
        },
        {
          name: 'product-service',
          version: '1.0.0',
          serializers: [{ className: 'ProductSerializer', resourceType: 'products' } as Ruby.RubySerializerClass],
          typeSpec: 'mock typespec',
          openApi: { openapi: '3.0.3' }
        }
      ];

      // Act
      const serviceIndex = {
        title: 'Microservices API Catalog',
        version: '1.0.0',
        services: mockServices.map(service => ({
          name: service.name,
          version: service.version,
          endpoint: `https://api.company.com/${service.name}/v1`,
          documentation: `./services/${service.name}/openapi.yml`,
          typespec: `./services/${service.name}/api.tsp`,
          serializers: service.serializers.length,
        }))
      };

      // Assert
      expect(serviceIndex.title).toBe('Microservices API Catalog');
      expect(serviceIndex.services).toHaveLength(2);
      expect(serviceIndex.services[0].name).toBe('user-service');
      expect(serviceIndex.services[0].endpoint).toBe('https://api.company.com/user-service/v1');
      expect(serviceIndex.services[1].serializers).toBe(1);
    });
  });

  describe('Unified Documentation Generation', () => {
    it('should generate documentation portal structure', () => {
      // Arrange
      const services = [
        { name: 'auth-service', content: 'class AuthSerializer\n  include JSONAPI::Serializer\n  set_type :auth\n  attributes :token\nend' },
        { name: 'billing-service', content: 'class BillingSerializer\n  include JSONAPI::Serializer\n  set_type :billing\n  attributes :amount\nend' }
      ];

      const catalog: ServiceSpec[] = [];

      // Act
      services.forEach(service => {
        const filePath = path.join(tempDir, `${service.name}_serializer.rb`);
        fs.writeFileSync(filePath, service.content);
        const serializer = Ruby.RubySerializerParser.parseFile(filePath);

        const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
          namespace: toPascalCase(service.name),
          generateOperations: true,
          title: `${service.name} API`,
        })([serializer]);

        const jsonApiSchema = Ruby.rubyToJsonApiSchema([serializer]);
        const openApiSpec = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema);

        catalog.push({
          name: service.name,
          version: '1.0.0',
          serializers: [serializer],
          typeSpec: typeSpecCode,
          openApi: openApiSpec,
        });
      });

      // Generate documentation structure
      const docsDir = path.join(tempDir, 'docs');
      fs.mkdirSync(docsDir, { recursive: true });

      catalog.forEach(service => {
        const serviceDir = path.join(docsDir, 'services', service.name);
        fs.mkdirSync(serviceDir, { recursive: true });
        
        fs.writeFileSync(path.join(serviceDir, 'api.tsp'), service.typeSpec);
        Generators.YamlOutput.saveToYamlFile(service.openApi, path.join(serviceDir, 'openapi.yml'));
        
        const sdkExamples = generateSDKExamples(service);
        fs.writeFileSync(path.join(serviceDir, 'sdk-examples.md'), sdkExamples);
      });

      // Assert
      expect(fs.existsSync(path.join(docsDir, 'services', 'auth-service', 'api.tsp'))).toBe(true);
      expect(fs.existsSync(path.join(docsDir, 'services', 'auth-service', 'openapi.yml'))).toBe(true);
      expect(fs.existsSync(path.join(docsDir, 'services', 'auth-service', 'sdk-examples.md'))).toBe(true);
      
      expect(fs.existsSync(path.join(docsDir, 'services', 'billing-service', 'api.tsp'))).toBe(true);
      expect(fs.existsSync(path.join(docsDir, 'services', 'billing-service', 'openapi.yml'))).toBe(true);
      
      // Check content
      const authTypeSpec = fs.readFileSync(path.join(docsDir, 'services', 'auth-service', 'api.tsp'), 'utf8');
      expect(authTypeSpec).toContain('namespace AuthService');
      expect(authTypeSpec).toContain('model Auths');
    });

    function generateSDKExamples(service: ServiceSpec): string {
      return `# ${service.name} SDK Examples

## TypeScript Client
\`\`\`typescript
import { ${toPascalCase(service.name)}Client } from '@company/api-clients';

const client = new ${toPascalCase(service.name)}Client({
  baseURL: 'https://api.company.com/${service.name}/v1',
  apiKey: process.env.API_KEY
});

// Type-safe API calls generated from Ruby serializers
const items = await client.${service.serializers[0].resourceType}.list();
\`\`\`

## cURL Examples
\`\`\`bash
# Generated from Ruby serializer definitions
curl -X GET "https://api.company.com/${service.name}/v1/${service.serializers[0].resourceType}" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/vnd.api+json"
\`\`\`
`;
    }

    it('should handle services with no serializers gracefully', () => {
      // Arrange
      const emptyServiceDir = path.join(servicesDir, 'empty-service', 'app', 'serializers');
      fs.mkdirSync(emptyServiceDir, { recursive: true });

      // Act
      const serializerFiles = fs.readdirSync(emptyServiceDir)
        .filter(file => file.endsWith('.rb'));

      const serializers = serializerFiles.map(file => 
        Ruby.RubySerializerParser.parseFile(path.join(emptyServiceDir, file))
      );

      // Assert
      expect(serializerFiles).toHaveLength(0);
      expect(serializers).toHaveLength(0);
    });

    it('should generate cross-service documentation links', () => {
      // Arrange
      const userSerializer = `
class UserSerializer
  include JSONAPI::Serializer
  set_type :users
  attributes :name
  has_many :orders  # Links to order-service
end
      `.trim();

      const orderSerializer = `
class OrderSerializer
  include JSONAPI::Serializer
  set_type :orders
  attributes :total
  belongs_to :user  # Links to user-service
end
      `.trim();

      // Act
      const userFilePath = path.join(tempDir, 'user_serializer.rb');
      const orderFilePath = path.join(tempDir, 'order_serializer.rb');
      
      fs.writeFileSync(userFilePath, userSerializer);
      fs.writeFileSync(orderFilePath, orderSerializer);

      const userParsed = Ruby.RubySerializerParser.parseFile(userFilePath);
      const orderParsed = Ruby.RubySerializerParser.parseFile(orderFilePath);

      // Assert - Check relationships that span services
      const userOrdersRel = userParsed.relationships.find(r => r.name === 'orders');
      expect(userOrdersRel).toBeDefined();
      expect(userOrdersRel?.type).toBe('has_many');
      
      const orderUserRel = orderParsed.relationships.find(r => r.name === 'user');
      expect(orderUserRel).toBeDefined();
      expect(orderUserRel?.type).toBe('belongs_to');
    });
  });

  describe('Automated Monitoring and Updates', () => {
    it('should detect serializer changes and trigger updates', () => {
      // Arrange
      const originalSerializer = `
class MonitoredSerializer
  include JSONAPI::Serializer
  set_type :monitored
  attributes :name
end
      `.trim();

      const updatedSerializer = `
class MonitoredSerializer
  include JSONAPI::Serializer
  set_type :monitored
  attributes :name, :description  # Added new attribute
end
      `.trim();

      const filePath = path.join(tempDir, 'monitored_serializer.rb');
      fs.writeFileSync(filePath, originalSerializer);

      // Act - Parse original
      const originalParsed = Ruby.RubySerializerParser.parseFile(filePath);
      expect(originalParsed.attributes).toHaveLength(1);

      // Update file
      fs.writeFileSync(filePath, updatedSerializer);

      // Parse updated
      const updatedParsed = Ruby.RubySerializerParser.parseFile(filePath);

      // Assert
      expect(updatedParsed.attributes).toHaveLength(2);
      expect(updatedParsed.attributes.find(a => a.name === 'description')).toBeDefined();
    });

    it('should handle parsing errors gracefully during monitoring', () => {
      // Arrange
      const invalidSerializer = `
class InvalidSerializer
  include JSONAPI::Serializer
  set_type :invalid
  attributes :name
  # Missing end statement
      `.trim();

      const filePath = path.join(tempDir, 'invalid_serializer.rb');
      fs.writeFileSync(filePath, invalidSerializer);

      // Act & Assert
      expect(() => {
        Ruby.RubySerializerParser.parseFile(filePath);
      }).toThrow();
    });
  });

  describe('Service Performance and Scalability', () => {
    it('should handle large number of services efficiently', () => {
      // Arrange
      const serviceCount = 20;
      const services: ServiceSpec[] = [];

      // Generate many services
      for (let i = 0; i < serviceCount; i++) {
        const content = `
class Service${i}Serializer
  include JSONAPI::Serializer
  set_type :service${i}
  attributes :name, :value_${i}
  has_many :items
end
        `.trim();

        const filePath = path.join(tempDir, `service_${i}_serializer.rb`);
        fs.writeFileSync(filePath, content);
        const serializer = Ruby.RubySerializerParser.parseFile(filePath);

        services.push({
          name: `service-${i}`,
          version: '1.0.0',
          serializers: [serializer],
          typeSpec: '',
          openApi: {}
        });
      }

      // Act
      const startTime = Date.now();
      
      services.forEach(service => {
        const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
          namespace: `Service${service.name.split('-')[1]}`,
          generateOperations: true,
        })(service.serializers);
        
        service.typeSpec = typeSpecCode;
      });

      const endTime = Date.now();

      // Assert
      expect(services).toHaveLength(serviceCount);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
      
      // Verify all services were processed
      services.forEach(service => {
        expect(service.typeSpec).toContain('namespace Service');
      });
    });

    it('should generate consolidated service statistics', () => {
      // Arrange
      const services = [
        { serializers: ['UserSerializer', 'ProfileSerializer'] },
        { serializers: ['ProductSerializer'] },
        { serializers: ['OrderSerializer', 'PaymentSerializer', 'ShippingSerializer'] }
      ];

      // Act
      const stats = {
        totalServices: services.length,
        totalSerializers: services.reduce((sum, service) => sum + service.serializers.length, 0),
        averageSerializersPerService: services.reduce((sum, service) => sum + service.serializers.length, 0) / services.length,
        servicesBySerializerCount: services.reduce((acc, service) => {
          const count = service.serializers.length;
          acc[count] = (acc[count] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      };

      // Assert
      expect(stats.totalServices).toBe(3);
      expect(stats.totalSerializers).toBe(6);
      expect(stats.averageSerializersPerService).toBe(2);
      expect(stats.servicesBySerializerCount[1]).toBe(1); // 1 service with 1 serializer
      expect(stats.servicesBySerializerCount[2]).toBe(1); // 1 service with 2 serializers
      expect(stats.servicesBySerializerCount[3]).toBe(1); // 1 service with 3 serializers
    });
  });
});