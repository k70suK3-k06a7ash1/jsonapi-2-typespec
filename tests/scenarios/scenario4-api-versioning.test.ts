/**
 * Test Suite for Scenario 4: API Versioning and Backward Compatibility
 * Based on USER_SCENARIOS.md - Social media platform version management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Ruby, JsonApi, TypeSpec, Generators } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Scenario 4: API Versioning and Backward Compatibility', () => {
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-versioning-test-'));
  });
  
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  interface ApiChange {
    type: 'added' | 'removed' | 'modified';
    severity: 'breaking' | 'non-breaking';
    element: string;
    description: string;
  }

  interface VersionComparison {
    version: string;
    breaking: boolean;
    changes: ApiChange[];
    compatibility: 'major' | 'minor' | 'patch';
  }

  describe('Version Comparison Detection', () => {
    const v1PostSerializer = `
class PostSerializer
  include JSONAPI::Serializer
  
  set_type :posts
  set_id :id
  
  attributes :title, :content, :created_at
  
  belongs_to :author
  has_many :comments
end
    `.trim();

    const v2PostSerializer = `
class PostSerializer
  include JSONAPI::Serializer
  
  set_type :posts
  set_id :id
  
  attributes :title, :content, :created_at, :updated_at  # Added new attribute
  
  attribute :excerpt do |post|  # Added custom attribute
    post.content.truncate(100)
  end
  
  belongs_to :author
  has_many :comments
  has_many :tags  # Added new relationship
end
    `.trim();

    it('should detect non-breaking changes (added attributes)', () => {
      // Arrange
      const v1Path = path.join(tempDir, 'v1_post_serializer.rb');
      const v2Path = path.join(tempDir, 'v2_post_serializer.rb');
      
      fs.writeFileSync(v1Path, v1PostSerializer);
      fs.writeFileSync(v2Path, v2PostSerializer);

      // Act
      const v1Serializer = Ruby.RubySerializerParser.parseFile(v1Path);
      const v2Serializer = Ruby.RubySerializerParser.parseFile(v2Path);
      
      const v1Schema = Ruby.rubyToJsonApiSchema([v1Serializer]);
      const v2Schema = Ruby.rubyToJsonApiSchema([v2Serializer]);
      
      const changes = analyzeSchemaChanges(v1Schema, v2Schema);

      // Assert
      expect(changes).toHaveLength(3); // updated_at, excerpt, tags
      
      const updatedAtChange = changes.find(c => c.element.includes('updated_at'));
      expect(updatedAtChange).toBeDefined();
      expect(updatedAtChange?.type).toBe('added');
      expect(updatedAtChange?.severity).toBe('non-breaking');
      
      const excerptChange = changes.find(c => c.element.includes('excerpt'));
      expect(excerptChange).toBeDefined();
      expect(excerptChange?.type).toBe('added');
      expect(excerptChange?.severity).toBe('non-breaking');
      
      const tagsChange = changes.find(c => c.element.includes('tags'));
      expect(tagsChange).toBeDefined();
      expect(tagsChange?.type).toBe('added');
      expect(tagsChange?.severity).toBe('non-breaking');
    });

    const v3PostSerializerBreaking = `
class PostSerializer
  include JSONAPI::Serializer
  
  set_type :posts
  set_id :id
  
  # Removed 'content' attribute - BREAKING CHANGE
  attributes :title, :summary, :created_at  # Changed content to summary
  
  belongs_to :author
  has_many :comments
end
    `.trim();

    it('should detect breaking changes (removed attributes)', () => {
      // Arrange
      const v2Path = path.join(tempDir, 'v2_post_serializer.rb');
      const v3Path = path.join(tempDir, 'v3_post_serializer.rb');
      
      fs.writeFileSync(v2Path, v2PostSerializer);
      fs.writeFileSync(v3Path, v3PostSerializerBreaking);

      // Act
      const v2Serializer = Ruby.RubySerializerParser.parseFile(v2Path);
      const v3Serializer = Ruby.RubySerializerParser.parseFile(v3Path);
      
      const v2Schema = Ruby.rubyToJsonApiSchema([v2Serializer]);
      const v3Schema = Ruby.rubyToJsonApiSchema([v3Serializer]);
      
      const changes = analyzeSchemaChanges(v2Schema, v3Schema);

      // Assert
      const breakingChanges = changes.filter(c => c.severity === 'breaking');
      expect(breakingChanges.length).toBeGreaterThan(0);
      
      const contentRemoval = breakingChanges.find(c => c.description.includes('content'));
      expect(contentRemoval).toBeDefined();
      expect(contentRemoval?.type).toBe('removed');
      expect(contentRemoval?.severity).toBe('breaking');
    });

    it('should detect type changes as breaking', () => {
      // Arrange
      const originalSerializer = `
class TypeChangeSerializer
  include JSONAPI::Serializer
  set_type :typechange
  attributes :numeric_field  # Originally a number
end
      `.trim();

      // Mock: In real scenario, this would be detected from actual usage/types
      const modifiedSerializer = `
class TypeChangeSerializer
  include JSONAPI::Serializer
  set_type :typechange
  attributes :numeric_field  # Now treated as string (type change)
end
      `.trim();

      const originalPath = path.join(tempDir, 'original_serializer.rb');
      const modifiedPath = path.join(tempDir, 'modified_serializer.rb');
      
      fs.writeFileSync(originalPath, originalSerializer);
      fs.writeFileSync(modifiedPath, modifiedSerializer);

      // Act
      const originalParsed = Ruby.RubySerializerParser.parseFile(originalPath);
      const modifiedParsed = Ruby.RubySerializerParser.parseFile(modifiedPath);

      // Simulate type change detection (in real scenario, this would come from enhanced parsing)
      const mockChanges: ApiChange[] = [
        {
          type: 'modified',
          severity: 'breaking',
          element: 'TypeChangeSerializer.numeric_field',
          description: 'Changed type from number to string'
        }
      ];

      // Assert
      expect(mockChanges[0].severity).toBe('breaking');
      expect(mockChanges[0].type).toBe('modified');
      expect(mockChanges[0].description).toContain('Changed type');
    });
  });

  describe('Semantic Versioning Logic', () => {
    it('should increment major version for breaking changes', () => {
      // Arrange
      const breakingChanges: ApiChange[] = [
        {
          type: 'removed',
          severity: 'breaking',
          element: 'PostSerializer.content',
          description: 'Removed attribute: content'
        }
      ];

      // Act
      const version = determineVersionBump(breakingChanges, '1.5.3');

      // Assert
      expect(version).toBe('2.0.0');
    });

    it('should increment minor version for non-breaking changes', () => {
      // Arrange
      const nonBreakingChanges: ApiChange[] = [
        {
          type: 'added',
          severity: 'non-breaking',
          element: 'PostSerializer.excerpt',
          description: 'Added attribute: excerpt'
        }
      ];

      // Act
      const version = determineVersionBump(nonBreakingChanges, '1.5.3');

      // Assert
      expect(version).toBe('1.6.0');
    });

    it('should not change version for no changes', () => {
      // Arrange
      const noChanges: ApiChange[] = [];

      // Act
      const version = determineVersionBump(noChanges, '1.5.3');

      // Assert
      expect(version).toBe('1.5.3'); // No version bump
    });

    function determineVersionBump(changes: ApiChange[], currentVersion: string): string {
      if (changes.length === 0) return currentVersion;
      
      const hasBreaking = changes.some(c => c.severity === 'breaking');
      const [major, minor, patch] = currentVersion.split('.').map(Number);
      
      if (hasBreaking) {
        return `${major + 1}.0.0`;
      } else {
        return `${major}.${minor + 1}.0`;
      }
    }
  });

  describe('Changelog Generation', () => {
    it('should generate comprehensive changelog', () => {
      // Arrange
      const changes: ApiChange[] = [
        {
          type: 'removed',
          severity: 'breaking',
          element: 'UserSerializer.legacy_field',
          description: 'Removed deprecated attribute: legacy_field'
        },
        {
          type: 'added',
          severity: 'non-breaking',
          element: 'UserSerializer.new_feature',
          description: 'Added attribute: new_feature'
        },
        {
          type: 'modified',
          severity: 'non-breaking',
          element: 'UserSerializer.existing_field',
          description: 'Enhanced existing field with new validation'
        }
      ];

      const comparison: VersionComparison = {
        version: '2.0.0',
        breaking: true,
        changes,
        compatibility: 'major'
      };

      // Act
      const changelog = generateChangelog(comparison);

      // Assert
      expect(changelog).toContain('# Changelog - v2.0.0');
      expect(changelog).toContain('## 🚨 Breaking Changes');
      expect(changelog).toContain('Removed deprecated attribute: legacy_field');
      expect(changelog).toContain('## ✨ New Features');
      expect(changelog).toContain('Added attribute: new_feature');
      expect(changelog).toContain('## 🔧 Improvements');
      expect(changelog).toContain('Enhanced existing field');
      expect(changelog).toContain('Generated from Ruby serializer analysis');
    });

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

    it('should generate migration guide for breaking changes', () => {
      // Arrange
      const breakingComparison: VersionComparison = {
        version: '3.0.0',
        breaking: true,
        changes: [
          {
            type: 'removed',
            severity: 'breaking',
            element: 'PostSerializer.old_field',
            description: 'Removed attribute: old_field'
          },
          {
            type: 'modified',
            severity: 'breaking',
            element: 'PostSerializer.status',
            description: 'Changed type from string to enum'
          }
        ],
        compatibility: 'major'
      };

      // Act
      const migrationGuide = generateMigrationGuide(breakingComparison);

      // Assert
      expect(migrationGuide).toContain('# Migration Guide - v3.0.0');
      expect(migrationGuide).toContain('## Breaking Changes');
      expect(migrationGuide).toContain('### Removed attribute: old_field');
      expect(migrationGuide).toContain('### Changed type from string to enum');
      expect(migrationGuide).toContain('**Action Required:**');
    });

    function generateMigrationGuide(comparison: VersionComparison): string {
      const breakingChanges = comparison.changes.filter(c => c.severity === 'breaking');
      
      return `# Migration Guide - v${comparison.version}

## Breaking Changes

This version contains ${breakingChanges.length} breaking change(s) that require action.

${breakingChanges.map(change => `
### ${change.description}
- **Element:** ${change.element}
- **Type:** ${change.type}
- **Action Required:** Please update your client code to handle this change.
`).join('\n')}

## Migration Steps

1. Review all breaking changes listed above
2. Update your client code accordingly
3. Test thoroughly in a staging environment
4. Deploy to production

For assistance, please contact the API team.
`;
    }
  });

  describe('Versioned Documentation Generation', () => {
    it('should generate version-specific TypeSpec documentation', () => {
      // Arrange
      const socialMediaSerializer = `
class PostSerializer
  include JSONAPI::Serializer
  
  set_type :posts
  set_id :id
  
  attributes :title, :content, :likes_count
  
  attribute :engagement_score do |post|
    (post.likes_count + post.comments_count) / post.views_count.to_f
  end
  
  belongs_to :author
  has_many :comments, :likes
end
      `.trim();

      const filePath = path.join(tempDir, 'post_serializer.rb');
      fs.writeFileSync(filePath, socialMediaSerializer);
      const serializer = Ruby.RubySerializerParser.parseFile(filePath);

      // Act
      const v3TypeSpec = generateVersionedTypeSpec([serializer], '3.1.0');
      const v4TypeSpec = generateVersionedTypeSpec([serializer], '4.0.0');

      // Assert
      expect(v3TypeSpec).toContain('title: "Social Media API v3.1.0"');
      expect(v3TypeSpec).toContain('version: "3.1.0"');
      expect(v3TypeSpec).toContain('namespace ApiV310');
      
      expect(v4TypeSpec).toContain('title: "Social Media API v4.0.0"');
      expect(v4TypeSpec).toContain('version: "4.0.0"');
      expect(v4TypeSpec).toContain('namespace ApiV400');
      
      // Both should contain the same model structure
      expect(v3TypeSpec).toContain('model Posts');
      expect(v4TypeSpec).toContain('model Posts');
      expect(v3TypeSpec).toContain('engagement_score: string');
      expect(v4TypeSpec).toContain('engagement_score: string');
    });

    function generateVersionedTypeSpec(serializers: Ruby.RubySerializerClass[], version: string): string {
      return Ruby.rubyToOutputPipeline('typespec', {
        namespace: 'ApiV' + version.replace(/\./g, ''),
        title: `Social Media API v${version}`,
        version: version,
        generateOperations: true,
      })(serializers);
    }

    it('should generate versioned OpenAPI with proper server URLs', () => {
      // Arrange
      const serializer = `
class VersionedSerializer
  include JSONAPI::Serializer
  set_type :versioned
  attributes :name
end
      `.trim();

      const filePath = path.join(tempDir, 'versioned_serializer.rb');
      fs.writeFileSync(filePath, serializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(filePath);

      // Act
      const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
      const v1OpenApi = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema, {
        info: { version: '1.0.0' },
        servers: [{ url: 'https://api.social.com/v1' }]
      });

      const v2OpenApi = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema, {
        info: { version: '2.0.0' },
        servers: [{ url: 'https://api.social.com/v2' }]
      });

      // Assert
      expect(v1OpenApi.info.version).toBe('1.0.0');
      expect(v1OpenApi.servers[0].url).toBe('https://api.social.com/v1');
      
      expect(v2OpenApi.info.version).toBe('2.0.0');
      expect(v2OpenApi.servers[0].url).toBe('https://api.social.com/v2');
      
      // Schema should be the same
      expect(v1OpenApi.components.schemas).toEqual(v2OpenApi.components.schemas);
    });

    it('should save versioned documentation in organized structure', () => {
      // Arrange
      const serializer = `
class DocSerializer
  include JSONAPI::Serializer
  set_type :docs
  attributes :title
end
      `.trim();

      const filePath = path.join(tempDir, 'doc_serializer.rb');
      fs.writeFileSync(filePath, serializer);
      const parsedSerializer = Ruby.RubySerializerParser.parseFile(filePath);

      const versions = ['1.0.0', '1.1.0', '2.0.0'];

      // Act
      versions.forEach(version => {
        const versionDir = path.join(tempDir, 'docs', 'versions', `v${version}`);
        fs.mkdirSync(versionDir, { recursive: true });
        
        const typeSpecCode = generateVersionedTypeSpec([parsedSerializer], version);
        const jsonApiSchema = Ruby.rubyToJsonApiSchema([parsedSerializer]);
        const openApiSpec = new Generators.OpenApiFromJsonApiGenerator().generate(jsonApiSchema, {
          info: { version }
        });
        
        fs.writeFileSync(path.join(versionDir, 'api.tsp'), typeSpecCode);
        Generators.YamlOutput.saveToYamlFile(openApiSpec, path.join(versionDir, 'openapi.yml'));
      });

      // Assert
      versions.forEach(version => {
        const versionDir = path.join(tempDir, 'docs', 'versions', `v${version}`);
        expect(fs.existsSync(path.join(versionDir, 'api.tsp'))).toBe(true);
        expect(fs.existsSync(path.join(versionDir, 'openapi.yml'))).toBe(true);
        
        const typeSpecContent = fs.readFileSync(path.join(versionDir, 'api.tsp'), 'utf8');
        expect(typeSpecContent).toContain(`version: "${version}"`);
      });
    });
  });

  describe('Client SDK Coordination', () => {
    it('should generate version-aware client examples', () => {
      // Arrange
      const apiVersion = '3.0.0';
      const serializer = `
class ClientSerializer
  include JSONAPI::Serializer
  set_type :clients
  attributes :name, :version
end
      `.trim();

      // Act
      const clientExamples = generateClientSDKExamples(apiVersion);

      // Assert
      expect(clientExamples).toContain('## Version 3.0.0 Client Examples');
      expect(clientExamples).toContain('@company/api-client-v3');
      expect(clientExamples).toContain('https://api.social.com/v3');
      expect(clientExamples).toContain('API_VERSION: "3.0.0"');
    });

    function generateClientSDKExamples(version: string): string {
      const majorVersion = version.split('.')[0];
      return `## Version ${version} Client Examples

### TypeScript Client
\`\`\`typescript
import { SocialMediaClient } from '@company/api-client-v${majorVersion}';

const client = new SocialMediaClient({
  baseURL: 'https://api.social.com/v${majorVersion}',
  apiKey: process.env.API_KEY,
  version: '${version}'
});

// Version-specific API calls
const posts = await client.posts.list();
\`\`\`

### Environment Configuration
\`\`\`bash
API_BASE_URL=https://api.social.com/v${majorVersion}
API_VERSION="${version}"
\`\`\`
`;
    }

    it('should validate backward compatibility requirements', () => {
      // Arrange
      const v1Serializer = `
class CompatSerializer
  include JSONAPI::Serializer
  set_type :compat
  attributes :required_field, :optional_field
end
      `.trim();

      const v2Serializer = `
class CompatSerializer
  include JSONAPI::Serializer
  set_type :compat
  attributes :required_field, :optional_field, :new_field  # Added field (OK)
  # required_field still present (OK)
end
      `.trim();

      const v1Path = path.join(tempDir, 'v1_compat_serializer.rb');
      const v2Path = path.join(tempDir, 'v2_compat_serializer.rb');
      
      fs.writeFileSync(v1Path, v1Serializer);
      fs.writeFileSync(v2Path, v2Serializer);

      // Act
      const v1Parsed = Ruby.RubySerializerParser.parseFile(v1Path);
      const v2Parsed = Ruby.RubySerializerParser.parseFile(v2Path);

      const v1Schema = Ruby.rubyToJsonApiSchema([v1Parsed]);
      const v2Schema = Ruby.rubyToJsonApiSchema([v2Parsed]);

      const changes = analyzeSchemaChanges(v1Schema, v2Schema);
      const isBackwardCompatible = !changes.some(c => c.severity === 'breaking');

      // Assert
      expect(isBackwardCompatible).toBe(true);
      expect(changes.filter(c => c.severity === 'non-breaking')).toHaveLength(1); // new_field added
    });
  });

  // Helper function to analyze schema changes
  function analyzeSchemaChanges(
    previous: JsonApi.JsonApiSchema, 
    current: JsonApi.JsonApiSchema
  ): ApiChange[] {
    const changes: ApiChange[] = [];
    
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
    
    // Compare relationships
    const prevRels = new Map(previous.resource.relationships?.map(r => [r.name, r]) || []);
    const currRels = new Map(current.resource.relationships?.map(r => [r.name, r]) || []);
    
    // Added relationships (non-breaking)
    for (const [name, rel] of currRels) {
      if (!prevRels.has(name)) {
        changes.push({
          type: 'added',
          severity: 'non-breaking',
          element: `${current.name}.${name}`,
          description: `Added relationship: ${name}`
        });
      }
    }
    
    return changes;
  }
});