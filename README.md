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

## Use Cases

- **API Design Consistency**: Maintain unified standards across projects
- **Legacy Migration**: Convert existing JSON API serializers to TypeSpec
- **Code Generation**: Auto-generate serializers from TypeSpec definitions
- **Documentation Automation**: Keep API docs synchronized with implementation