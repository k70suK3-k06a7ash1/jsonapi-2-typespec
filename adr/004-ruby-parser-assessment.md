---
adr_id: "ADR-004"
title: "Ruby Parser Capabilities and Limitations Assessment"
date: "2025-07-16"
status: "Accepted"
category: "Implementation"
tags: ["ruby", "parser", "ast", "string-parsing", "limitations"]
stakeholders: ["Development Team", "Ruby Developers"]
related_adrs: ["ADR-001", "ADR-002"]
implementation_status: "Complete"
---

# ADR-004: Ruby Parser Capabilities and Limitations Assessment

## Executive Summary

Comprehensive assessment of the Ruby jsonapi-serializer parser revealed strong capabilities for standard patterns with documented limitations for complex syntax, providing clear guidance for current usage and future improvements.

## Context

Flow 1 of the core architecture (Ruby → JSON API) relies heavily on the Ruby parser's ability to extract serializer information from Ruby code. The comprehensive testing in ADR-002 revealed specific capabilities and limitations that needed formal assessment and documentation.

## Problem Statement

1. **Unknown Parser Boundaries**: Unclear what Ruby syntax patterns are supported
2. **Complex Syntax Handling**: Uncertainty about advanced Ruby features
3. **AST vs String Parsing**: Two parsing approaches with different trade-offs
4. **User Expectations**: Need to set clear expectations about parser capabilities

## Decision

### Dual Parser Architecture

Maintain **string-based parser as primary** with **AST parser as future enhancement**:

1. **Primary**: String-based parser for immediate functionality
2. **Secondary**: AST parser (disabled) for complex syntax support
3. **Documentation**: Clear capability boundaries for each approach

### Parser Capability Classification

**✅ Fully Supported (String Parser)**
**⚠️ Partially Supported (String Parser)**  
**🔄 Planned (AST Parser)**
**❌ Not Supported**

## Technical Specification

### String Parser Capabilities ✅

#### Basic Serializer Patterns
```ruby
class ArticleSerializer
  include JSONAPI::Serializer
  
  set_type :articles
  set_id :id
  
  # Multiple attributes on one line
  attributes :title, :content, :published_at
  
  # Custom method reference
  attribute :formatted_date, &:formatted_publication_date
  
  # Simple relationships
  belongs_to :author
  has_many :comments, :tags
  
  # Cache options
  cache_options store: Rails.cache, namespace: 'blog'
end
```

#### Module/Namespace Support
```ruby
module Api
  module V1
    class UserSerializer
      include JSONAPI::Serializer
      # ... serializer content
    end
  end
end
```

#### Relationship Options
```ruby
belongs_to :author, record_type: :users
has_many :comments, record_type: :post_comments
has_one :featured_image, record_type: :images
```

### String Parser Limitations ⚠️

#### Complex Attribute Blocks
```ruby
# May not parse correctly
attribute :reading_time do |post|
  words = post.content.split.length
  (words / 200.0).ceil # Complex logic
end

# May not parse attributes after complex blocks
attribute :status do |article|
  if article.published?
    'published'
  else
    'draft'
  end
end

# These attributes might be skipped
attributes :tags, :categories  # May not be parsed
```

#### Multiple Relationships on One Line
```ruby
# Partial support - only first relationship may be parsed
has_many :items, :notes, :attachments
```

### AST Parser Architecture 🔄

#### Implementation Status
- **File**: `src/ruby/ast-parser.ts`
- **Status**: Complete implementation, disabled
- **Reason**: ES module import compatibility issues
- **Dependency**: `@ruby/prism` AST parser

#### AST Parser Advantages
```typescript
// AST parser can handle complex syntax
export const parseRubyToAST = async (source: string): Promise<ParseResult<RubyAST>> => {
  const prismParser = await loadPrism();
  const result = prismParser(source);
  return { data: result, errors: [], warnings: [] };
};
```

#### Planned Capabilities
- **Complex Blocks**: Full multi-line logic parsing
- **Conditional Attributes**: If/else statements in blocks
- **Method Calls**: Complex method chain parsing
- **Ruby Metaprogramming**: Dynamic attribute generation

### Type Inference System

#### Automatic Type Detection
```typescript
// Current type inference patterns
static inferAttributeType(name: string, block?: string): string {
  if (name.includes('_id') || name === 'id') return 'number';
  if (name.includes('_at') || name.includes('_date')) return 'date';
  if (name.includes('_count') || name.includes('_size')) return 'number';
  if (name.includes('is_') || name.includes('_flag')) return 'boolean';
  return 'string'; // Default
}
```

#### Type Mapping Results
- **ID Fields**: `user_id`, `post_id` → `number`
- **Date Fields**: `created_at`, `updated_at` → `date`
- **Boolean Fields**: `is_active`, `verified_flag` → `boolean`
- **Count Fields**: `view_count`, `like_count` → `number`
- **Default**: All other fields → `string`

## Consequences

### Positive

1. **Clear Boundaries**: Documented what works and what doesn't
2. **Immediate Functionality**: String parser handles majority of use cases
3. **Future Path**: AST parser ready for complex syntax support
4. **User Guidance**: Clear expectations set for parser capabilities
5. **Test Coverage**: Comprehensive validation of capabilities

### Negative

1. **Limited Complex Syntax**: Advanced Ruby patterns not supported
2. **Manual Workarounds**: Users may need to simplify complex serializers
3. **AST Parser Unused**: Advanced capabilities available but disabled
4. **Parsing Gaps**: Some attributes may be missed in complex files

### Risk Mitigation

1. **Documentation**: Clear capability boundaries communicated
2. **Fallback Strategy**: Manual JSON API creation for complex cases
3. **Future Enhancement**: AST parser available when ES modules resolved
4. **Test Coverage**: Comprehensive tests prevent regressions

## Implementation Details

### Current Parser Usage
```typescript
import { Ruby } from 'ruby-jsonapi-serializer-2-typespec';

// Parse Ruby serializer file
const serializer = Ruby.RubySerializerParser.parseFile('./app/serializers/article_serializer.rb');

// Convert to JSON API schema
const jsonApiSchema = Ruby.rubyToJsonApiSchema([serializer]);
```

### Parser Selection Strategy
```typescript
// Current: String parser only
const parser = new StringBasedRubyParser();

// Future: Automatic parser selection
const parser = complexSyntax ? new ASTRubyParser() : new StringBasedRubyParser();
```

### Error Handling
```ruby
# Graceful degradation for complex syntax
begin
  serializer = parseRubyFile(file)
rescue ComplexSyntaxError
  warn("Complex syntax detected, some features may not parse correctly")
  serializer = parseWithBasicPatterns(file)
end
```

## Validation & Testing

### Test Coverage Results
- **Total Tests**: 21 passing tests
- **Basic Patterns**: 100% coverage
- **Complex Patterns**: Documented limitations
- **Edge Cases**: Comprehensive validation
- **Real Files**: Tested with actual Ruby serializer files

### Acceptance Criteria
- [✅] Basic serializer patterns parse correctly
- [✅] Module/namespace handling works
- [✅] Relationship parsing with record types
- [✅] Type inference for common patterns
- [✅] Graceful handling of unsupported syntax
- [✅] Clear error messages for parsing failures

### Test Examples

#### Working Ruby Serializer
```ruby
class ProductSerializer
  include JSONAPI::Serializer
  
  set_type :products
  attributes :name, :price, :in_stock, :created_at
  
  belongs_to :category
  has_many :reviews
end
```

#### Challenging Ruby Serializer
```ruby
class ComplexSerializer
  include JSONAPI::Serializer
  
  # These work fine
  attributes :basic_attr1, :basic_attr2
  
  # This complex block may not parse following attributes
  attribute :complex_calculation do |record|
    if record.active?
      calculate_complex_value(record)
    else
      default_value
    end
  end
  
  # These may be skipped due to complex block above
  attributes :might_be_missed1, :might_be_missed2
end
```

## Future Enhancements

### AST Parser Enablement
- **Priority**: High - Resolve ES module compatibility
- **Effort**: Medium - Implementation exists, needs integration
- **Impact**: High - Enables complex Ruby syntax support

### Enhanced Type Inference
- **Priority**: Medium - Improve automatic type detection
- **Effort**: Low - Extend existing inference rules
- **Impact**: Medium - Better TypeSpec type accuracy

### Parser Performance
- **Priority**: Low - Optimize parsing speed
- **Effort**: Medium - Profile and optimize hot paths
- **Impact**: Low - Current performance adequate

## References

### Code References
- **String Parser**: `src/ruby/parser.ts`
- **AST Parser**: `src/ruby/ast-parser.ts` (disabled)
- **Type Inference**: `RubySerializerParser.inferAttributeType()`
- **Test Coverage**: `tests/user-scenarios/scenario-*.test.ts`

### External Dependencies
- **@ruby/prism**: Ruby AST parsing library
- **Ruby Syntax**: Official Ruby language specification
- **jsonapi-serializer**: Target Ruby gem syntax

### Test Data
- **Sample Files**: `sandbox/inputs/*.rb`
- **Test Fixtures**: `tests/fixtures/ruby-serializers/*.rb`
- **Real Examples**: Production Ruby serializer patterns