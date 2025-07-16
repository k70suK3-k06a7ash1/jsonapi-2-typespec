# ADR Format Specification for LLM DataSource

**Version:** 1.0  
**Date:** YYYY-MM-DD  
**Purpose:** Define optimal ADR format for LLM consumption as project specification reference

## Overview

Architecture Decision Records (ADRs) in this project serve as the **primary DataSource** for LLM agents performing future coding tasks. The format must be optimized for:

1. **Machine Readability**: Structured for LLM parsing and comprehension
2. **Context Preservation**: Complete decision context and rationale
3. **Implementation Guidance**: Actionable technical details
4. **Cross-Reference Support**: Clear relationships between decisions

## ADR Structure

### Mandatory Sections

#### 1. **Header Block** (Machine-Parseable)
```yaml
---
adr_id: "ADR-XXX"
title: "Decision Title"
date: "YYYY-MM-DD"
status: "Accepted|Proposed|Deprecated|Superseded"
category: "Architecture|Testing|Documentation|Implementation"
tags: ["tag1", "tag2", "tag3"]
stakeholders: ["role1", "role2"]
related_adrs: ["ADR-001", "ADR-002"]
implementation_status: "Complete|Partial|Planned"
---
```

#### 2. **Executive Summary** (LLM Context)
- **1-2 sentences**: What was decided and why
- **Impact**: Primary consequences for system architecture
- **Keywords**: Technical terms for LLM indexing

#### 3. **Context** (Decision Background)
- **Problem Domain**: What area of the system is affected
- **Current State**: How things work now
- **Drivers**: What forces require this decision
- **Constraints**: Technical, business, or resource limitations

#### 4. **Decision** (Core Content)
- **What**: Specific decision made
- **How**: Implementation approach
- **Why**: Rationale and trade-offs
- **Scope**: What is and isn't covered

#### 5. **Technical Specification** (Implementation Details)
- **Architecture Diagrams**: ASCII art or mermaid syntax
- **Code Examples**: Representative implementation snippets
- **API Changes**: Interface modifications
- **Data Models**: Schema or type definitions
- **Configuration**: Required settings or parameters

#### 6. **Consequences** (Impact Analysis)
- **Positive Outcomes**: Benefits and improvements
- **Negative Outcomes**: Costs and limitations
- **Risk Mitigation**: How negative impacts are addressed
- **Performance Impact**: Speed, memory, scalability effects

#### 7. **Implementation Roadmap** (Action Plan)
- **Phase 1**: Immediate implementation steps
- **Phase 2**: Follow-up work
- **Dependencies**: What must be done first
- **Success Metrics**: How to measure implementation success

#### 8. **Alternatives Considered** (Decision Space)
- **Option A**: Alternative approach with pros/cons
- **Option B**: Another alternative with analysis
- **Why Rejected**: Specific reasons for not choosing alternatives

#### 9. **Validation & Testing** (Quality Assurance)
- **Test Strategy**: How the decision will be validated
- **Acceptance Criteria**: Definition of successful implementation
- **Rollback Plan**: How to revert if needed

#### 10. **References** (Context Links)
- **Code References**: Specific files, functions, or modules
- **External Standards**: Relevant specifications or best practices
- **Documentation**: Related docs, RFCs, or papers
- **Tools**: Software or libraries involved

### Optional Sections

#### **Migration Guide** (For Breaking Changes)
- **Before/After**: Code examples showing the change
- **Migration Steps**: Detailed upgrade process
- **Compatibility**: Backward compatibility considerations

#### **Performance Analysis** (For Performance-Critical Decisions)
- **Benchmarks**: Quantitative performance data
- **Resource Usage**: Memory, CPU, network impact
- **Scalability**: How performance changes with load

#### **Security Considerations** (For Security-Related Decisions)
- **Threat Model**: Security risks and mitigations
- **Compliance**: Regulatory or policy requirements
- **Access Control**: Authentication and authorization changes

## LLM Optimization Guidelines

### 1. **Structured Data First**
- Use YAML frontmatter for machine-readable metadata
- Include structured tags for categorization
- Provide clear cross-references between ADRs

### 2. **Context-Rich Content**
- Include complete problem context, not just solutions
- Explain the "why" behind decisions, not just the "what"
- Provide sufficient background for LLM understanding

### 3. **Implementation-Focused**
- Include concrete code examples and patterns
- Specify exact file locations and module names
- Document configuration and setup requirements

### 4. **Relationship Mapping**
- Explicitly link related ADRs and dependencies
- Reference specific code files and functions
- Include architectural diagrams and data flows

### 5. **Evolution-Aware**
- Document how decisions might change over time
- Include versioning strategy for the ADR itself
- Plan for deprecation and supersession

## File Naming Convention

```
adr/
├── format.md                           # This specification
├── README.md                          # ADR index and overview
├── XXX-category-decision-title.md     # Individual ADRs
└── diagrams/                          # Supporting diagrams
    └── XXX-architecture-diagram.svg
```

**Pattern**: `{number}-{category}-{kebab-case-title}.md`

**Examples**:
- `001-architecture-core-domain.md`
- `002-testing-ruby-conversion.md`
- `003-documentation-bilingual-standard.md`

## Metadata Standards

### Categories
- **Architecture**: System design and structure decisions
- **Testing**: Quality assurance and validation strategies
- **Documentation**: Information architecture and standards
- **Implementation**: Technical implementation choices
- **Security**: Security-related decisions
- **Performance**: Performance and scalability decisions
- **Integration**: Third-party and external system integration

### Status Values
- **Proposed**: Under review, not yet implemented
- **Accepted**: Approved and implemented/being implemented
- **Deprecated**: No longer recommended, but not removed
- **Superseded**: Replaced by a newer ADR (reference required)

### Tags (Standardized)
- Technology: `ruby`, `typescript`, `json-api`, `typespec`, `openapi`
- Domain: `conversion`, `parsing`, `generation`, `validation`
- Quality: `testing`, `documentation`, `performance`, `security`
- Process: `migration`, `integration`, `deployment`

## Quality Checklist

Before finalizing an ADR, verify:

- [ ] **Complete Header**: All required metadata present
- [ ] **Clear Summary**: Decision is understandable in 2 sentences
- [ ] **Full Context**: LLM has sufficient background information
- [ ] **Technical Details**: Implementation guidance is specific
- [ ] **Cross-References**: Related ADRs and code are linked
- [ ] **Consequences**: Both positive and negative outcomes documented
- [ ] **Validation Plan**: Testing and acceptance criteria defined
- [ ] **Migration Path**: Change implementation is clear

## LLM Usage Instructions

When referencing ADRs as a DataSource for coding tasks:

1. **Read Related ADRs**: Check cross-references for full context
2. **Follow Implementation Guidance**: Use specified patterns and approaches
3. **Respect Constraints**: Adhere to documented limitations and trade-offs
4. **Validate Against Criteria**: Ensure implementation meets success metrics
5. **Update Status**: Modify implementation_status as work progresses

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-16 | Initial format specification |

---

**Note**: This format is optimized for LLM consumption while maintaining human readability. All ADRs should follow this structure to ensure consistent, comprehensive project specification documentation.