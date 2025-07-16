/**
 * Ruby AST parser using Prism - Functional approach
 */

import { loadPrism } from '@ruby/prism';
import { RubySerializerClass, RubySerializerAttribute, RubySerializerRelationship } from './types';

export type RubyAST = any; // Prism AST node type
export type ParseResult<T> = {
  data: T;
  errors: string[];
  warnings: string[];
};

let prismParser: any = null;

/**
 * Initialize Prism parser (async)
 */
export const initializePrism = async (): Promise<void> => {
  if (!prismParser) {
    prismParser = await loadPrism();
  }
};

/**
 * Parse Ruby source code into AST
 */
export const parseRubyToAST = async (source: string): Promise<ParseResult<RubyAST>> => {
  try {
    if (!prismParser) {
      await initializePrism();
    }
    
    const result = prismParser(source);
    return {
      data: result,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    return {
      data: null,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
    };
  }
};

/**
 * Extract serializer class from AST
 */
export const extractSerializerFromAST = (ast: RubyAST): ParseResult<RubySerializerClass> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Navigate AST to find serializer class
    const serializerClass = findSerializerClass(ast);
    
    if (!serializerClass) {
      errors.push('No serializer class found in Ruby code');
      return { data: null as any, errors, warnings };
    }

    const className = extractClassName(serializerClass);
    const attributes = extractAttributes(serializerClass);
    const relationships = extractRelationships(serializerClass);
    const resourceType = extractResourceType(serializerClass);
    const idField = extractIdField(serializerClass);

    const result: RubySerializerClass = {
      className,
      resourceType,
      idField,
      attributes,
      relationships,
    };

    return { data: result, errors, warnings };
  } catch (error) {
    errors.push(`Failed to extract serializer: ${error instanceof Error ? error.message : String(error)}`);
    return { data: null as any, errors, warnings };
  }
};

/**
 * Find serializer class node in AST
 */
const findSerializerClass = (ast: RubyAST): any => {
  // Recursive function to find class nodes
  const findClass = (node: any): any => {
    if (!node || typeof node !== 'object') return null;

    // Check if this is a class node with Serializer in name
    if (node.type === 'ClassNode') {
      const className = extractClassNameFromNode(node);
      if (className && className.includes('Serializer')) {
        return node;
      }
    }

    // Recursively search child nodes
    for (const key in node) {
      if (Array.isArray(node[key])) {
        for (const child of node[key]) {
          const result = findClass(child);
          if (result) return result;
        }
      } else if (typeof node[key] === 'object') {
        const result = findClass(node[key]);
        if (result) return result;
      }
    }

    return null;
  };

  return findClass(ast);
};

/**
 * Extract class name from class node
 */
const extractClassName = (classNode: any): string => {
  return extractClassNameFromNode(classNode) || 'UnknownSerializer';
};

const extractClassNameFromNode = (classNode: any): string | null => {
  try {
    // Navigate to constant path to get class name
    if (classNode.constant_path && classNode.constant_path.name) {
      return classNode.constant_path.name;
    }
    if (classNode.name) {
      return classNode.name;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Extract attributes from class body
 */
const extractAttributes = (classNode: any): RubySerializerAttribute[] => {
  const attributes: RubySerializerAttribute[] = [];
  
  try {
    const bodyStatements = classNode.body?.body || [];
    
    for (const statement of bodyStatements) {
      if (statement.type === 'CallNode') {
        const methodName = statement.name;
        
        if (methodName === 'attributes') {
          // Multiple attributes: attributes :name, :email, :age
          const args = statement.arguments?.arguments || [];
          for (const arg of args) {
            if (arg.type === 'SymbolNode') {
              attributes.push({
                name: extractSymbolValue(arg),
                type: 'string', // Default type
              });
            }
          }
        } else if (methodName === 'attribute') {
          // Single attribute: attribute :name
          const args = statement.arguments?.arguments || [];
          if (args.length > 0 && args[0].type === 'SymbolNode') {
            const name = extractSymbolValue(args[0]);
            
            // Check for block or custom method
            const hasBlock = statement.block != null;
            const customMethod = extractCustomMethod(args);
            
            attributes.push({
              name,
              type: inferTypeFromName(name),
              block: hasBlock ? 'custom_block' : undefined,
              customName: customMethod,
            });
          }
        }
      }
    }
  } catch (error) {
    // Silent error handling, return what we have
  }

  return attributes;
};

/**
 * Extract relationships from class body
 */
const extractRelationships = (classNode: any): RubySerializerRelationship[] => {
  const relationships: RubySerializerRelationship[] = [];
  
  try {
    const bodyStatements = classNode.body?.body || [];
    
    for (const statement of bodyStatements) {
      if (statement.type === 'CallNode') {
        const methodName = statement.name;
        
        if (['has_many', 'belongs_to', 'has_one'].includes(methodName)) {
          const args = statement.arguments?.arguments || [];
          if (args.length > 0 && args[0].type === 'SymbolNode') {
            const name = extractSymbolValue(args[0]);
            const recordType = extractRecordType(args);
            
            relationships.push({
              name,
              type: methodName as 'has_many' | 'belongs_to' | 'has_one',
              recordType,
            });
          }
        }
      }
    }
  } catch (error) {
    // Silent error handling
  }

  return relationships;
};

/**
 * Extract resource type from set_type call
 */
const extractResourceType = (classNode: any): string | undefined => {
  try {
    const bodyStatements = classNode.body?.body || [];
    
    for (const statement of bodyStatements) {
      if (statement.type === 'CallNode' && statement.name === 'set_type') {
        const args = statement.arguments?.arguments || [];
        if (args.length > 0 && args[0].type === 'SymbolNode') {
          return extractSymbolValue(args[0]);
        }
      }
    }
  } catch (error) {
    // Silent error handling
  }

  return undefined;
};

/**
 * Extract ID field from set_id call
 */
const extractIdField = (classNode: any): string | undefined => {
  try {
    const bodyStatements = classNode.body?.body || [];
    
    for (const statement of bodyStatements) {
      if (statement.type === 'CallNode' && statement.name === 'set_id') {
        const args = statement.arguments?.arguments || [];
        if (args.length > 0 && args[0].type === 'SymbolNode') {
          return extractSymbolValue(args[0]);
        }
      }
    }
  } catch (error) {
    // Silent error handling
  }

  return undefined;
};

/**
 * Helper functions
 */
const extractSymbolValue = (symbolNode: any): string => {
  try {
    return symbolNode.value || symbolNode.unescaped || '';
  } catch {
    return '';
  }
};

const extractCustomMethod = (args: any[]): string | undefined => {
  try {
    for (const arg of args) {
      if (arg.type === 'BlockArgumentNode' && arg.expression?.type === 'SymbolNode') {
        return extractSymbolValue(arg.expression);
      }
    }
  } catch {
    // Silent error handling
  }
  return undefined;
};

const extractRecordType = (args: any[]): string | undefined => {
  try {
    for (const arg of args) {
      if (arg.type === 'KeywordHashNode') {
        const elements = arg.elements || [];
        for (const element of elements) {
          if (element.key?.type === 'SymbolNode' && 
              extractSymbolValue(element.key) === 'record_type' &&
              element.value?.type === 'SymbolNode') {
            return extractSymbolValue(element.value);
          }
        }
      }
    }
  } catch {
    // Silent error handling
  }
  return undefined;
};

const inferTypeFromName = (name: string): string => {
  if (name.includes('_id') || name === 'id') return 'number';
  if (name.includes('_at') || name.includes('_date')) return 'date';
  if (name.includes('_count') || name.includes('_size')) return 'number';
  if (name.includes('is_') || name.includes('_flag')) return 'boolean';
  return 'string';
};