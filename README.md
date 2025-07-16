# JSON API ⇄ TypeSpec Converter

A bidirectional conversion tool between JSON API serializers and TypeSpec with automatic OpenAPI schema generation.

## Overview

This repository enables seamless conversion between JSON API serializer definitions and TypeSpec, providing a unified approach to API specification management with automatic documentation generation.

## Key Features

- **Bidirectional Conversion**: Convert between JSON API serializers and TypeSpec in both directions
- **OpenAPI Generation**: Automatically generate OpenAPI schemas from both formats
- **Documentation Synchronization**: Maintain consistency across all documentation formats
- **Single Source of Truth**: Use either JSON API or TypeSpec as the authoritative source

## Architecture

### Core Actors

This repository operates with three main actors:

1. **OpenAPI Schema** - Standard API specification format
2. **TypeSpec** - Microsoft's API definition language  
3. **JSON API Serializer** - Data model definitions following JSON API specification

### Actor Relation Map

```
┌─────────────────┐    bidirectional    ┌─────────────────┐
│   JSON API      │◄────conversion────►│    TypeSpec     │
│   Serializer    │                    │                 │
│  (Data Model)   │                    │                 │
└─────────┬───────┘                    └─────────┬───────┘
          │                                      │
          │ generate                   generate  │
          ▼                                      ▼
     ┌─────────────────────────────────────────────────┐
     │              OpenAPI Schema                     │
     │           (Documentation Output)                │
     └─────────────────────────────────────────────────┘
```

### Conversion Matrix

| From → To | JSON API Serializer | TypeSpec | OpenAPI Schema |
|-----------|-------------------|----------|----------------|
| **JSON API Serializer** | ✓ (identity) | ✓ (convert) | ✓ (generate) |
| **TypeSpec** | ✓ (convert) | ✓ (identity) | ✓ (generate) |
| **OpenAPI Schema** | ✗ (read-only) | ✗ (read-only) | ✓ (identity) |

**Note**: OpenAPI Schema serves as the final documentation output and does not convert back to source formats.

## Project Structure

```
jsonapi-2-typespec/
├── src/
│   ├── json-api/           # JSON API serializer definitions
│   ├── typespec/           # TypeSpec definitions
│   ├── converters/         # Bidirectional conversion logic
│   └── generators/         # OpenAPI schema generators
├── docs/                   # Generated documentation (auto-updated)
├── README.md              # English documentation
└── README_JP.md           # Japanese documentation
```

## Documentation Management

### Single Source of Truth (SSoT)

- **Primary Sources**: JSON API serializers and TypeSpec definitions
- **Generated Assets**: All documentation automatically derived from sources
- **Version Control**: Complete change history for all definitions
- **Consistency**: Automatic synchronization prevents documentation drift

### Automatic Updates

When source definitions are modified, the system automatically updates:

- README files (English and Japanese)
- OpenAPI specifications
- Generated documentation
- All derived formats

This ensures immediate propagation of changes across the entire documentation ecosystem.

## Installation

```bash
npm install jsonapi-2-typespec
```

## Quick Start

### Input/Output Example

#### Input: JSON API Schema
```json
{
  "title": "Blog API",
  "version": "1.0.0",
  "serializers": [
    {
      "name": "ArticleSerializer",
      "resource": {
        "type": "articles",
        "attributes": [
          { "name": "title", "type": "string" },
          { "name": "content", "type": "string" },
          { "name": "published_at", "type": "date", "nullable": true },
          { "name": "status", "type": "string", "enum": ["draft", "published"] }
        ],
        "relationships": [
          { "name": "author", "type": "belongs_to", "resource": "authors" }
        ]
      }
    }
  ]
}
```

#### Basic Usage Code
```typescript
import {
  JsonApi,
  TypeSpec,
  Converters,
  Generators,
} from 'jsonapi-2-typespec';

// Load JSON API schema
const jsonApiSchema: JsonApi.JsonApiSchema = require('./blog-schema.json');

// Convert JSON API to TypeSpec
const converter = new Converters.JsonApiToTypeSpecConverter();
const result = converter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  generateOperations: true,
});

// Generate TypeSpec code
const generator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = generator.generateDefinition(result.data);
console.log(typeSpecCode);
```

#### Output: Generated TypeSpec
```typespec
import "@typespec/rest";
import "@typespec/openapi3";

@service({
  title: "Blog API",
  version: "1.0.0"
})
namespace BlogApi {

  /** Blog article resource */
  @discriminator("type")
  model Articles {
    title: string;
    content: string;
    published_at?: utcDateTime | null;
    status: "draft" | "published";
    author: Authors;
  }

  /** List articles resources */
  @route("/articles")
  @get
  op listArticles(): Articles[];

  /** Get articles resource */
  @route("/articles/{id}")
  @get
  op getArticles(id: string): Articles;

  /** Create articles resource */
  @route("/articles")
  @post
  op createArticles(body: Articles): Articles;
}
```

#### Output: Generated OpenAPI
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Blog API",
    "version": "1.0.0"
  },
  "paths": {
    "/articles": {
      "get": {
        "summary": "List articles resources",
        "operationId": "listArticles",
        "responses": {
          "200": {
            "description": "List of articles resources",
            "content": {
              "application/vnd.api+json": {
                "schema": {
                  "$ref": "#/components/schemas/ArticlesCollection"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Articles": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["articles"] },
          "title": { "type": "string" },
          "content": { "type": "string" },
          "published_at": { "type": "string", "format": "date-time", "nullable": true },
          "status": { "type": "string", "enum": ["draft", "published"] }
        },
        "required": ["id", "type", "title", "content", "status"]
      }
    }
  }
}
```

## API Reference

### Core Modules

- **`JsonApi`** - JSON API serializer types and utilities
- **`TypeSpec`** - TypeSpec definition types and code generation
- **`Converters`** - Bidirectional conversion between formats
- **`Generators`** - OpenAPI schema generation from both formats

### JSON API to TypeSpec Conversion

```typescript
import { Converters } from 'jsonapi-2-typespec';

const converter = new Converters.JsonApiToTypeSpecConverter();
const result = converter.convert(jsonApiSchema, {
  namespace: 'MyApi',           // Custom namespace
  includeRelationships: true,   // Include relationships (default: true)
  generateOperations: true,     // Generate CRUD operations
  title: 'My API',             // API title
  version: '1.0.0',            // API version
});

// Check for conversion errors/warnings
if (result.errors.length > 0) {
  console.error('Conversion errors:', result.errors);
}
if (result.warnings.length > 0) {
  console.warn('Conversion warnings:', result.warnings);
}
```

### TypeSpec to JSON API Conversion

```typescript
import { Converters } from 'jsonapi-2-typespec';

const converter = new Converters.TypeSpecToJsonApiConverter();
const result = converter.convert(typeSpecDefinition, {
  namespace: 'MyApi',
  includeRelationships: true,
});
```

### OpenAPI Generation

#### From JSON API

```typescript
import { Generators } from 'jsonapi-2-typespec';

const generator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = generator.generate(jsonApiSchema, {
  jsonApiFormat: true,        // Use JSON API format (default: false)
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server',
    },
  ],
});
```

#### From TypeSpec

```typescript
import { Generators } from 'jsonapi-2-typespec';

const generator = new Generators.OpenApiFromTypeSpecGenerator();
const openApiSpec = generator.generate(typeSpecDefinition, {
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server',
    },
  ],
});
```

### Complete Workflow Example

#### 1. Input Files

**`blog-schema.json`** (JSON API Schema)
```json
{
  "title": "Blog API",
  "version": "1.0.0",
  "serializers": [
    {
      "name": "ArticleSerializer",
      "resource": {
        "type": "articles",
        "attributes": [
          { "name": "title", "type": "string" },
          { "name": "content", "type": "string" },
          { "name": "published_at", "type": "date", "nullable": true }
        ],
        "relationships": [
          { "name": "author", "type": "belongs_to", "resource": "authors" }
        ]
      }
    }
  ]
}
```

#### 2. Conversion Script

**`convert.ts`**
```typescript
import fs from 'fs';
import path from 'path';
import { JsonApi, TypeSpec, Converters, Generators } from 'jsonapi-2-typespec';

// Load input schema
const schemaPath = path.join(__dirname, 'blog-schema.json');
const jsonApiSchema: JsonApi.JsonApiSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Convert to TypeSpec
const converter = new Converters.JsonApiToTypeSpecConverter();
const typeSpecResult = converter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  generateOperations: true,
});

// Generate TypeSpec code
const generator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = generator.generateDefinition(typeSpecResult.data);

// Generate OpenAPI
const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = openApiGenerator.generate(jsonApiSchema);

// Write output files
fs.writeFileSync('blog-api.tsp', typeSpecCode);
fs.writeFileSync('blog-openapi.json', JSON.stringify(openApiSpec, null, 2));

console.log('✅ Conversion completed!');
console.log('📄 Generated files:');
console.log('  - blog-api.tsp (TypeSpec)');
console.log('  - blog-openapi.json (OpenAPI)');
```

#### 3. Execution Result

```bash
$ npx ts-node convert.ts
✅ Conversion completed!
📄 Generated files:
  - blog-api.tsp (TypeSpec)
  - blog-openapi.json (OpenAPI)
```

#### 4. Output Files

**`blog-api.tsp`** (Generated TypeSpec)
```typespec
import "@typespec/rest";
import "@typespec/openapi3";

@service({
  title: "Blog API",
  version: "1.0.0"
})
namespace BlogApi {
  @discriminator("type")
  model Articles {
    title: string;
    content: string;
    published_at?: utcDateTime | null;
    author: Authors;
  }

  @route("/articles")
  @get
  op listArticles(): Articles[];

  @route("/articles/{id}")
  @get
  op getArticles(id: string): Articles;
}
```

**`blog-openapi.json`** (Generated OpenAPI)
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Blog API",
    "version": "1.0.0"
  },
  "paths": {
    "/articles": {
      "get": {
        "summary": "List articles resources",
        "operationId": "listArticles",
        "responses": {
          "200": {
            "description": "List of articles resources"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Articles": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["articles"] },
          "title": { "type": "string" },
          "content": { "type": "string" },
          "published_at": { "type": "string", "format": "date-time", "nullable": true }
        },
        "required": ["id", "type", "title", "content"]
      }
    }
  }
}
```

### Building JSON API Schemas

```typescript
import { JsonApi } from 'jsonapi-2-typespec';

const serializer = new JsonApi.JsonApiSerializerBuilder('UserSerializer', 'users')
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
  .addRelationship({
    name: 'posts',
    type: 'has_many',
    resource: 'posts',
  })
  .setDescription('User resource serializer')
  .build();

// Validate the serializer
const errors = JsonApi.validateJsonApiSerializer(serializer);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
}
```

## Development

### Setup

```bash
git clone <repository-url>
cd jsonapi-2-typespec
npm install
```

### Scripts

```bash
npm run build          # Build TypeScript
npm run dev           # Watch mode development
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run lint          # Lint code
npm run format        # Format code
```

### Testing

This project uses [Vitest](https://vitest.dev/) for testing:

```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Open test UI in browser
npm run test:coverage # Generate coverage report
```

## Use Cases

- **API Design Consistency**: Maintain unified standards across projects
- **Legacy Migration**: Convert existing JSON API serializers to TypeSpec
- **Code Generation**: Auto-generate serializers from TypeSpec definitions
- **Documentation Automation**: Keep API docs synchronized with implementation
- **RoR Integration**: Generate Ruby serializer classes from TypeSpec/JSON API definitions