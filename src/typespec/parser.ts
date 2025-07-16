/**
 * TypeSpec parser
 */

import { TypeSpecDefinition, TypeSpecNamespace, TypeSpecModel, TypeSpecProperty } from './types';

export class TypeSpecParser {
  parseFromString(content: string): TypeSpecDefinition {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const definition: TypeSpecDefinition = {
      namespaces: [],
      imports: [],
    };

    let currentNamespace: TypeSpecNamespace | null = null;
    let currentModel: TypeSpecModel | null = null;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('import ')) {
        const importMatch = line.match(/import "(.+)";/);
        if (importMatch) {
          definition.imports!.push(importMatch[1]);
        }
      } else if (line.startsWith('@service(')) {
        const serviceInfo = this.parseServiceDecorator(lines, i);
        definition.title = serviceInfo.title;
        definition.version = serviceInfo.version;
        i = serviceInfo.endIndex;
      } else if (line.startsWith('namespace ')) {
        if (currentNamespace) {
          definition.namespaces.push(currentNamespace);
        }
        const namespaceMatch = line.match(/namespace\s+([^{]+)\s*{/);
        if (namespaceMatch) {
          currentNamespace = {
            name: namespaceMatch[1].trim(),
            models: [],
            operations: [],
          };
        }
      } else if (line.startsWith('model ') && currentNamespace) {
        if (currentModel) {
          currentNamespace.models.push(currentModel);
        }
        const modelMatch = line.match(/model\s+([^{]+)\s*{/);
        if (modelMatch) {
          currentModel = {
            name: modelMatch[1].trim(),
            properties: [],
          };
        }
      } else if (line.includes(':') && currentModel && !line.startsWith('//') && !line.startsWith('/*')) {
        const property = this.parseProperty(line);
        if (property) {
          currentModel.properties.push(property);
        }
      } else if (line === '}' && currentModel) {
        if (currentNamespace) {
          currentNamespace.models.push(currentModel);
        }
        currentModel = null;
      } else if (line === '}' && currentNamespace && !currentModel) {
        definition.namespaces.push(currentNamespace);
        currentNamespace = null;
      }

      i++;
    }

    if (currentModel && currentNamespace) {
      currentNamespace.models.push(currentModel);
    }
    if (currentNamespace) {
      definition.namespaces.push(currentNamespace);
    }

    return definition;
  }

  private parseServiceDecorator(lines: string[], startIndex: number): { title?: string; version?: string; endIndex: number } {
    let i = startIndex;
    let content = '';
    let braceCount = 0;

    while (i < lines.length) {
      const line = lines[i];
      content += line;
      
      braceCount += (line.match(/\(/g) || []).length;
      braceCount -= (line.match(/\)/g) || []).length;
      
      if (braceCount === 0 && line.includes(')')) {
        break;
      }
      i++;
    }

    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    const versionMatch = content.match(/version:\s*"([^"]+)"/);

    return {
      title: titleMatch ? titleMatch[1] : undefined,
      version: versionMatch ? versionMatch[1] : undefined,
      endIndex: i,
    };
  }

  private parseProperty(line: string): TypeSpecProperty | null {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return null;

    const namepart = line.substring(0, colonIndex).trim();
    const typepart = line.substring(colonIndex + 1).trim().replace(/;$/, '');

    const optional = namepart.endsWith('?');
    const name = optional ? namepart.slice(0, -1) : namepart;

    return {
      name,
      type: typepart,
      optional,
    };
  }
}