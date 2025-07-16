/**
 * TypeSpec code generator
 */

import {
  TypeSpecDefinition,
  TypeSpecNamespace,
  TypeSpecModel,
  TypeSpecOperation,
  TypeSpecProperty,
  TypeSpecDecorator,
} from './types';

export class TypeSpecGenerator {
  generateDefinition(definition: TypeSpecDefinition): string {
    const lines: string[] = [];

    if (definition.imports && definition.imports.length > 0) {
      definition.imports.forEach(imp => {
        lines.push(`import "${imp}";`);
      });
      lines.push('');
    }

    if (definition.title) {
      lines.push(`@service({`);
      lines.push(`  title: "${definition.title}",`);
      if (definition.version) {
        lines.push(`  version: "${definition.version}"`);
      }
      lines.push(`})`);
    }

    definition.namespaces.forEach(namespace => {
      lines.push(...this.generateNamespace(namespace));
      lines.push('');
    });

    return lines.join('\n').trim();
  }

  private generateNamespace(namespace: TypeSpecNamespace): string[] {
    const lines: string[] = [];

    if (namespace.imports && namespace.imports.length > 0) {
      namespace.imports.forEach(imp => {
        lines.push(`import "${imp}";`);
      });
      lines.push('');
    }

    lines.push(`namespace ${namespace.name} {`);

    if (namespace.description) {
      lines.push(`  /** ${namespace.description} */`);
    }

    namespace.models.forEach(model => {
      lines.push(...this.generateModel(model, 1));
      lines.push('');
    });

    namespace.operations.forEach(operation => {
      lines.push(...this.generateOperation(operation, 1));
      lines.push('');
    });

    lines.push('}');

    return lines;
  }

  private generateModel(model: TypeSpecModel, indent: number = 0): string[] {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);

    if (model.description) {
      lines.push(`${indentStr}/** ${model.description} */`);
    }

    if (model.decorators) {
      model.decorators.forEach(decorator => {
        lines.push(`${indentStr}${this.generateDecorator(decorator)}`);
      });
    }

    const extendsClause = model.extends && model.extends.length > 0 
      ? ` extends ${model.extends.join(', ')}` 
      : '';

    lines.push(`${indentStr}model ${model.name}${extendsClause} {`);

    model.properties.forEach(property => {
      lines.push(...this.generateProperty(property, indent + 1));
    });

    lines.push(`${indentStr}}`);

    return lines;
  }

  private generateProperty(property: TypeSpecProperty, indent: number): string[] {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);

    if (property.description) {
      lines.push(`${indentStr}/** ${property.description} */`);
    }

    const optional = property.optional ? '?' : '';
    lines.push(`${indentStr}${property.name}${optional}: ${property.type};`);

    return lines;
  }

  private generateOperation(operation: TypeSpecOperation, indent: number): string[] {
    const lines: string[] = [];
    const indentStr = '  '.repeat(indent);

    if (operation.description) {
      lines.push(`${indentStr}/** ${operation.description} */`);
    }

    if (operation.decorators) {
      operation.decorators.forEach(decorator => {
        lines.push(`${indentStr}${this.generateDecorator(decorator)}`);
      });
    }

    lines.push(`${indentStr}@route("${operation.path}")`);
    lines.push(`${indentStr}@${operation.method}`);

    const params = operation.parameters || [];
    const paramStr = params.length > 0 
      ? params.map(p => `${p.name}: ${p.type}`).join(', ')
      : '';

    const responseType = operation.responses.find(r => r.statusCode === 200)?.type || 'void';

    lines.push(`${indentStr}op ${operation.name}(${paramStr}): ${responseType};`);

    return lines;
  }

  private generateDecorator(decorator: TypeSpecDecorator): string {
    const args = decorator.arguments && decorator.arguments.length > 0
      ? `(${decorator.arguments.map(arg => JSON.stringify(arg)).join(', ')})`
      : '';
    return `@${decorator.name}${args}`;
  }
}