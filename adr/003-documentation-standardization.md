---
adr_id: "ADR-003"
title: "Bilingual Documentation Standardization"
date: "2025-07-16"
status: "Accepted"
category: "Documentation"
tags: ["documentation", "bilingual", "japanese", "english", "standardization"]
stakeholders: ["Development Team", "International Users"]
related_adrs: ["ADR-001"]
implementation_status: "Complete"
---

# ADR-003: Bilingual Documentation Standardization

## Executive Summary

Established a bilingual documentation standard with consistent English and Japanese README files that accurately reflect the 4-flow architecture, ensuring accessibility for both English and Japanese-speaking developers.

## Context

Following the core domain architecture clarification in ADR-001, the project documentation needed to be updated to reflect the new 4-flow system. Additionally, the project serves both English and Japanese-speaking developers, requiring consistent bilingual documentation that maintains technical accuracy across languages.

## Problem Statement

1. **Inconsistent Architecture Documentation**: README files didn't reflect the JSON API central hub architecture
2. **Language Inconsistency**: Japanese documentation wasn't synchronized with English updates
3. **Technical Translation Gaps**: Complex technical concepts needed accurate Japanese translations
4. **Maintenance Overhead**: Changes required manual synchronization between language versions

## Decision

### Bilingual Documentation Standard

Implement a **synchronized bilingual documentation approach** with:

1. **Primary Documentation**: README.md (English) as the source of truth
2. **Secondary Documentation**: README_JP.md (Japanese) as faithful translation
3. **Consistent Structure**: Identical section organization across languages
4. **Technical Terminology**: Standardized technical term translations

### Documentation Structure

Both language versions follow identical structure:
- Title with core domain emphasis
- Overview with 4-flow explanation
- Key features with flow descriptions
- Architecture diagrams with flow labels
- Conversion matrix with flow references
- Project structure organized by flows
- Usage examples demonstrating core flows
- Use cases categorized by primary/secondary

## Technical Specification

### File Organization
```
├── README.md              # English documentation (primary)
├── README_JP.md           # Japanese documentation (secondary)
└── adr/                   # Architecture decisions (English)
    ├── README.md          # ADR index
    └── *.md              # Individual ADRs
```

### Synchronized Content Sections

#### 1. **Title Translation**
- **English**: "Ruby ⇄ JSON API ⇄ TypeSpec Converter"
- **Japanese**: "Ruby ⇄ JSON API ⇄ TypeSpec Converter"

#### 2. **Flow Terminology**
- **English**: "Flow 1: Ruby → JSON API"
- **Japanese**: "フロー1: Ruby → JSON API"

#### 3. **Technical Terms**
- **Conversion**: 変換
- **Central Hub**: 中央ハブ
- **Specification**: 仕様
- **Flow**: フロー
- **Architecture**: アーキテクチャ

### Code Examples

Both versions include identical TypeScript code examples:

```typescript
// English and Japanese versions use same code
import { Ruby, JsonApi, TypeSpec, Converters, Generators } from 'ruby-jsonapi-serializer-2-typespec';

// Flow 1: Ruby → JSON API
const rubySerializer = Ruby.RubySerializerParser.parseFile('./app/serializers/article_serializer.rb');
const jsonApiSchema = Ruby.rubyToJsonApiSchema([rubySerializer]);

// Flow 2: JSON API → TypeSpec  
const converter = new Converters.JsonApiToTypeSpecConverter();
const typeSpecResult = converter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  generateOperations: true,
});
```

### Architectural Diagrams

ASCII diagrams translated with Japanese labels:

**English Version:**
```
┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│ Ruby Serializers│────── Flow 1 ────►│   JSON API      │────── Flow 2 ────►│    TypeSpec     │
│(jsonapi-serializer)   Ruby→JSON    │  Specification  │    JSON→TypeSpec  │                 │
│     Classes     │                  │  (Central Hub)  │                   │                 │
└─────────────────┘                  └─────────┬───────┘                   └─────────────────┘
```

**Japanese Version:**
```
┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│ Rubyシリアライザー│───── フロー1 ────►│   JSON API      │───── フロー2 ────►│    TypeSpec     │
│(jsonapi-serializer)  Ruby→JSON     │     仕様        │   JSON→TypeSpec   │                 │
│     クラス       │                  │  (中央ハブ)      │                   │                 │
└─────────────────┘                  └─────────┬───────┘                   └─────────────────┘
```

## Consequences

### Positive

1. **Accessibility**: Both English and Japanese developers can understand the architecture
2. **Consistency**: Technical accuracy maintained across languages
3. **Maintainability**: Clear process for updating both versions
4. **Professional Quality**: Proper technical translation enhances credibility

### Negative

1. **Maintenance Overhead**: Changes require updates to both files
2. **Translation Complexity**: Technical concepts require careful translation
3. **Version Drift Risk**: Potential for languages to become unsynchronized

### Risk Mitigation

1. **Update Process**: Always update both files together
2. **Review Process**: Technical review of Japanese translations
3. **Automated Checks**: Future tooling to detect synchronization issues

## Implementation Roadmap

### Phase 1: Initial Synchronization (Complete)
- [✅] Update README.md with 4-flow architecture
- [✅] Translate all sections to Japanese in README_JP.md
- [✅] Standardize technical terminology
- [✅] Align code examples and diagrams

### Phase 2: Quality Assurance (Complete)
- [✅] Review technical accuracy of translations
- [✅] Validate diagram translations
- [✅] Ensure consistent formatting
- [✅] Test all code examples

### Phase 3: Maintenance Process (Ongoing)
- [ ] Establish update workflow
- [ ] Create translation review checklist
- [ ] Consider automated synchronization tools

## Validation & Testing

### Acceptance Criteria
- [✅] Both README files have identical structure
- [✅] Technical terminology consistently translated
- [✅] All code examples work in both versions
- [✅] Architecture diagrams accurately translated
- [✅] Use cases properly categorized in both languages

### Quality Checklist
- [✅] Technical accuracy maintained
- [✅] Natural Japanese language flow
- [✅] Consistent formatting and styling
- [✅] All links and references working
- [✅] Code examples tested and verified

## References

### Documentation Files
- **README.md**: Primary English documentation
- **README_JP.md**: Japanese translation
- **package.json**: Project metadata and dependencies

### Translation Standards
- **Technical Terms**: Established Japanese translations for core concepts
- **Flow Descriptions**: Standardized descriptions of conversion flows
- **Architecture Terms**: Consistent architectural terminology

### External Resources
- [JSON API Specification](https://jsonapi.org/) - Referenced standard
- [TypeSpec Documentation](https://typespec.io/) - Target language documentation
- [Ruby jsonapi-serializer](https://github.com/jsonapi-serializer/jsonapi-serializer) - Source format documentation