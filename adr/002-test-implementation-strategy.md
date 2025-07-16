# ADR-002: Ruby to TypeSpec Test Implementation Strategy

**Date:** 2025-01-16  
**Status:** Accepted  
**Deciders:** Development Team  

## Context

The Ruby to TypeSpec conversion functionality lacked comprehensive test coverage. While basic conversion tests existed, there were no user scenario tests that validated real-world usage patterns, complex Ruby serializer syntax, or end-to-end conversion flows. This created uncertainty about the system's actual capabilities and reliability.

## Problem Statement

1. **Missing User Scenarios**: No tests for realistic Ruby serializer conversion workflows
2. **Unknown Parser Limitations**: Ruby parser capabilities and edge cases weren't validated
3. **Insufficient Coverage**: Complex Ruby syntax patterns weren't tested
4. **No Real-world Validation**: Tests didn't use actual Ruby serializer files
5. **End-to-end Gaps**: Complete conversion flows weren't validated

## Decision

### Comprehensive Test Strategy

Implement **user scenario-based testing** with three distinct test categories covering the full spectrum of Ruby to TypeSpec conversion use cases.

### Test Categories

#### 1. **Scenario 1: Legacy Migration** (Existing)
- **Purpose**: Validate basic migration workflows
- **Scope**: Standard Ruby serializer patterns
- **Coverage**: Core conversion functionality

#### 2. **Scenario 2: Advanced Features** (New)
- **Purpose**: Test complex Ruby serializer features
- **Scope**: Real-world e-commerce and user profile examples
- **Coverage**: Advanced syntax, namespaces, complex relationships

#### 3. **Scenario 3: Edge Cases & Error Handling** (New)
- **Purpose**: Validate parser robustness and limitations
- **Scope**: Malformed code, minimal cases, complex patterns
- **Coverage**: Error handling, type inference, consistency

### Test Implementation Structure

```
tests/
├── user-scenarios/
│   ├── scenario-1-legacy-migration.test.ts     # Existing
│   ├── scenario-2-ruby-advanced-features.test.ts    # New
│   └── scenario-3-ruby-edge-cases.test.ts          # New
├── fixtures/
│   └── ruby-serializers/
│       ├── ecommerce_product_serializer.rb     # Complex e-commerce
│       ├── user_profile_serializer.rb          # Namespaced with privacy
│       └── minimal_serializer.rb               # Basic test case
└── utils/
    └── typespec-validator.ts                   # TypeSpec validation utility
```

## Consequences

### Positive

1. **Comprehensive Coverage**: 21 tests across all use cases
2. **Real-world Validation**: Tests use actual Ruby serializer patterns
3. **Parser Assessment**: Clear documentation of capabilities and limitations
4. **Quality Assurance**: Prevents regressions in conversion functionality
5. **Documentation**: Tests serve as usage examples

### Negative

1. **Maintenance Overhead**: More tests to maintain and update
2. **Test Complexity**: Some tests require complex setup and fixtures
3. **Parser Limitations Exposed**: Tests revealed string parser limitations

### Implementation Impact

1. **Confidence**: High confidence in Ruby parser capabilities
2. **Limitations Documented**: Clear understanding of current constraints
3. **Future Roadmap**: Identified areas for improvement (AST parser)

## Test Scenarios

### Scenario 2: Advanced Ruby Features

#### Test Cases
1. **Complex Serializers**: Custom attributes, method references, blocks
2. **Namespaced Modules**: Module/namespace handling
3. **Real-world Examples**: E-commerce products, user profiles
4. **Directory Parsing**: Multiple file processing
5. **Type Inference**: Automatic type detection validation

#### Sample Ruby Serializer (E-commerce)
```ruby
class EcommerceProductSerializer
  include JSONAPI::Serializer
  
  set_type :products
  set_id :sku
  
  attributes :name, :description, :price, :currency, :in_stock
  
  attribute :price_with_tax do |product|
    product.price * (1 + product.tax_rate)
  end
  
  attribute :seo_title, &:generate_seo_title
  
  belongs_to :category, record_type: :product_categories
  has_many :reviews, record_type: :product_reviews
end
```

### Scenario 3: Edge Cases & Error Handling

#### Test Cases
1. **Minimal Serializers**: Basic functionality verification
2. **Malformed Ruby**: Graceful error handling
3. **Missing Declarations**: Handling incomplete serializers
4. **Complex Patterns**: Attribute names with numbers, underscores
5. **Type Inference**: Number, date, boolean detection
6. **Consistency**: Multiple conversion cycle validation

#### Edge Case Examples
```ruby
# Minimal serializer
class MinimalSerializer
  include JSONAPI::Serializer
  set_type :minimal_items
  attributes :name, :value
end

# Complex attribute patterns
class ComplexAttributeSerializer
  attributes :attr_with_123_numbers
  attribute :_leading_underscore
  attribute :trailing_underscore_
  has_many :items, :notes, :attachments  # Multiple on one line
end
```

## Test Results & Findings

### Ruby Parser Capabilities ✅

**Working Features:**
- Basic attribute and relationship parsing
- Custom method references (`&:method_name`)
- Multiple attributes per line
- Cache options parsing
- Module/namespace handling
- Directory parsing
- Type inference for common patterns

### Parser Limitations ⚠️

**Current Constraints:**
- Complex attribute blocks with multi-line logic
- Multiple relationships on one line (partial support)
- Attributes after complex blocks may be skipped
- AST parser available but disabled

### Test Statistics
- **Total Tests**: 21 passing
- **Test Files**: 3 scenario files
- **Coverage**: All major Ruby serializer patterns
- **Fixtures**: 3 sample Ruby serializer files

## Alternatives Considered

### 1. Unit Tests Only
Focus on isolated component testing
- **Rejected**: Doesn't validate real-world usage patterns

### 2. Integration Tests Only
End-to-end testing without scenarios
- **Rejected**: Lacks granular validation of specific features

### 3. Performance Testing
Load and stress testing of conversions
- **Deferred**: Functional correctness prioritized first

### 4. Property-Based Testing
Generated Ruby serializer testing
- **Deferred**: Complexity vs. benefit ratio too high initially

## Implementation Details

### Test Execution Strategy
```bash
# Run all user scenarios
npm run test -- tests/user-scenarios/

# Run specific scenario
npm run test -- tests/user-scenarios/scenario-2-ruby-advanced-features.test.ts

# Run with coverage
npm run test:coverage
```

### Validation Approach
1. **Parse Ruby**: Validate Ruby serializer parsing
2. **Convert to JSON API**: Verify JSON API schema generation
3. **Convert to TypeSpec**: Validate TypeSpec generation
4. **Generate OpenAPI**: Confirm OpenAPI output
5. **Validate TypeSpec**: Use TypeSpec validator utility

### Test Data Management
- **Real Files**: Use actual Ruby serializer files from sandbox
- **Fixtures**: Dedicated test fixtures for edge cases
- **Generated Content**: Validate all generated outputs

## Monitoring and Review

### Success Criteria
- [✅] All conversion flows tested
- [✅] Ruby parser capabilities documented
- [✅] Real-world scenarios validated
- [✅] Error handling verified
- [✅] Type inference working

### Future Enhancements
1. **AST Parser Tests**: When ES module issues resolved
2. **Performance Tests**: For large-scale conversions
3. **CLI Tests**: When command-line interface implemented
4. **Regression Tests**: For reported issues

### Maintenance Strategy
- **Test Updates**: When Ruby parser enhanced
- **New Scenarios**: As real-world use cases emerge
- **Documentation**: Keep test descriptions current

## Related ADRs

- [ADR-001](./001-core-domain-architecture.md) - Architecture being tested
- [ADR-004](./004-ruby-parser-assessment.md) - Detailed parser findings

## References

- **Test Files**: `tests/user-scenarios/scenario-*.test.ts`
- **Fixtures**: `tests/fixtures/ruby-serializers/`
- **Sandbox**: `sandbox/inputs/` (real Ruby files)
- **Validation**: `tests/utils/typespec-validator.ts`

---

**Key Takeaway**: Comprehensive user scenario testing provides high confidence in the Ruby to TypeSpec conversion capabilities while clearly documenting current limitations and future improvement opportunities.