#!/usr/bin/env ts-node

/**
 * Ruby Serializer to TypeSpec Conversion Demo
 */

import { Ruby, JsonApi, TypeSpec, Generators } from '../../src/index';
import * as fs from 'fs';
import * as path from 'path';

console.log('🚀 Ruby Serializer → TypeSpec Converter Demo');
console.log('============================================');

async function runDemo() {
  try {
    // Step 1: Parse Ruby serializer files
    console.log('📥 Step 1: Parsing Ruby serializer files...');
    const rubyFiles = [
      'article_serializer.rb',
      'author_serializer.rb', 
      'comment_serializer.rb'
    ];

    const rubySerializers: Ruby.RubySerializerClass[] = [];
    
    for (const fileName of rubyFiles) {
      const filePath = path.join('./sandbox/inputs', fileName);
      console.log(`   📄 Parsing ${fileName}...`);
      
      try {
        // Use legacy string parser (AST parser has ES module import issues in this context)
        const serializer = Ruby.RubySerializerParser.parseFile(filePath);
        rubySerializers.push(serializer);
        console.log(`   ✅ Parsed ${serializer.className}`);
      } catch (error) {
        console.error(`   ❌ Failed to parse ${fileName}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`✅ Parsed ${rubySerializers.length} Ruby serializers`);

    // Step 2: Convert Ruby serializers to JSON API schema using functional approach
    console.log('\n🔄 Step 2: Converting Ruby → JSON API schema...');
    const jsonApiSchema = Ruby.rubyToJsonApiSchema(rubySerializers);
    console.log(`✅ Generated JSON API schema with ${jsonApiSchema.serializers.length} serializers`);

    // Save JSON API schema
    JsonApi.YamlLoader.saveToFile(jsonApiSchema, './sandbox/outputs/ruby-generated-schema.yml');
    fs.writeFileSync('./sandbox/outputs/ruby-generated-schema.json', JSON.stringify(jsonApiSchema, null, 2));
    console.log('💾 Saved JSON API schema to sandbox/outputs/');

    // Step 3: Convert JSON API schema to TypeSpec
    console.log('\n🔄 Step 3: Converting JSON API → TypeSpec...');
    const typeSpecConverter = Ruby.jsonApiToTypeSpec({
      namespace: 'RubyApi',
      generateOperations: true,
      includeRelationships: true,
      title: 'Ruby Serializers API',
      version: '1.0.0',
    });
    
    const typeSpecDefinition = typeSpecConverter(jsonApiSchema);
    console.log(`✅ Generated TypeSpec with ${typeSpecDefinition.namespaces[0].models.length} models`);

    // Generate TypeSpec code
    const typeSpecGenerator = new TypeSpec.TypeSpecGenerator();
    const typeSpecCode = typeSpecGenerator.generateDefinition(typeSpecDefinition);
    fs.writeFileSync('./sandbox/outputs/ruby-generated.tsp', typeSpecCode);
    console.log('💾 Saved TypeSpec to sandbox/outputs/ruby-generated.tsp');

    // Step 4: Generate OpenAPI specifications
    console.log('\n📊 Step 4: Generating OpenAPI specifications...');
    const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
    const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
      jsonApiFormat: true,
      servers: [
        {
          url: 'https://api.myapp.com/v1',
          description: 'Production server',
        },
      ],
    });

    // Save OpenAPI in multiple formats
    Generators.YamlOutput.saveToJsonFile(openApiSpec, './sandbox/outputs/ruby-generated-openapi.json');
    Generators.YamlOutput.saveToYamlFile(openApiSpec, './sandbox/outputs/ruby-generated-openapi.yml');
    console.log('💾 Saved OpenAPI specs to sandbox/outputs/');

    // Step 5: Test the complete functional pipeline
    console.log('\n🔄 Step 5: Testing complete functional pipeline...');
    
    // Complete pipeline: Ruby → TypeSpec → YAML output
    const rubyToYamlPipeline = Ruby.rubyToOutputPipeline('yaml', {
      namespace: 'RubyApi',
      generateOperations: true,
    });
    
    const yamlOutput = rubyToYamlPipeline(rubySerializers);
    fs.writeFileSync('./sandbox/outputs/ruby-pipeline-result.yml', yamlOutput);
    console.log('💾 Saved pipeline result to sandbox/outputs/ruby-pipeline-result.yml');

    // Summary
    console.log('\n🎉 Ruby serializer conversion completed successfully!');
    console.log('\n📄 Generated files in sandbox/outputs/:');
    console.log('   📝 ruby-generated.tsp - TypeSpec definition from Ruby');
    console.log('   📊 ruby-generated-schema.yml - JSON API schema (YAML)');
    console.log('   📊 ruby-generated-schema.json - JSON API schema (JSON)');
    console.log('   📊 ruby-generated-openapi.yml - OpenAPI specification (YAML)');
    console.log('   📊 ruby-generated-openapi.json - OpenAPI specification (JSON)');
    console.log('   🔄 ruby-pipeline-result.yml - Functional pipeline result');

    console.log('\n📈 Summary:');
    console.log(`   Input:  ${rubyFiles.length} Ruby serializer files`);
    console.log(`   Parsed: ${rubySerializers.length} Ruby serializers`);
    console.log(`   Output: JSON API schema with ${jsonApiSchema.serializers.length} serializers`);
    console.log(`   TypeSpec: ${typeSpecDefinition.namespaces[0].models.length} models, ${typeSpecDefinition.namespaces[0].operations.length} operations`);

  } catch (error) {
    console.error('❌ Error during Ruby conversion:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the demo
runDemo();