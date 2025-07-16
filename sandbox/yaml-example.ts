/**
 * YAML support example for jsonapi-2-typespec converter
 */

import fs from 'fs';
import path from 'path';
import {
  JsonApi,
  TypeSpec,
  Converters,
  Generators,
} from '../src';

// Example YAML schema content
const yamlSchemaContent = `
title: Blog API
version: 1.0.0
description: A simple blog API with articles and authors
serializers:
  - name: ArticleSerializer
    description: Serializer for blog articles
    resource:
      type: articles
      description: Blog article resource
      attributes:
        - name: title
          type: string
          description: The article title
        - name: content
          type: string
          description: The article content
        - name: published_at
          type: date
          nullable: true
          description: When the article was published
        - name: status
          type: string
          enum: [draft, published, archived]
          description: The article status
      relationships:
        - name: author
          type: belongs_to
          resource: authors
          description: The article author
        - name: tags
          type: has_many
          resource: tags
          nullable: true
          description: Article tags
  - name: AuthorSerializer
    description: Serializer for blog authors
    resource:
      type: authors
      description: Blog author resource
      attributes:
        - name: name
          type: string
          description: Author full name
        - name: email
          type: string
          description: Author email address
        - name: bio
          type: string
          nullable: true
          description: Author biography
      relationships:
        - name: articles
          type: has_many
          resource: articles
          description: Articles written by this author
`;

console.log('🔄 YAML Support Example');
console.log('======================');

try {
  // 1. Load schema from YAML string
  console.log('📥 Loading JSON API schema from YAML...');
  const jsonApiSchema = JsonApi.YamlLoader.loadFromString(yamlSchemaContent);
  console.log(`✅ Loaded schema: ${jsonApiSchema.title} v${jsonApiSchema.version}`);
  console.log(`   Serializers: ${jsonApiSchema.serializers.length}`);

  // 2. Save schema to YAML file
  console.log('💾 Saving schema to YAML file...');
  JsonApi.YamlLoader.saveToFile(jsonApiSchema, 'blog-schema.yml');
  console.log('✅ Saved to blog-schema.yml');

  // 3. Convert to TypeSpec
  console.log('🔄 Converting JSON API to TypeSpec...');
  const converter = new Converters.JsonApiToTypeSpecConverter();
  const typeSpecResult = converter.convert(jsonApiSchema, {
    namespace: 'BlogApi',
    generateOperations: true,
    title: 'Blog API TypeSpec',
    version: '1.0.0',
  });

  if (typeSpecResult.errors.length > 0) {
    console.error('❌ Conversion errors:', typeSpecResult.errors);
    process.exit(1);
  }

  console.log('✅ TypeSpec conversion successful!');
  if (typeSpecResult.warnings.length > 0) {
    console.warn('⚠️  Warnings:', typeSpecResult.warnings);
  }

  // 4. Generate TypeSpec code
  console.log('📝 Generating TypeSpec code...');
  const typeSpecGenerator = new TypeSpec.TypeSpecGenerator();
  const typeSpecCode = typeSpecGenerator.generateDefinition(typeSpecResult.data);
  fs.writeFileSync('blog-api.tsp', typeSpecCode);
  console.log('✅ Generated blog-api.tsp');

  // 5. Generate OpenAPI in both JSON and YAML formats
  console.log('📊 Generating OpenAPI specifications...');
  const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
  const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
    jsonApiFormat: true,
    servers: [
      {
        url: 'https://api.myblog.com/v1',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.myblog.com/v1',
        description: 'Staging server',
      },
    ],
  });

  // Save as JSON
  Generators.YamlOutput.saveToJsonFile(openApiSpec, 'blog-openapi.json');
  console.log('✅ Generated blog-openapi.json');

  // Save as YAML
  Generators.YamlOutput.saveToYamlFile(openApiSpec, 'blog-openapi.yml');
  console.log('✅ Generated blog-openapi.yml');

  // 6. Auto-detect and load files
  console.log('🔍 Testing auto-detection...');
  
  // Auto-load YAML file
  const loadedFromYaml = JsonApi.YamlLoader.autoLoad('blog-schema.yml');
  console.log(`✅ Auto-loaded YAML: ${loadedFromYaml.title}`);

  // Auto-load OpenAPI YAML
  const loadedOpenApiYaml = Generators.YamlOutput.autoLoad('blog-openapi.yml');
  console.log(`✅ Auto-loaded OpenAPI YAML: ${loadedOpenApiYaml.info.title}`);

  // Auto-load OpenAPI JSON
  const loadedOpenApiJson = Generators.YamlOutput.autoLoad('blog-openapi.json');
  console.log(`✅ Auto-loaded OpenAPI JSON: ${loadedOpenApiJson.info.title}`);

  console.log('');
  console.log('🎉 All operations completed successfully!');
  console.log('📄 Generated files:');
  console.log('   - blog-schema.yml (JSON API Schema in YAML)');
  console.log('   - blog-api.tsp (TypeSpec definition)');
  console.log('   - blog-openapi.json (OpenAPI in JSON)');
  console.log('   - blog-openapi.yml (OpenAPI in YAML)');

} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}