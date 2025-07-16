/**
 * YAML loader for JSON API schemas using modern yaml package
 */

import { parse, stringify } from 'yaml';
import * as fs from 'fs';
import { JsonApiSchema } from './types';
import { parseJsonApiFromObject } from './parser';

export class YamlLoader {
  /**
   * Load JSON API schema from YAML file
   */
  static loadFromFile(filePath: string): JsonApiSchema {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return this.loadFromString(fileContent);
    } catch (error) {
      throw new Error(`Failed to load YAML file "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load JSON API schema from YAML string
   */
  static loadFromString(yamlContent: string): JsonApiSchema {
    try {
      const parsed = parse(yamlContent);
      return parseJsonApiFromObject(parsed);
    } catch (error) {
      throw new Error(`Failed to parse YAML content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save JSON API schema to YAML file
   */
  static saveToFile(schema: JsonApiSchema, filePath: string): void {
    try {
      const yamlContent = this.saveToString(schema);
      fs.writeFileSync(filePath, yamlContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save YAML file "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert JSON API schema to YAML string
   */
  static saveToString(schema: JsonApiSchema): string {
    try {
      return stringify(schema, {
        indent: 2,
        lineWidth: 0, // No line width limit
        minContentWidth: 0,
        sortMapEntries: true,
        quotingType: '"',
        defaultKeyType: null,
        defaultStringType: 'PLAIN',
      });
    } catch (error) {
      throw new Error(`Failed to convert schema to YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detect if file is YAML based on extension
   */
  static isYamlFile(filePath: string): boolean {
    const ext = filePath.toLowerCase().split('.').pop();
    return ext === 'yml' || ext === 'yaml';
  }

  /**
   * Auto-detect format and load schema file
   */
  static autoLoad(filePath: string): JsonApiSchema {
    if (this.isYamlFile(filePath)) {
      return this.loadFromFile(filePath);
    } else {
      // Assume JSON format
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(fileContent);
      return parseJsonApiFromObject(parsed);
    }
  }
}