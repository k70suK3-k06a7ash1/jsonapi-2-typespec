
# Ruby ⇄ JSON API ⇄ TypeSpec Converter

Ruby jsonapi-serializer、JSON API仕様、TypeSpec間の包括的な変換ツールキット、自動OpenAPIスキーマ生成機能付き。

## 概要

このリポジトリは、Ruby jsonapi-serializerクラス、JSON API仕様、TypeSpec定義間の完全な変換パイプラインを提供します。コアドメインは、JSON APIを中央の交換フォーマットとした双方向変換を可能にします。

## 主な機能

- **Ruby → JSON API → TypeSpec**: Ruby jsonapi-serializerクラスを解析し、JSON APIを経由してTypeSpecに変換
- **TypeSpec → JSON API → Ruby**: TypeSpec定義をJSON APIを経由してRubyシリアライザー形式に変換
- **JSON API中央ハブ**: JSON API仕様を中央の交換フォーマットとして使用
- **OpenAPI生成**: 任意のフォーマットから自動的にOpenAPIスキーマを生成
- **関数型合成**: 関数型プログラミングパターンを使用してコンバーターを連鎖
- **ドキュメント同期**: すべてのドキュメント形式間の一貫性を維持
- **柔軟なソース管理**: Ruby、JSON API、またはTypeSpecを権威ある情報源として使用

## アーキテクチャ

### コアドメインアーキテクチャ

このリポジトリは、2つのコア変換フローで接続された3つの主要なアクターで動作します：

1. **Rubyシリアライザー** - Ruby on Rails jsonapi-serializer gemクラス
2. **JSON API仕様** - JSON API仕様に従う中央交換フォーマット
3. **TypeSpec** - MicrosoftのAPI定義言語
4. **OpenAPIスキーマ** - 生成されるドキュメント出力

### コア変換フロー

```
┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│ Rubyシリアライザー│───── フロー1 ────►│   JSON API      │───── フロー2 ────►│    TypeSpec     │
│(jsonapi-serializer)  Ruby→JSON     │     仕様        │   JSON→TypeSpec   │                 │
│     クラス       │                  │  (中央ハブ)      │                   │                 │
└─────────────────┘                  └─────────┬───────┘                   └─────────────────┘
          ▲                                     │                                      │
          │                                     │                                      │
          └───── フロー4 ──────────────────────┼───── フロー3 ─────────────────────────┘
            TypeSpec→JSON→Ruby                │          TypeSpec→JSON
                                               ▼
                                    ┌─────────────────┐
                                    │  OpenAPIスキーマ │
                                    │    (ドキュメント   │
                                    │      出力)      │
                                    └─────────────────┘
```

**コアドメインフロー:**
- **フロー1**: Ruby → JSON API（Rubyシリアライザーを JSON API仕様に解析）
- **フロー2**: JSON API → TypeSpec（JSON API仕様をTypeSpecに変換）
- **フロー3**: TypeSpec → JSON API（TypeSpecをJSON API仕様に変換）
- **フロー4**: JSON API → Ruby（JSON API仕様からRubyシリアライザーを生成）

### 変換マトリクス

| From → To | Rubyシリアライザー | JSON API仕様 | TypeSpec | OpenAPIスキーマ |
|-----------|-------------------|--------------|----------|----------------|
| **Rubyシリアライザー** | ✓ (同一) | ✓ (フロー1) | ✓ (フロー1→2) | ✓ (生成) |
| **JSON API仕様** | ✓ (フロー4) | ✓ (同一) | ✓ (フロー2) | ✓ (生成) |
| **TypeSpec** | ✓ (フロー3→4) | ✓ (フロー3) | ✓ (同一) | ✓ (生成) |
| **OpenAPIスキーマ** | ✗ (読み取り専用) | ✗ (読み取り専用) | ✗ (読み取り専用) | ✓ (同一) |

**コアドメイン変換:**
- **直接フロー**: Ruby ↔ JSON API ↔ TypeSpec（中央JSON APIハブ経由）
- **マルチステップフロー**: Ruby ↔ TypeSpec（JSON API中間ステップ経由）
- **出力生成**: 全フォーマット → OpenAPIスキーマ（ドキュメント専用）

## プロジェクト構造

```
jsonapi-2-typespec/
├── src/                    # 4つの変換フローを実装するコアライブラリ
│   ├── ruby/               # フロー1&4: Ruby ↔ JSON API変換
│   │   ├── types.ts        # Rubyシリアライザー型定義
│   │   ├── parser.ts       # Rubyコード文字列パーサー（フロー1: Ruby→JSON）
│   │   ├── ast-parser.ts   # Ruby ASTパーサー（実験的）
│   │   ├── converters.ts   # Rubyフロー用関数型合成
│   │   └── index.ts        # Rubyモジュールエクスポート
│   ├── json-api/           # 中央JSON API仕様ハンドリング
│   │   ├── types.ts        # JSON API仕様型定義
│   │   ├── serializer.ts   # JSON APIシリアライザーユーティリティ
│   │   ├── yaml-loader.ts  # 仕様用YAML/JSON読み込み
│   │   └── index.ts        # JSON APIモジュールエクスポート
│   ├── typespec/           # フロー2&3: TypeSpec ↔ JSON API変換
│   │   ├── types.ts        # TypeSpec定義型
│   │   ├── generator.ts    # TypeSpecコード生成（フロー2: JSON→TypeSpec）
│   │   ├── parser.ts       # TypeSpec解析（フロー3: TypeSpec→JSON）
│   │   └── index.ts        # TypeSpecモジュールエクスポート
│   ├── converters/         # コア変換フロー実装
│   │   ├── json-api-to-typespec.ts    # フロー2実装
│   │   ├── typespec-to-json-api.ts    # フロー3実装
│   │   └── index.ts        # コンバーターエクスポート
│   └── generators/         # 任意フォーマットからのOpenAPIスキーマ生成
├── tests/                  # テストスイート
├── sandbox/                # デモ・テスト環境
│   ├── inputs/             # サンプル入力スキーマファイル
│   │   ├── article_serializer.rb   # Ruby シリアライザー例
│   │   ├── author_serializer.rb    # Ruby シリアライザー例
│   │   └── comment_serializer.rb   # Ruby シリアライザー例
│   ├── outputs/            # 生成された出力ファイル
│   ├── scripts/            # デモスクリプト
│   │   ├── sample-convert.ts       # JSON API 変換デモ
│   │   └── ruby-convert.ts         # Ruby シリアライザー変換デモ
│   ├── basic-usage.ts      # 基本的な使用例
│   └── yaml-example.ts     # YAML固有の例
├── Makefile               # ビルド・デモコマンド
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

#### コアドメイン使用例: Ruby → JSON API → TypeSpec

```typescript
import { Ruby, JsonApi, TypeSpec, Converters, Generators } from 'jsonapi-2-typespec';

// フロー1: Ruby → JSON API
const rubySerializer = Ruby.RubySerializerParser.parseFile('./app/serializers/article_serializer.rb');
const jsonApiSchema = Ruby.rubyToJsonApiSchema([rubySerializer]);

// フロー2: JSON API → TypeSpec  
const converter = new Converters.JsonApiToTypeSpecConverter();
const typeSpecResult = converter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  generateOperations: true,
});

// TypeSpecコードを生成
const generator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = generator.generateDefinition(typeSpecResult.data);

// 任意のフォーマットからOpenAPIを生成
const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = openApiGenerator.generate(jsonApiSchema);

console.log('Ruby → JSON API → TypeSpec変換完了！');
```

#### 代替使用例: JSON APIスキーマから開始

```typescript
import { JsonApi, TypeSpec, Converters, Generators } from 'jsonapi-2-typespec';

// JSON APIスキーマを直接読み込み（YAML/JSON自動検出）
const jsonApiSchema = JsonApi.YamlLoader.autoLoad('./blog-schema.yml');

// フロー2: JSON API → TypeSpec
const converter = new Converters.JsonApiToTypeSpecConverter();
const result = converter.convert(jsonApiSchema, {
  namespace: 'BlogApi',
  generateOperations: true,
});

// 出力を生成
const generator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = generator.generateDefinition(result.data);

// OpenAPIを生成
const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = openApiGenerator.generate(jsonApiSchema);

// 結果を保存
Generators.YamlOutput.saveToYamlFile(openApiSpec, 'blog-openapi.yml');
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
- **`Ruby`** - Ruby on Rails jsonapi-serializer統合
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

### Ruby統合

このライブラリは、Ruby on Rails `jsonapi-serializer` gemクラスの解析とTypeSpecへの変換をサポートしています。

#### サポートするRuby構文

```ruby
# app/serializers/api/article_serializer.rb
module Api
  class ArticleSerializer
    include JSONAPI::Serializer
    
    set_type :articles
    set_id :id
    
    attributes :title, :content, :published_at
    
    # メソッドを使用したカスタム属性
    attribute :reading_time do |article|
      article.calculate_reading_time
    end
    
    belongs_to :author
    has_many :comments, :tags
  end
end
```

#### RubyからTypeSpecへの変換

```typescript
import { Ruby } from 'jsonapi-2-typespec';

// Rubyシリアライザーファイルを解析
const serializer = Ruby.RubySerializerParser.parseFile('./app/serializers/article_serializer.rb');

// RubyシリアライザーをJSON APIスキーマに変換
const jsonApiSchema = Ruby.rubyToJsonApiSchema([serializer]);

// 関数型合成を使用してTypeSpecに変換
const typeSpecConverter = Ruby.jsonApiToTypeSpec({
  namespace: 'BlogApi',
  generateOperations: true,
  includeRelationships: true,
});

const typeSpecDefinition = typeSpecConverter(jsonApiSchema);

// TypeSpecコードを生成
const generator = new TypeSpec.TypeSpecGenerator();
const typeSpecCode = generator.generateDefinition(typeSpecDefinition);
```

#### 関数型合成パイプライン

```typescript
import { Ruby } from 'jsonapi-2-typespec';

// 完全なRuby → TypeSpec → YAMLパイプライン
const rubyToYamlPipeline = Ruby.rubyToOutputPipeline('yaml', {
  namespace: 'MyApi',
  generateOperations: true,
});

// 複数のRubyファイルを解析
const rubySerializers = [
  Ruby.RubySerializerParser.parseFile('./app/serializers/article_serializer.rb'),
  Ruby.RubySerializerParser.parseFile('./app/serializers/author_serializer.rb'),
];

// パイプラインを実行
const yamlOutput = rubyToYamlPipeline(rubySerializers);
console.log(yamlOutput);
```

#### Rubyシリアライザーのデモ

```bash
# Rubyシリアライザー変換デモを実行
make ruby-demo

# これにより以下が実行されます：
# 1. sandbox/inputs/からRubyシリアライザーファイルを解析
# 2. Ruby → JSON API → TypeSpecに変換
# 3. OpenAPI仕様を生成
# 4. すべての出力をsandbox/outputs/に保存
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
# Makefile使用（推奨）
make help             # 利用可能なコマンドを表示
make install          # 依存関係をインストール
make build            # TypeScriptをビルド
make test             # テストを実行
make sandbox          # サンプル変換デモを実行
make ruby-demo        # Rubyシリアライザー変換デモを実行
make demo             # sandboxのエイリアス
make ruby             # ruby-demoのエイリアス
make clean            # ビルドアーティファクトと出力をクリーン

# npm直接使用
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

### 主要使用例（コアドメイン）

- **RubyからTypeSpecへの移行**: Ruby on Rails jsonapi-serializerクラスをJSON API中間フォーマット経由で最新のTypeSpec定義に変換
- **TypeSpecからRuby生成**: TypeSpec定義からRubyシリアライザーコードを生成してRailsアプリケーションに実装
- **JSON API標準化**: 多言語API実装の中央情報源としてJSON API仕様を使用
- **レガシーRails現代化**: 互換性を維持しながら既存のRails APIをTypeScript/TypeSpecに移行

### 副次的使用例

- **API設計の一貫性**: RubyとTypeScriptプロジェクト間での統一標準の維持
- **ドキュメント自動化**: 任意のソースフォーマット（Ruby/JSON API/TypeSpec）からOpenAPIドキュメントを生成
- **クロスプラットフォーム開発**: RubyバックエンドチームとTypeScriptフロントエンドチーム間のシームレスな協業を実現
- **スキーマ検証**: RubyシリアライザーとTypeScript APIクライアント間の一貫性を保証