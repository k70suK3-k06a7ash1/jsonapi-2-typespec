#!/usr/bin/env ts-node

import {
  JsonApi,
  TypeSpec,
  Converters,
  Generators,
} from '../../src/index';
import * as fs from 'fs';

console.log('🚀 JSON API ⇄ TypeSpec Converter Sample');
console.log('========================================');

try {
  // 1. Load JSON API schema from YAML file
  console.log('📥 Step 1: Loading JSON API schema from YAML...');
  const jsonApiSchema = JsonApi.YamlLoader.loadFromFile('./sandbox/inputs/blog-schema.yml');
  console.log(`✅ Loaded schema: "${jsonApiSchema.title}" v${jsonApiSchema.version}`);
  console.log(`   📋 Serializers: ${jsonApiSchema.serializers.length}`);
  jsonApiSchema.serializers.forEach(s => {
    console.log(`      - ${s.name} (${s.resource.type})`);
  });

  // 2. Convert JSON API to TypeSpec
  console.log('\n🔄 Step 2: Converting JSON API to TypeSpec...');
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
  console.log(`   📊 Models: ${typeSpecResult.data.namespaces[0].models.length}`);
  console.log(`   🔧 Operations: ${typeSpecResult.data.namespaces[0].operations.length}`);
  
  if (typeSpecResult.warnings.length > 0) {
    console.warn('⚠️  Warnings:', typeSpecResult.warnings);
  }

  // 3. Generate TypeSpec code
  console.log('\n📝 Step 3: Generating TypeSpec code...');
  const typeSpecGenerator = new TypeSpec.TypeSpecGenerator();
  const typeSpecCode = typeSpecGenerator.generateDefinition(typeSpecResult.data);
  fs.writeFileSync('./sandbox/outputs/blog-api.tsp', typeSpecCode);
  console.log('✅ Generated sandbox/outputs/blog-api.tsp');

  // 4. Generate OpenAPI specification
  console.log('\n📊 Step 4: Generating OpenAPI specifications...');
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
  Generators.YamlOutput.saveToJsonFile(openApiSpec, './sandbox/outputs/blog-openapi.json');
  console.log('✅ Generated sandbox/outputs/blog-openapi.json');

  // Save as YAML
  Generators.YamlOutput.saveToYamlFile(openApiSpec, './sandbox/outputs/blog-openapi.yml');
  console.log('✅ Generated sandbox/outputs/blog-openapi.yml');

  // 5. Test auto-detection functionality
  console.log('\n🔍 Step 5: Testing auto-detection...');
  
  // Auto-load YAML file
  const loadedFromYaml = JsonApi.YamlLoader.autoLoad('./sandbox/inputs/blog-schema.yml');
  console.log(`✅ Auto-loaded YAML schema: "${loadedFromYaml.title}"`);

  // Auto-load OpenAPI YAML
  const loadedOpenApiYaml = Generators.YamlOutput.autoLoad('./sandbox/outputs/blog-openapi.yml');
  console.log(`✅ Auto-loaded OpenAPI YAML: "${loadedOpenApiYaml.info.title}"`);

  // Auto-load OpenAPI JSON
  const loadedOpenApiJson = Generators.YamlOutput.autoLoad('./sandbox/outputs/blog-openapi.json');
  console.log(`✅ Auto-loaded OpenAPI JSON: "${loadedOpenApiJson.info.title}"`);

  // 6. Convert TypeSpec back to JSON API (demonstrate bidirectional conversion)
  console.log('\n🔄 Step 6: Testing bidirectional conversion (TypeSpec → JSON API)...');
  const reverseConverter = new Converters.TypeSpecToJsonApiConverter();
  const jsonApiResult = reverseConverter.convert(typeSpecResult.data, {
    namespace: 'BlogApi',
  });

  if (jsonApiResult.errors.length > 0) {
    console.error('❌ Reverse conversion errors:', jsonApiResult.errors);
  } else {
    console.log('✅ Reverse conversion successful!');
    console.log(`   📋 Generated serializers: ${jsonApiResult.data.serializers.length}`);
    
    // Save the reverse-converted schema
    JsonApi.YamlLoader.saveToFile(jsonApiResult.data, './sandbox/outputs/blog-schema-roundtrip.yml');
    console.log('✅ Saved roundtrip result to sandbox/outputs/blog-schema-roundtrip.yml');
  }

  console.log('\n🎉 Sample execution completed successfully!');
  console.log('\n📄 Generated files in sandbox/outputs/:');
  console.log('   📝 blog-api.tsp - TypeSpec definition');
  console.log('   📊 blog-openapi.json - OpenAPI specification (JSON)');
  console.log('   📊 blog-openapi.yml - OpenAPI specification (YAML)');
  console.log('   🔄 blog-schema-roundtrip.yml - Roundtrip conversion result');

  console.log('\n📈 Summary:');
  console.log(`   Input:  YAML schema with ${jsonApiSchema.serializers.length} serializers`);
  console.log(`   Output: TypeSpec with ${typeSpecResult.data.namespaces[0].models.length} models, ${typeSpecResult.data.namespaces[0].operations.length} operations`);
  console.log(`   OpenAPI: ${Object.keys(openApiSpec.paths).length} endpoints, ${Object.keys(openApiSpec.components?.schemas || {}).length} schemas`);

} catch (error) {
  console.error('❌ Error during conversion:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}