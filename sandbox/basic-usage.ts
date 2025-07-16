/**
 * Basic usage examples for jsonapi-2-typespec converter
 */

import {
  JsonApi,
  TypeSpec,
  Converters,
  Generators,
} from '../src';

// Example 1: JSON API Schema Definition
const jsonApiSchema: JsonApi.JsonApiSchema = {
  title: 'Blog API',
  version: '1.0.0',
  description: 'A simple blog API with articles and authors',
  serializers: [
    {
      name: 'ArticleSerializer',
      resource: {
        type: 'articles',
        attributes: [
          {
            name: 'title',
            type: 'string',
            description: 'The article title',
          },
          {
            name: 'content',
            type: 'string',
            description: 'The article content',
          },
          {
            name: 'published_at',
            type: 'date',
            nullable: true,
            description: 'When the article was published',
          },
          {
            name: 'status',
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'The article status',
          },
        ],
        relationships: [
          {
            name: 'author',
            type: 'belongs_to',
            resource: 'authors',
            description: 'The article author',
          },
          {
            name: 'tags',
            type: 'has_many',
            resource: 'tags',
            nullable: true,
            description: 'Article tags',
          },
        ],
        description: 'Blog article resource',
      },
      description: 'Serializer for blog articles',
    },
    {
      name: 'AuthorSerializer',
      resource: {
        type: 'authors',
        attributes: [
          {
            name: 'name',
            type: 'string',
            description: 'Author full name',
          },
          {
            name: 'email',
            type: 'string',
            description: 'Author email address',
          },
          {
            name: 'bio',
            type: 'string',
            nullable: true,
            description: 'Author biography',
          },
        ],
        relationships: [
          {
            name: 'articles',
            type: 'has_many',
            resource: 'articles',
            description: 'Articles written by this author',
          },
        ],
        description: 'Blog author resource',
      },
      description: 'Serializer for blog authors',
    },
  ],
};

// Example 2: Convert JSON API to TypeSpec
const jsonApiToTypeSpecConverter = new Converters.JsonApiToTypeSpecConverter();
const typeSpecResult = jsonApiToTypeSpecConverter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  includeRelationships: true,
  generateOperations: true,
  title: 'Blog API TypeSpec',
  version: '1.0.0',
});

if (typeSpecResult.errors.length === 0) {
  console.log('JSON API to TypeSpec conversion successful!');
  console.log('Generated TypeSpec definition:', typeSpecResult.data);
  
  if (typeSpecResult.warnings.length > 0) {
    console.warn('Warnings:', typeSpecResult.warnings);
  }
} else {
  console.error('Conversion failed:', typeSpecResult.errors);
}

// Example 3: Generate TypeSpec code
const typeSpecGenerator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = typeSpecGenerator.generateDefinition(typeSpecResult.data);
console.log('Generated TypeSpec code:');
console.log(typeSpecCode);

// Example 4: Convert TypeSpec back to JSON API
const typeSpecToJsonApiConverter = new Converters.TypeSpecToJsonApiConverter();
const jsonApiResult = typeSpecToJsonApiConverter.convert(typeSpecResult.data, {
  namespace: 'BlogApi',
  includeRelationships: true,
});

if (jsonApiResult.errors.length === 0) {
  console.log('TypeSpec to JSON API conversion successful!');
  console.log('Generated JSON API schema:', jsonApiResult.data);
} else {
  console.error('Conversion failed:', jsonApiResult.errors);
}

// Example 5: Generate OpenAPI from JSON API
const openApiFromJsonApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
const openApiFromJsonApi = openApiFromJsonApiGenerator.generate(jsonApiSchema, {
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

console.log('Generated OpenAPI from JSON API:');
console.log(JSON.stringify(openApiFromJsonApi, null, 2));

// Example 6: Generate OpenAPI from TypeSpec
const openApiFromTypeSpecGenerator = new Generators.OpenApiFromTypeSpecGenerator();
const openApiFromTypeSpec = openApiFromTypeSpecGenerator.generate(typeSpecResult.data, {
  servers: [
    {
      url: 'https://api.myblog.com/v1',
      description: 'Production server',
    },
  ],
});

console.log('Generated OpenAPI from TypeSpec:');
console.log(JSON.stringify(openApiFromTypeSpec, null, 2));