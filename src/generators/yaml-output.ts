/**
 * YAML output utilities for OpenAPI specs using modern yaml package
 */

import { parse, stringify } from 'yaml';
import * as fs from 'fs';
import { OpenApiSpec } from './types';

export class YamlOutput {
  /**
   * Convert OpenAPI spec to YAML string
   */
  static toYaml(spec: OpenApiSpec): string {
    try {
      return stringify(spec, {
        indent: 2,
        lineWidth: 0,
        minContentWidth: 0,
        sortMapEntries: false, // Preserve order for OpenAPI spec
      });
    } catch (error) {
      throw new Error(`Failed to convert OpenAPI spec to YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save OpenAPI spec to YAML file
   */
  static saveToYamlFile(spec: OpenApiSpec, filePath: string): void {
    try {
      const yamlContent = this.toYaml(spec);
      fs.writeFileSync(filePath, yamlContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save OpenAPI YAML file "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save OpenAPI spec to JSON file
   */
  static saveToJsonFile(spec: OpenApiSpec, filePath: string): void {
    try {
      const jsonContent = JSON.stringify(spec, null, 2);
      fs.writeFileSync(filePath, jsonContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save OpenAPI JSON file "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Auto-detect format and save OpenAPI spec
   */
  static autoSave(spec: OpenApiSpec, filePath: string): void {
    const ext = filePath.toLowerCase().split('.').pop();
    
    if (ext === 'yml' || ext === 'yaml') {
      this.saveToYamlFile(spec, filePath);
    } else {
      // Default to JSON
      this.saveToJsonFile(spec, filePath);
    }
  }

  /**
   * Load OpenAPI spec from YAML file
   */
  static loadFromYamlFile(filePath: string): OpenApiSpec {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsed = parse(fileContent);
      return parsed as OpenApiSpec;
    } catch (error) {
      throw new Error(`Failed to load OpenAPI YAML file "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load OpenAPI spec from JSON file
   */
  static loadFromJsonFile(filePath: string): OpenApiSpec {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent) as OpenApiSpec;
    } catch (error) {
      throw new Error(`Failed to load OpenAPI JSON file "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Auto-detect format and load OpenAPI spec
   */
  static autoLoad(filePath: string): OpenApiSpec {
    const ext = filePath.toLowerCase().split('.').pop();
    
    if (ext === 'yml' || ext === 'yaml') {
      return this.loadFromYamlFile(filePath);
    } else {
      return this.loadFromJsonFile(filePath);
    }
  }
}