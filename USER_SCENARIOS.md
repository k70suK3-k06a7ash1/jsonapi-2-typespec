# User Scenarios: Ruby Integration

This document outlines practical user scenarios for the Ruby on Rails jsonapi-serializer integration with TypeSpec conversion.

## Scenario 1: Legacy Rails API Migration to TypeSpec

### Background
**Team**: Full-stack development team at a SaaS company  
**Challenge**: Migrating a 5-year-old Ruby on Rails API to a modern TypeScript/TypeSpec-based architecture  
**Goal**: Maintain API compatibility while modernizing the stack

### Current State
```ruby
# app/serializers/api/v1/user_serializer.rb
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
```

### Migration Process

#### Step 1: Analyze Existing Serializers
```bash
# Discover all serializers in the Rails app
find app/serializers -name "*.rb" | head -10
```

#### Step 2: Convert to TypeSpec
```typescript
import { Ruby } from 'jsonapi-2-typespec';
import * as fs from 'fs';
import * as path from 'path';

// Parse existing Ruby serializers
const serializerFiles = [
  'app/serializers/api/v1/user_serializer.rb',
  'app/serializers/api/v1/project_serializer.rb',
  'app/serializers/api/v1/organization_serializer.rb'
];

const rubySerializers = serializerFiles.map(file => 
  Ruby.RubySerializerParser.parseFile(file)
);

// Convert to TypeSpec using functional pipeline
const typeSpecPipeline = Ruby.rubyToOutputPipeline('typespec', {
  namespace: 'ApiV1',
  generateOperations: true,
  includeRelationships: true,
  title: 'Legacy API v1',
  version: '1.0.0',
});

const typeSpecCode = typeSpecPipeline(rubySerializers);
fs.writeFileSync('./api-v1.tsp', typeSpecCode);

console.log('✅ Converted 3 Ruby serializers to TypeSpec');
```

#### Step 3: Generate OpenAPI Documentation
```typescript
// Generate comprehensive API documentation
const jsonApiSchema = Ruby.rubyToJsonApiSchema(rubySerializers);

const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
  jsonApiFormat: true,
  servers: [
    {
      url: 'https://api.mycompany.com/v1',
      description: 'Production API'
    }
  ]
});

Generators.YamlOutput.saveToYamlFile(openApiSpec, './legacy-api-docs.yml');
```

### Outcome
- **Migration Time**: Reduced from 2 weeks to 2 days
- **API Compatibility**: 100% maintained through automated conversion
- **Documentation**: Auto-generated OpenAPI specs for frontend teams
- **Type Safety**: New TypeScript clients generated from TypeSpec

---

## Scenario 2: Multi-Platform API Design

### Background
**Team**: API platform team at a fintech startup  
**Challenge**: Building APIs that serve mobile, web, and partner integrations  
**Goal**: Single source of truth for API specifications across multiple platforms

### Requirements
- Ruby backend (existing Rails infrastructure)
- TypeScript frontend (React Native + Next.js)
- Partner API documentation (OpenAPI)
- GraphQL gateway (future requirement)

### Implementation

#### Step 1: Design with Ruby Serializers
```ruby
# app/serializers/financial/account_serializer.rb
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
```

#### Step 2: Generate Multi-Platform Specifications
```typescript
import { Ruby, TypeSpec, Generators } from 'jsonapi-2-typespec';

async function generatePlatformSpecs() {
  // Parse Ruby serializers
  const serializers = [
    Ruby.RubySerializerParser.parseFile('./app/serializers/financial/account_serializer.rb'),
    Ruby.RubySerializerParser.parseFile('./app/serializers/financial/transaction_serializer.rb'),
    Ruby.RubySerializerParser.parseFile('./app/serializers/financial/customer_serializer.rb'),
  ];

  // Generate TypeSpec for TypeScript clients
  const typeSpecResult = Ruby.rubyToTypeSpecPipeline({
    namespace: 'FinancialApi',
    generateOperations: true,
    title: 'Financial API',
    version: '2.0.0',
  })(serializers);

  // Generate OpenAPI for partners
  const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
  const openApiSpec = new Generators.OpenApiFromJsonApiGenerator()
    .generate(jsonApiSchema, {
      servers: [
        { url: 'https://api.fintech.com/v2', description: 'Production' },
        { url: 'https://sandbox.fintech.com/v2', description: 'Sandbox' }
      ]
    });

  // Save all formats
  fs.writeFileSync('./specs/financial-api.tsp', typeSpecResult);
  Generators.YamlOutput.saveToYamlFile(openApiSpec, './specs/financial-api-openapi.yml');
  Generators.YamlOutput.saveToJsonFile(openApiSpec, './specs/financial-api-openapi.json');
  
  console.log('✅ Generated specifications for all platforms');
}

generatePlatformSpecs();
```

#### Step 3: Automated CI/CD Integration
```yaml
# .github/workflows/api-specs.yml
name: Generate API Specifications
on:
  push:
    paths: ['app/serializers/**/*.rb']

jobs:
  generate-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install jsonapi-2-typespec
      
      - name: Generate API specs
        run: |
          npx ts-node scripts/generate-specs.ts
          
      - name: Upload to artifact registry
        run: |
          # Upload TypeSpec to internal registry
          # Update partner documentation portal
          # Trigger client SDK generation
```

### Results
- **Consistency**: Single Ruby source generates all platform specifications
- **Automation**: CI/CD pipeline updates all specs when serializers change
- **Developer Experience**: TypeScript developers get type-safe clients
- **Partner Integration**: Always up-to-date OpenAPI documentation

---

## Scenario 3: Microservices Architecture Documentation

### Background
**Team**: Platform engineering team at an e-commerce company  
**Challenge**: 15+ microservices with inconsistent API documentation  
**Goal**: Centralized API catalog with automated documentation generation

### Architecture
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   User Service  │  │ Product Service │  │ Order Service   │
│   (Ruby/Rails)  │  │   (Ruby/Rails)  │  │  (Ruby/Rails)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                ┌─────────────────────────────┐
                │   API Documentation         │
                │   Generation Pipeline       │
                │   (jsonapi-2-typespec)      │
                └─────────────────────────────┘
                               │
                ┌─────────────────────────────┐
                │    Centralized API          │
                │    Documentation Portal     │
                └─────────────────────────────┘
```

### Implementation

#### Step 1: Service Discovery and Parsing
```typescript
// scripts/generate-service-catalog.ts
import { Ruby } from 'jsonapi-2-typespec';
import * as glob from 'glob';
import * as path from 'path';

interface ServiceSpec {
  name: string;
  version: string;
  serializers: Ruby.RubySerializerClass[];
  typeSpec: string;
  openApi: object;
}

async function generateServiceCatalog(): Promise<ServiceSpec[]> {
  const services = [
    { name: 'user-service', path: './services/user-service' },
    { name: 'product-service', path: './services/product-service' },
    { name: 'order-service', path: './services/order-service' },
  ];

  const catalog: ServiceSpec[] = [];

  for (const service of services) {
    console.log(`🔍 Processing ${service.name}...`);
    
    // Find all serializers in service
    const serializerFiles = glob.sync(
      `${service.path}/app/serializers/**/*_serializer.rb`
    );
    
    // Parse Ruby serializers
    const serializers = serializerFiles.map(file => {
      try {
        return Ruby.RubySerializerParser.parseFile(file);
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}: ${error.message}`);
        return null;
      }
    }).filter(Boolean);

    if (serializers.length === 0) {
      console.log(`⚠️  No serializers found in ${service.name}`);
      continue;
    }

    // Generate TypeSpec
    const typeSpecConverter = Ruby.jsonApiToTypeSpec({
      namespace: toPascalCase(service.name),
      generateOperations: true,
      title: `${service.name} API`,
      version: '1.0.0',
    });

    const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
    const typeSpecDefinition = typeSpecConverter(jsonApiSchema);
    const typeSpecCode = new TypeSpec.TypeSpecGenerator()
      .generateDefinition(typeSpecDefinition);

    // Generate OpenAPI
    const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
    const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
      servers: [
        {
          url: `https://api.company.com/${service.name}/v1`,
          description: `${service.name} production API`
        }
      ]
    });

    catalog.push({
      name: service.name,
      version: '1.0.0',
      serializers,
      typeSpec: typeSpecCode,
      openApi: openApiSpec,
    });

    console.log(`✅ Generated specs for ${service.name} (${serializers.length} serializers)`);
  }

  return catalog;
}

function toPascalCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            .replace(/^([a-z])/, (g) => g.toUpperCase());
}
```

#### Step 2: Generate Unified Documentation
```typescript
// scripts/build-documentation-portal.ts
async function buildDocumentationPortal() {
  const catalog = await generateServiceCatalog();
  
  // Create service index
  const serviceIndex = {
    title: 'Microservices API Catalog',
    version: '1.0.0',
    services: catalog.map(service => ({
      name: service.name,
      version: service.version,
      endpoint: `https://api.company.com/${service.name}/v1`,
      documentation: `./services/${service.name}/openapi.yml`,
      typespec: `./services/${service.name}/api.tsp`,
      serializers: service.serializers.length,
    }))
  };

  // Save individual service specs
  for (const service of catalog) {
    const serviceDir = `./docs/services/${service.name}`;
    fs.mkdirSync(serviceDir, { recursive: true });
    
    // Save TypeSpec
    fs.writeFileSync(
      path.join(serviceDir, 'api.tsp'),
      service.typeSpec
    );
    
    // Save OpenAPI
    Generators.YamlOutput.saveToYamlFile(
      service.openApi,
      path.join(serviceDir, 'openapi.yml')
    );
    
    // Generate SDK examples
    const sdkExamples = generateSDKExamples(service);
    fs.writeFileSync(
      path.join(serviceDir, 'sdk-examples.md'),
      sdkExamples
    );
  }

  // Save catalog index
  fs.writeFileSync(
    './docs/service-catalog.json',
    JSON.stringify(serviceIndex, null, 2)
  );

  console.log(`🎉 Generated documentation portal for ${catalog.length} services`);
  console.log('📖 Documentation available at: ./docs/');
}

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
const users = await client.users.list();
const user = await client.users.get(userId);
\`\`\`

## cURL Examples
\`\`\`bash
# Generated from Ruby serializer definitions
curl -X GET "https://api.company.com/${service.name}/v1/users" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/vnd.api+json"
\`\`\`
`;
}

buildDocumentationPortal();
```

#### Step 3: Automated Monitoring and Updates
```typescript
// scripts/monitor-serializers.ts
import { watch } from 'chokidar';

function startSerializerMonitoring() {
  const watcher = watch('./services/*/app/serializers/**/*.rb', {
    persistent: true
  });

  watcher.on('change', async (filePath) => {
    console.log(`📝 Serializer changed: ${filePath}`);
    
    try {
      // Re-parse changed serializer
      const serializer = Ruby.RubySerializerParser.parseFile(filePath);
      console.log(`✅ Successfully parsed ${serializer.className}`);
      
      // Trigger documentation regeneration
      await buildDocumentationPortal();
      
      // Notify development teams
      await notifyTeams({
        message: `API specification updated for ${path.dirname(filePath)}`,
        changes: [`Updated ${serializer.className}`],
        documentation: `https://docs.company.com/api/${extractServiceName(filePath)}`
      });
      
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error.message);
      
      // Notify about parsing errors
      await notifyTeams({
        level: 'error',
        message: `Serializer parsing failed: ${filePath}`,
        error: error.message
      });
    }
  });

  console.log('👀 Monitoring serializer changes...');
}

function extractServiceName(filePath: string): string {
  const match = filePath.match(/services\/([^\/]+)\//);
  return match ? match[1] : 'unknown';
}

async function notifyTeams(notification: any) {
  // Slack, Teams, or other notification integration
  console.log('📢 Notification:', notification);
}

startSerializerMonitoring();
```

### Results
- **Centralized Documentation**: All 15 microservices documented from a single pipeline
- **Real-time Updates**: Documentation automatically updates when serializers change
- **Developer Productivity**: Teams spend 80% less time on API documentation
- **API Consistency**: Enforced standards across all services through automation
- **Cross-team Collaboration**: Standardized format improves service discovery

---

## Scenario 4: API Versioning and Backward Compatibility

### Background
**Team**: API product team at a social media platform  
**Challenge**: Managing API versioning while maintaining backward compatibility  
**Goal**: Automated detection of breaking changes and documentation generation

### Implementation

#### Step 1: Version Comparison Pipeline
```typescript
// scripts/api-version-manager.ts
import { Ruby, JsonApi } from 'jsonapi-2-typespec';
import * as semver from 'semver';

interface VersionComparison {
  version: string;
  breaking: boolean;
  changes: ApiChange[];
  compatibility: 'major' | 'minor' | 'patch';
}

interface ApiChange {
  type: 'added' | 'removed' | 'modified';
  severity: 'breaking' | 'non-breaking';
  element: string;
  description: string;
}

async function compareApiVersions(
  currentPath: string, 
  previousPath: string
): Promise<VersionComparison> {
  
  // Parse current serializers
  const currentSerializers = parseDirectory(currentPath);
  const currentSchema = Ruby.rubyToJsonApiSchema(currentSerializers);
  
  // Parse previous serializers
  const previousSerializers = parseDirectory(previousPath);
  const previousSchema = Ruby.rubyToJsonApiSchema(previousSerializers);
  
  // Analyze changes
  const changes = analyzeSchemaChanges(previousSchema, currentSchema);
  const hasBreaking = changes.some(change => change.severity === 'breaking');
  
  return {
    version: semver.inc(getCurrentVersion(), hasBreaking ? 'major' : 'minor'),
    breaking: hasBreaking,
    changes,
    compatibility: hasBreaking ? 'major' : 'minor'
  };
}

function analyzeSchemaChanges(
  previous: JsonApi.JsonApiSchema, 
  current: JsonApi.JsonApiSchema
): ApiChange[] {
  const changes: ApiChange[] = [];
  
  // Compare serializers
  const prevSerializers = new Map(previous.serializers.map(s => [s.name, s]));
  const currSerializers = new Map(current.serializers.map(s => [s.name, s]));
  
  // Check for removed serializers (breaking)
  for (const [name, serializer] of prevSerializers) {
    if (!currSerializers.has(name)) {
      changes.push({
        type: 'removed',
        severity: 'breaking',
        element: `serializer.${name}`,
        description: `Removed serializer: ${name}`
      });
    }
  }
  
  // Check for added serializers (non-breaking)
  for (const [name, serializer] of currSerializers) {
    if (!prevSerializers.has(name)) {
      changes.push({
        type: 'added',
        severity: 'non-breaking',
        element: `serializer.${name}`,
        description: `Added serializer: ${name}`
      });
    }
  }
  
  // Compare existing serializers
  for (const [name, current] of currSerializers) {
    const previous = prevSerializers.get(name);
    if (previous) {
      const serializerChanges = compareSerializers(previous, current);
      changes.push(...serializerChanges);
    }
  }
  
  return changes;
}

function compareSerializers(
  previous: JsonApi.JsonApiSerializer,
  current: JsonApi.JsonApiSerializer
): ApiChange[] {
  const changes: ApiChange[] = [];
  
  // Compare attributes
  const prevAttrs = new Map(previous.resource.attributes.map(a => [a.name, a]));
  const currAttrs = new Map(current.resource.attributes.map(a => [a.name, a]));
  
  // Removed attributes (breaking)
  for (const [name, attr] of prevAttrs) {
    if (!currAttrs.has(name)) {
      changes.push({
        type: 'removed',
        severity: 'breaking',
        element: `${previous.name}.${name}`,
        description: `Removed attribute: ${name}`
      });
    }
  }
  
  // Added attributes (non-breaking)
  for (const [name, attr] of currAttrs) {
    if (!prevAttrs.has(name)) {
      changes.push({
        type: 'added',
        severity: 'non-breaking',
        element: `${current.name}.${name}`,
        description: `Added attribute: ${name}`
      });
    }
  }
  
  // Modified attributes
  for (const [name, currentAttr] of currAttrs) {
    const previousAttr = prevAttrs.get(name);
    if (previousAttr) {
      // Type changes are breaking
      if (previousAttr.type !== currentAttr.type) {
        changes.push({
          type: 'modified',
          severity: 'breaking',
          element: `${current.name}.${name}`,
          description: `Changed type from ${previousAttr.type} to ${currentAttr.type}`
        });
      }
      
      // Making nullable -> non-nullable is breaking
      if (previousAttr.nullable && !currentAttr.nullable) {
        changes.push({
          type: 'modified',
          severity: 'breaking',
          element: `${current.name}.${name}`,
          description: `Made attribute non-nullable: ${name}`
        });
      }
    }
  }
  
  return changes;
}
```

#### Step 2: Automated Version Management
```typescript
// scripts/release-manager.ts
async function prepareApiRelease() {
  const comparison = await compareApiVersions(
    './app/serializers',
    './previous-version/app/serializers'
  );
  
  console.log(`📋 API Version Analysis`);
  console.log(`Proposed version: ${comparison.version}`);
  console.log(`Breaking changes: ${comparison.breaking ? 'YES' : 'NO'}`);
  console.log(`Total changes: ${comparison.changes.length}`);
  
  // Generate changelog
  const changelog = generateChangelog(comparison);
  fs.writeFileSync('./CHANGELOG.md', changelog);
  
  // Generate migration guide for breaking changes
  if (comparison.breaking) {
    const migrationGuide = generateMigrationGuide(comparison);
    fs.writeFileSync('./MIGRATION.md', migrationGuide);
  }
  
  // Generate version-specific documentation
  await generateVersionedDocs(comparison.version);
  
  // Update API client SDKs
  await updateClientSDKs(comparison.version);
  
  console.log('✅ Release preparation complete');
}

function generateChangelog(comparison: VersionComparison): string {
  const breaking = comparison.changes.filter(c => c.severity === 'breaking');
  const nonBreaking = comparison.changes.filter(c => c.severity === 'non-breaking');
  
  return `# Changelog - v${comparison.version}

## 🚨 Breaking Changes
${breaking.map(change => `- **${change.element}**: ${change.description}`).join('\n')}

## ✨ New Features
${nonBreaking.filter(c => c.type === 'added').map(change => `- **${change.element}**: ${change.description}`).join('\n')}

## 🔧 Improvements
${nonBreaking.filter(c => c.type === 'modified').map(change => `- **${change.element}**: ${change.description}`).join('\n')}

Generated from Ruby serializer analysis on ${new Date().toISOString()}
`;
}

async function generateVersionedDocs(version: string) {
  // Parse current serializers
  const serializers = parseDirectory('./app/serializers');
  
  // Generate TypeSpec with version
  const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
    namespace: 'ApiV' + version.replace(/\./g, ''),
    title: `Social Media API v${version}`,
    version: version,
    generateOperations: true,
  })(serializers);
  
  // Generate OpenAPI with version
  const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
  const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
  const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
    info: { version },
    servers: [
      { url: `https://api.social.com/v${version.split('.')[0]}` }
    ]
  });
  
  // Save versioned documentation
  const versionDir = `./docs/versions/v${version}`;
  fs.mkdirSync(versionDir, { recursive: true });
  
  fs.writeFileSync(path.join(versionDir, 'api.tsp'), typeSpecCode);
  Generators.YamlOutput.saveToYamlFile(openApiSpec, path.join(versionDir, 'openapi.yml'));
}
```

### Results
- **Automated Versioning**: Semantic versioning based on actual API changes
- **Breaking Change Detection**: Automatic identification of backward compatibility issues
- **Migration Guides**: Auto-generated documentation for version upgrades
- **Client SDK Updates**: Coordinated updates across all platform SDKs
- **Release Confidence**: 100% accuracy in change impact assessment

---

## Summary

These user scenarios demonstrate how the Ruby integration provides practical value across different organizational contexts:

1. **Legacy Migration**: Reduces migration time from weeks to days while maintaining compatibility
2. **Multi-Platform APIs**: Enables single-source-of-truth approach for diverse client needs
3. **Microservices Documentation**: Scales API documentation across distributed architectures
4. **Version Management**: Automates complex versioning and compatibility analysis

The functional composition approach and Ruby AST parsing capabilities make the tool valuable for real-world enterprise use cases where API consistency, automation, and developer productivity are critical.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Research jsonapi-serializer gem syntax and structure", "status": "completed", "priority": "high", "id": "1"}, {"content": "Create Ruby serializer parser for jsonapi-serializer gem", "status": "completed", "priority": "high", "id": "2"}, {"content": "Implement Ruby to JSON API schema converter", "status": "completed", "priority": "high", "id": "3"}, {"content": "Create Ruby to TypeSpec direct converter", "status": "completed", "priority": "medium", "id": "4"}, {"content": "Add sample Ruby serializer files to sandbox", "status": "completed", "priority": "medium", "id": "5"}, {"content": "Update README.md with Ruby integration documentation", "status": "completed", "priority": "low", "id": "6"}, {"content": "Update README_ja.md with Ruby integration documentation", "status": "completed", "priority": "low", "id": "7"}, {"content": "Create user scenario examples for Ruby integration", "status": "completed", "priority": "medium", "id": "8"}]