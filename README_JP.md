
# JSON API ⇄ TypeSpec Converter

JSON APIシリアライザーとTypeSpec間の双方向変換ツール、自動OpenAPIスキーマ生成機能付き。

## 概要

このリポジトリは、JSON APIシリアライザー定義とTypeSpec間のシームレスな変換を可能にし、自動ドキュメント生成によるAPI仕様管理の統一的アプローチを提供します。

## 主な機能

- **双方向変換**: JSON APIシリアライザーとTypeSpec間の両方向での変換
- **OpenAPI生成**: 両形式から自動的にOpenAPIスキーマを生成
- **ドキュメント同期**: すべてのドキュメント形式間の一貫性を維持
- **単一情報源**: JSON APIまたはTypeSpecのいずれかを権威ある情報源として使用

## アーキテクチャ

### コアアクター

このリポジトリは3つの主要なアクターで動作します：

1. **OpenAPI Schema** - 標準API仕様フォーマット
2. **TypeSpec** - MicrosoftのAPI定義言語
3. **JSON API Serializer** - JSON API仕様に従うデータモデル定義

### アクター関係図

```
┌─────────────────┐    双方向変換      ┌─────────────────┐
│   JSON API      │◄────────────────►│    TypeSpec     │
│   Serializer    │                    │                 │
│  (データモデル)   │                    │                 │
└─────────┬───────┘                    └─────────┬───────┘
          │                                      │
          │ 生成                        生成     │
          ▼                                      ▼
     ┌─────────────────────────────────────────────────┐
     │              OpenAPI Schema                     │
     │          (ドキュメント出力)                        │
     └─────────────────────────────────────────────────┘
```

### 変換マトリクス

| From → To | JSON API Serializer | TypeSpec | OpenAPI Schema |
|-----------|-------------------|----------|----------------|
| **JSON API Serializer** | ✓ (同一) | ✓ (変換) | ✓ (生成) |
| **TypeSpec** | ✓ (変換) | ✓ (同一) | ✓ (生成) |
| **OpenAPI Schema** | ✗ (読み取り専用) | ✗ (読み取り専用) | ✓ (同一) |

**注意**: OpenAPIスキーマは最終的なドキュメント出力として機能し、ソース形式への逆変換は行いません。

## プロジェクト構造

```
jsonapi-2-typespec/
├── src/
│   ├── json-api/           # JSON API シリアライザー定義
│   ├── typespec/           # TypeSpec 定義
│   ├── converters/         # 双方向変換ロジック
│   └── generators/         # OpenAPI スキーマジェネレーター
├── docs/                   # 生成ドキュメント（自動更新）
├── README.md              # 英語ドキュメント
└── README_JP.md           # 日本語ドキュメント
```

## ドキュメント管理

### 単一情報源（SSoT）

- **主要ソース**: JSON APIシリアライザーとTypeSpec定義
- **生成アセット**: ソースから自動的に派生するすべてのドキュメント
- **バージョン管理**: すべての定義の完全な変更履歴
- **一貫性**: 自動同期によりドキュメント間の乖離を防止

### 自動更新

ソース定義が変更されると、システムは以下を自動的に更新します：

- READMEファイル（英語・日本語）
- OpenAPI仕様
- 生成ドキュメント
- すべての派生形式

これにより、ドキュメントエコシステム全体への変更の即座な伝播が保証されます。

## インストール

```bash
npm install jsonapi-2-typespec
```

## クイックスタート

### 入力/出力例

#### 入力: JSON APIスキーマ
```json
{
  "title": "Blog API",
  "version": "1.0.0",
  "serializers": [
    {
      "name": "ArticleSerializer",
      "resource": {
        "type": "articles",
        "attributes": [
          { "name": "title", "type": "string" },
          { "name": "content", "type": "string" },
          { "name": "published_at", "type": "date", "nullable": true },
          { "name": "status", "type": "string", "enum": ["draft", "published"] }
        ],
        "relationships": [
          { "name": "author", "type": "belongs_to", "resource": "authors" }
        ]
      }
    }
  ]
}
```

#### 基本的な使用コード
```typescript
import {
  JsonApi,
  TypeSpec,
  Converters,
  Generators,
} from 'jsonapi-2-typespec';

// JSON APIスキーマを読み込み
const jsonApiSchema: JsonApi.JsonApiSchema = require('./blog-schema.json');

// JSON APIからTypeSpecへ変換
const converter = new Converters.JsonApiToTypeSpecConverter();
const result = converter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  generateOperations: true,
});

// TypeSpecコードを生成
const generator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = generator.generateDefinition(result.data);
console.log(typeSpecCode);
```

#### 出力: 生成されたTypeSpec
```typespec
import "@typespec/rest";
import "@typespec/openapi3";

@service({
  title: "Blog API",
  version: "1.0.0"
})
namespace BlogApi {

  /** ブログ記事リソース */
  @discriminator("type")
  model Articles {
    title: string;
    content: string;
    published_at?: utcDateTime | null;
    status: "draft" | "published";
    author: Authors;
  }

  /** 記事リソースの一覧取得 */
  @route("/articles")
  @get
  op listArticles(): Articles[];

  /** 記事リソースの取得 */
  @route("/articles/{id}")
  @get
  op getArticles(id: string): Articles;

  /** 記事リソースの作成 */
  @route("/articles")
  @post
  op createArticles(body: Articles): Articles;
}
```

#### 出力: 生成されたOpenAPI
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Blog API",
    "version": "1.0.0"
  },
  "paths": {
    "/articles": {
      "get": {
        "summary": "記事リソースの一覧取得",
        "operationId": "listArticles",
        "responses": {
          "200": {
            "description": "記事リソースの一覧",
            "content": {
              "application/vnd.api+json": {
                "schema": {
                  "$ref": "#/components/schemas/ArticlesCollection"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Articles": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["articles"] },
          "title": { "type": "string" },
          "content": { "type": "string" },
          "published_at": { "type": "string", "format": "date-time", "nullable": true },
          "status": { "type": "string", "enum": ["draft", "published"] }
        },
        "required": ["id", "type", "title", "content", "status"]
      }
    }
  }
}
```

## APIリファレンス

### コアモジュール

- **`JsonApi`** - JSON APIシリアライザーの型とユーティリティ
- **`TypeSpec`** - TypeSpec定義の型とコード生成
- **`Converters`** - フォーマット間の双方向変換
- **`Generators`** - 両フォーマットからのOpenAPIスキーマ生成

### JSON APIからTypeSpecへの変換

```typescript
import { Converters } from 'jsonapi-2-typespec';

const converter = new Converters.JsonApiToTypeSpecConverter();
const result = converter.convert(jsonApiSchema, {
  namespace: 'MyApi',           // カスタム名前空間
  includeRelationships: true,   // リレーションシップを含める（デフォルト: true）
  generateOperations: true,     // CRUD操作を生成
  title: 'My API',             // APIタイトル
  version: '1.0.0',            // APIバージョン
});

// 変換エラー・警告をチェック
if (result.errors.length > 0) {
  console.error('変換エラー:', result.errors);
}
if (result.warnings.length > 0) {
  console.warn('変換警告:', result.warnings);
}
```

### TypeSpecからJSON APIへの変換

```typescript
import { Converters } from 'jsonapi-2-typespec';

const converter = new Converters.TypeSpecToJsonApiConverter();
const result = converter.convert(typeSpecDefinition, {
  namespace: 'MyApi',
  includeRelationships: true,
});
```

### OpenAPI生成

#### JSON APIから

```typescript
import { Generators } from 'jsonapi-2-typespec';

const generator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = generator.generate(jsonApiSchema, {
  jsonApiFormat: true,        // JSON API形式を使用（デフォルト: false）
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: '本番サーバー',
    },
  ],
});
```

#### TypeSpecから

```typescript
import { Generators } from 'jsonapi-2-typespec';

const generator = new Generators.OpenApiFromTypeSpecGenerator();
const openApiSpec = generator.generate(typeSpecDefinition, {
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: '本番サーバー',
    },
  ],
});
```

### 完全なワークフロー例

#### 1. 入力ファイル

**`blog-schema.json`** (JSON APIスキーマ)
```json
{
  "title": "Blog API",
  "version": "1.0.0",
  "serializers": [
    {
      "name": "ArticleSerializer",
      "resource": {
        "type": "articles",
        "attributes": [
          { "name": "title", "type": "string" },
          { "name": "content", "type": "string" },
          { "name": "published_at", "type": "date", "nullable": true }
        ],
        "relationships": [
          { "name": "author", "type": "belongs_to", "resource": "authors" }
        ]
      }
    }
  ]
}
```

#### 2. 変換スクリプト

**`convert.ts`**
```typescript
import fs from 'fs';
import path from 'path';
import { JsonApi, TypeSpec, Converters, Generators } from 'jsonapi-2-typespec';

// 入力スキーマを読み込み
const schemaPath = path.join(__dirname, 'blog-schema.json');
const jsonApiSchema: JsonApi.JsonApiSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// TypeSpecに変換
const converter = new Converters.JsonApiToTypeSpecConverter();
const typeSpecResult = converter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  generateOperations: true,
});

// TypeSpecコードを生成
const generator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = generator.generateDefinition(typeSpecResult.data);

// OpenAPIを生成
const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = openApiGenerator.generate(jsonApiSchema);

// 出力ファイルを書き込み
fs.writeFileSync('blog-api.tsp', typeSpecCode);
fs.writeFileSync('blog-openapi.json', JSON.stringify(openApiSpec, null, 2));

console.log('✅ 変換完了！');
console.log('📄 生成されたファイル:');
console.log('  - blog-api.tsp (TypeSpec)');
console.log('  - blog-openapi.json (OpenAPI)');
```

#### 3. 実行結果

```bash
$ npx ts-node convert.ts
✅ 変換完了！
📄 生成されたファイル:
  - blog-api.tsp (TypeSpec)
  - blog-openapi.json (OpenAPI)
```

#### 4. 出力ファイル

**`blog-api.tsp`** (生成されたTypeSpec)
```typespec
import "@typespec/rest";
import "@typespec/openapi3";

@service({
  title: "Blog API",
  version: "1.0.0"
})
namespace BlogApi {
  @discriminator("type")
  model Articles {
    title: string;
    content: string;
    published_at?: utcDateTime | null;
    author: Authors;
  }

  @route("/articles")
  @get
  op listArticles(): Articles[];

  @route("/articles/{id}")
  @get
  op getArticles(id: string): Articles;
}
```

**`blog-openapi.json`** (生成されたOpenAPI)
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Blog API",
    "version": "1.0.0"
  },
  "paths": {
    "/articles": {
      "get": {
        "summary": "記事リソースの一覧取得",
        "operationId": "listArticles",
        "responses": {
          "200": {
            "description": "記事リソースの一覧"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Articles": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["articles"] },
          "title": { "type": "string" },
          "content": { "type": "string" },
          "published_at": { "type": "string", "format": "date-time", "nullable": true }
        },
        "required": ["id", "type", "title", "content"]
      }
    }
  }
}
```

### JSON APIスキーマの構築

```typescript
import { JsonApi } from 'jsonapi-2-typespec';

const serializer = new JsonApi.JsonApiSerializerBuilder('UserSerializer', 'users')
  .addAttribute({
    name: 'email',
    type: 'string',
    description: 'ユーザーのメールアドレス',
  })
  .addAttribute({
    name: 'age',
    type: 'number',
    nullable: true,
  })
  .addRelationship({
    name: 'posts',
    type: 'has_many',
    resource: 'posts',
  })
  .setDescription('ユーザーリソースシリアライザー')
  .build();

// シリアライザーを検証
const errors = JsonApi.validateJsonApiSerializer(serializer);
if (errors.length > 0) {
  console.error('検証エラー:', errors);
}
```

## 開発

### セットアップ

```bash
git clone <repository-url>
cd jsonapi-2-typespec
npm install
```

### スクリプト

```bash
npm run build          # TypeScriptをビルド
npm run dev           # 監視モード開発
npm run test          # テストを実行
npm run test:watch    # 監視モードでテスト実行
npm run test:ui       # UIでテスト実行
npm run test:coverage # カバレッジ付きテスト実行
npm run lint          # コードをlint
npm run format        # コードをフォーマット
```

### テスト

このプロジェクトは[Vitest](https://vitest.dev/)を使用してテストを行います：

```bash
npm run test          # すべてのテストを実行
npm run test:watch    # 監視モードでテスト実行
npm run test:ui       # ブラウザでテストUIを開く
npm run test:coverage # カバレッジレポートを生成
```

## 使用例

- **API設計の一貫性**: プロジェクト間での統一標準の維持
- **レガシー移行**: 既存のJSON APIシリアライザーからTypeSpecへの変換
- **コード生成**: TypeSpec定義からのシリアライザー自動生成
- **ドキュメント自動化**: 実装とAPIドキュメントの同期維持
- **RoR統合**: TypeSpec/JSON API定義からRubyシリアライザークラスを生成