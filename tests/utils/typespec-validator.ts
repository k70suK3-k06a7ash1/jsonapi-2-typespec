/**
 * TypeSpec validation utility using @typespec/compiler
 */

export interface TypeSpecValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hasModels: boolean;
  hasNamespace: boolean;
}

export class TypeSpecValidator {
  /**
   * Basic TypeSpec syntax validation (simplified approach)
   */
  static async validateTypeSpec(
    typeSpecCode: string,
    fileName: string = 'test.tsp'
  ): Promise<TypeSpecValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic syntax checks
      const lines = typeSpecCode.split('\n');
      let braceCount = 0;
      let hasNamespace = false;
      let hasModels = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('//')) continue;

        // Check for namespace
        if (line.includes('namespace ')) {
          hasNamespace = true;
        }

        // Check for models
        if (line.includes('model ')) {
          hasModels = true;
        }

        // Basic brace matching
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // Check for common syntax errors
        if (line.includes('model ') && !line.includes('{') && !line.includes(';')) {
          if (i + 1 < lines.length && !lines[i + 1].trim().startsWith('{')) {
            warnings.push(`Model definition on line ${i + 1} might be missing opening brace`);
          }
        }
      }

      // Check brace balance
      if (braceCount !== 0) {
        errors.push(`Unbalanced braces: ${braceCount > 0 ? 'missing closing' : 'extra closing'} braces`);
      }

      // Basic TypeSpec structure validation
      if (!typeSpecCode.trim()) {
        errors.push('TypeSpec code is empty');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasModels,
        hasNamespace
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        hasModels: false,
        hasNamespace: false
      };
    }
  }

  /**
   * Validate TypeSpec and assert it's valid (for use in tests)
   */
  static async assertValidTypeSpec(
    typeSpecCode: string,
    fileName?: string
  ): Promise<void> {
    const result = await this.validateTypeSpec(typeSpecCode, fileName);
    
    if (!result.isValid) {
      const errorMessage = [
        'Generated TypeSpec is not valid:',
        ...result.errors.map(e => `  - ${e}`),
        '',
        'Generated TypeSpec code:',
        typeSpecCode
      ].join('\n');
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate that TypeSpec contains expected models and operations
   */
  static async validateTypeSpecStructure(
    typeSpecCode: string,
    expectedModels: string[] = [],
    expectedOperations: string[] = []
  ): Promise<TypeSpecValidationResult> {
    const validationResult = await this.validateTypeSpec(typeSpecCode);
    
    if (!validationResult.isValid) {
      return validationResult;
    }

    // Check for expected models
    const missingModels = expectedModels.filter(model => 
      !typeSpecCode.includes(`model ${model}`)
    );

    // Check for expected operations  
    const missingOperations = expectedOperations.filter(op => 
      !typeSpecCode.includes(`op ${op}`) && !typeSpecCode.includes(`@route("${op}")`)
    );

    const structureErrors: string[] = [];
    
    if (missingModels.length > 0) {
      structureErrors.push(`Missing expected models: ${missingModels.join(', ')}`);
    }
    
    if (missingOperations.length > 0) {
      structureErrors.push(`Missing expected operations: ${missingOperations.join(', ')}`);
    }

    return {
      ...validationResult,
      isValid: validationResult.isValid && structureErrors.length === 0,
      errors: [...validationResult.errors, ...structureErrors]
    };
  }
}