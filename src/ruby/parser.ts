/**
 * Ruby jsonapi-serializer parser - Legacy string-based approach
 * Note: Consider using ast-parser.ts with Prism AST for more robust parsing
 */

import * as fs from 'fs';
import * as path from 'path';
import { RubySerializerClass, RubySerializerAttribute, RubySerializerRelationship, RubyParseResult } from './types';

export class RubySerializerParser {
  /**
   * Parse a single Ruby serializer file
   */
  static parseFile(filePath: string): RubySerializerClass {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.rb');
    
    return this.parseString(content, fileName, filePath);
  }

  /**
   * Parse Ruby serializer from string content
   */
  static parseString(content: string, fileName: string = 'unknown', filePath?: string): RubySerializerClass {
    const lines = content.split('\n').map(line => line.trim());
    
    const serializer: RubySerializerClass = {
      className: this.extractClassName(content, fileName),
      attributes: [],
      relationships: [],
      filePath,
    };

    let inClassBlock = false;
    let blockDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments and empty lines
      if (line.startsWith('#') || line === '') continue;

      // Track class definition
      if (line.includes('class ') && line.includes('Serializer')) {
        inClassBlock = true;
        blockDepth = 0;
        continue;
      }

      if (!inClassBlock) continue;

      // Track block depth
      if (line.includes('do') || line.includes('{')) blockDepth++;
      if (line.includes('end') || line.includes('}')) {
        blockDepth--;
        if (blockDepth < 0) {
          inClassBlock = false;
          break;
        }
      }

      // Parse serializer directives
      if (blockDepth === 0) {
        this.parseSerializerLine(line, serializer, lines, i);
      }
    }

    return serializer;
  }

  /**
   * Parse multiple Ruby serializer files from a directory
   */
  static parseDirectory(dirPath: string): RubyParseResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const serializers: RubySerializerClass[] = [];

    try {
      const files = fs.readdirSync(dirPath);
      const rubyFiles = files.filter(file => file.endsWith('_serializer.rb'));

      for (const file of rubyFiles) {
        try {
          const filePath = path.join(dirPath, file);
          const serializer = this.parseFile(filePath);
          serializers.push(serializer);
        } catch (error) {
          errors.push(`Failed to parse ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (rubyFiles.length === 0) {
        warnings.push(`No Ruby serializer files (*_serializer.rb) found in ${dirPath}`);
      }

    } catch (error) {
      errors.push(`Failed to read directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      data: {
        serializers,
        projectName: path.basename(dirPath),
      },
      warnings,
      errors,
    };
  }

  private static parseSerializerLine(line: string, serializer: RubySerializerClass, lines: string[], index: number): void {
    // Parse set_type
    if (line.includes('set_type')) {
      const typeMatch = line.match(/set_type\s+:(\w+)/);
      if (typeMatch) {
        serializer.resourceType = typeMatch[1];
      }
    }

    // Parse set_id
    else if (line.includes('set_id')) {
      const idMatch = line.match(/set_id\s+:(\w+)/);
      if (idMatch) {
        serializer.idField = idMatch[1];
      }
    }

    // Parse attributes
    else if (line.includes('attributes ')) {
      const attributesMatch = line.match(/attributes\s+(.+)/);
      if (attributesMatch) {
        const attrList = attributesMatch[1];
        const attrs = this.parseAttributesList(attrList);
        serializer.attributes.push(...attrs);
      }
    }

    // Parse single attribute
    else if (line.includes('attribute ')) {
      const attribute = this.parseAttribute(line, lines, index);
      if (attribute) {
        serializer.attributes.push(attribute);
      }
    }

    // Parse relationships
    else if (line.includes('has_many ') || line.includes('belongs_to ') || line.includes('has_one ')) {
      const relationship = this.parseRelationship(line);
      if (relationship) {
        serializer.relationships.push(relationship);
      }
    }

    // Parse cache options
    else if (line.includes('cache_options')) {
      // Simple parsing for cache options
      serializer.cacheOptions = { enabled: true };
    }
  }

  private static extractClassName(content: string, fileName: string): string {
    const classMatch = content.match(/class\s+(\w+Serializer)/);
    if (classMatch) {
      return classMatch[1];
    }
    
    // Fallback to filename
    return fileName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('') + 'Serializer';
  }

  private static parseAttributesList(attrList: string): RubySerializerAttribute[] {
    const attributes: RubySerializerAttribute[] = [];
    
    // Remove symbols and split by comma
    const attrNames = attrList
      .replace(/:/g, '')
      .split(',')
      .map(attr => attr.trim())
      .filter(attr => attr.length > 0);

    for (const name of attrNames) {
      attributes.push({
        name: name.replace(/['"]/g, ''),
        type: 'string', // Default type
      });
    }

    return attributes;
  }

  private static parseAttribute(line: string, lines: string[], index: number): RubySerializerAttribute | null {
    // Parse attribute :name
    const simpleMatch = line.match(/attribute\s+:(\w+)/);
    if (simpleMatch) {
      const name = simpleMatch[1];
      
      // Check for block definition
      const hasBlock = line.includes('do') || line.includes('{');
      let block = '';
      
      if (hasBlock) {
        // Extract block content (simplified)
        block = line.substring(line.indexOf('do') + 2).trim();
        if (!block && index + 1 < lines.length) {
          // Look for block content on next lines
          let blockLine = index + 1;
          while (blockLine < lines.length && !lines[blockLine].includes('end')) {
            block += lines[blockLine].trim() + ' ';
            blockLine++;
          }
        }
      }

      // Check for custom method name (e.g., attribute :year, &:release_year)
      const customMethodMatch = line.match(/attribute\s+:(\w+),\s*&:(\w+)/);
      
      return {
        name,
        type: 'string', // Default type
        block: block || undefined,
        customName: customMethodMatch ? customMethodMatch[2] : undefined,
      };
    }

    return null;
  }

  private static parseRelationship(line: string): RubySerializerRelationship | null {
    // Parse has_many :items, belongs_to :user, etc.
    const relationshipMatch = line.match(/(has_many|belongs_to|has_one)\s+:(\w+)(?:,\s*(.+))?/);
    
    if (relationshipMatch) {
      const [, type, name, options] = relationshipMatch;
      const relationship: RubySerializerRelationship = {
        name,
        type: type as 'has_many' | 'belongs_to' | 'has_one',
      };

      // Parse options like record_type: :user
      if (options) {
        const recordTypeMatch = options.match(/record_type:\s*:(\w+)/);
        if (recordTypeMatch) {
          relationship.recordType = recordTypeMatch[1];
        }
      }

      return relationship;
    }

    return null;
  }

  /**
   * Infer Ruby type from attribute name and context
   */
  static inferAttributeType(name: string, block?: string): string {
    // Common patterns for type inference
    if (name.includes('_id') || name === 'id') return 'number';
    if (name.includes('_at') || name.includes('_date')) return 'date';
    if (name.includes('_count') || name.includes('_size')) return 'number';
    if (name.includes('is_') || name.includes('_flag')) return 'boolean';
    if (name.includes('_url') || name.includes('_link')) return 'string';
    
    // Analyze block content for type hints
    if (block) {
      if (block.includes('count') || block.includes('size') || block.includes('length')) return 'number';
      if (block.includes('present?') || block.includes('blank?')) return 'boolean';
      if (block.includes('strftime') || block.includes('to_date')) return 'date';
    }
    
    return 'string'; // Default
  }
}