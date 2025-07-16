# ユーザーシナリオ: Ruby統合

このドキュメントでは、Ruby on Rails jsonapi-serializerとTypeSpec変換統合の実践的なユーザーシナリオを説明します。

## シナリオ1: レガシーRails APIのTypeSpecへの移行

### 背景
**チーム**: SaaS企業のフルスタック開発チーム  
**課題**: 5年間運用されているRuby on Rails APIを現代的なTypeScript/TypeSpecベースのアーキテクチャへ移行  
**目標**: API互換性を維持しながらスタックを現代化

### 現在の状態
```ruby
# app/serializers/api/v1/user_serializer.rb
module Api
  module V1
    class UserSerializer
      include JSONAPI::Serializer
      
      set_type :users
      set_id :id
      
      attributes :email, :name, :created_at, :updated_at
      
      attribute :avatar_url do |user|
        user.avatar.present? ? user.avatar.url : nil
      end
      
      attribute :subscription_status do |user|
        user.subscription&.status || 'free'
      end
      
      has_many :projects
      belongs_to :organization
    end
  end
end
```

### 移行プロセス

#### ステップ1: 既存シリアライザーの分析
```bash
# Railsアプリ内のすべてのシリアライザーを発見
find app/serializers -name "*.rb" | head -10
```

#### ステップ2: TypeSpecへの変換
```typescript
import { Ruby } from 'jsonapi-2-typespec';
import * as fs from 'fs';
import * as path from 'path';

// 既存のRubyシリアライザーを解析
const serializerFiles = [
  'app/serializers/api/v1/user_serializer.rb',
  'app/serializers/api/v1/project_serializer.rb',
  'app/serializers/api/v1/organization_serializer.rb'
];

const rubySerializers = serializerFiles.map(file => 
  Ruby.RubySerializerParser.parseFile(file)
);

// 関数型パイプラインを使用してTypeSpecに変換
const typeSpecPipeline = Ruby.rubyToOutputPipeline('typespec', {
  namespace: 'ApiV1',
  generateOperations: true,
  includeRelationships: true,
  title: 'Legacy API v1',
  version: '1.0.0',
});

const typeSpecCode = typeSpecPipeline(rubySerializers);
fs.writeFileSync('./api-v1.tsp', typeSpecCode);

console.log('✅ 3つのRubyシリアライザーをTypeSpecに変換しました');
```

#### ステップ3: OpenAPIドキュメントの生成
```typescript
// 包括的なAPIドキュメントを生成
const jsonApiSchema = Ruby.rubyToJsonApiSchema(rubySerializers);

const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
  jsonApiFormat: true,
  servers: [
    {
      url: 'https://api.mycompany.com/v1',
      description: '本番API'
    }
  ]
});

Generators.YamlOutput.saveToYamlFile(openApiSpec, './legacy-api-docs.yml');
```

### 成果
- **移行時間**: 2週間から2日に短縮
- **API互換性**: 自動変換により100%維持
- **ドキュメント**: フロントエンドチーム向けの自動生成OpenAPI仕様
- **型安全性**: TypeSpecから生成された新しいTypeScriptクライアント

---

## シナリオ2: マルチプラットフォームAPI設計

### 背景
**チーム**: フィンテック・スタートアップのAPIプラットフォームチーム  
**課題**: モバイル、ウェブ、パートナー統合に対応するAPI構築  
**目標**: 複数プラットフォームにわたるAPI仕様の単一情報源

### 要件
- Rubyバックエンド（既存のRailsインフラ）
- TypeScriptフロントエンド（React Native + Next.js）
- パートナーAPIドキュメント（OpenAPI）
- GraphQLゲートウェイ（将来要件）

### 実装

#### ステップ1: Rubyシリアライザーでの設計
```ruby
# app/serializers/financial/account_serializer.rb
module Financial
  class AccountSerializer
    include JSONAPI::Serializer
    
    set_type :accounts
    set_id :uuid
    
    attributes :account_number, :account_type, :currency
    
    attribute :balance do |account|
      {
        available: account.available_balance.to_f,
        pending: account.pending_balance.to_f,
        total: account.total_balance.to_f
      }
    end
    
    attribute :status do |account|
      account.active? ? 'active' : 'suspended'
    end
    
    has_many :transactions
    belongs_to :customer
  end
end
```

#### ステップ2: マルチプラットフォーム仕様の生成
```typescript
import { Ruby, TypeSpec, Generators } from 'jsonapi-2-typespec';

async function generatePlatformSpecs() {
  // Rubyシリアライザーを解析
  const serializers = [
    Ruby.RubySerializerParser.parseFile('./app/serializers/financial/account_serializer.rb'),
    Ruby.RubySerializerParser.parseFile('./app/serializers/financial/transaction_serializer.rb'),
    Ruby.RubySerializerParser.parseFile('./app/serializers/financial/customer_serializer.rb'),
  ];

  // TypeScriptクライアント用のTypeSpecを生成
  const typeSpecResult = Ruby.rubyToTypeSpecPipeline({
    namespace: 'FinancialApi',
    generateOperations: true,
    title: 'Financial API',
    version: '2.0.0',
  })(serializers);

  // パートナー用のOpenAPIを生成
  const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
  const openApiSpec = new Generators.OpenApiFromJsonApiGenerator()
    .generate(jsonApiSchema, {
      servers: [
        { url: 'https://api.fintech.com/v2', description: '本番環境' },
        { url: 'https://sandbox.fintech.com/v2', description: 'サンドボックス' }
      ]
    });

  // すべての形式で保存
  fs.writeFileSync('./specs/financial-api.tsp', typeSpecResult);
  Generators.YamlOutput.saveToYamlFile(openApiSpec, './specs/financial-api-openapi.yml');
  Generators.YamlOutput.saveToJsonFile(openApiSpec, './specs/financial-api-openapi.json');
  
  console.log('✅ すべてのプラットフォーム用の仕様を生成しました');
}

generatePlatformSpecs();
```

#### ステップ3: 自動化されたCI/CD統合
```yaml
# .github/workflows/api-specs.yml
name: API仕様生成
on:
  push:
    paths: ['app/serializers/**/*.rb']

jobs:
  generate-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: 依存関係をインストール
        run: npm install jsonapi-2-typespec
      
      - name: API仕様を生成
        run: |
          npx ts-node scripts/generate-specs.ts
          
      - name: アーティファクトレジストリにアップロード
        run: |
          # TypeSpecを内部レジストリにアップロード
          # パートナードキュメントポータルを更新
          # クライアントSDK生成をトリガー
```

### 結果
- **一貫性**: 単一のRubyソースからすべてのプラットフォーム仕様を生成
- **自動化**: シリアライザー変更時にすべての仕様をCI/CDパイプラインで更新
- **開発者体験**: TypeScript開発者が型安全なクライアントを取得
- **パートナー統合**: 常に最新のOpenAPIドキュメント

---

## シナリオ3: マイクロサービスアーキテクチャのドキュメント化

### 背景
**チーム**: EC企業のプラットフォームエンジニアリングチーム  
**課題**: 15以上のマイクロサービスで一貫性のないAPIドキュメント  
**目標**: 自動ドキュメント生成を備えた中央集権的APIカタログ

### アーキテクチャ
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  ユーザーサービス │  │ 商品サービス     │  │ 注文サービス     │
│   (Ruby/Rails)  │  │   (Ruby/Rails)  │  │  (Ruby/Rails)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                ┌─────────────────────────────┐
                │   APIドキュメント            │
                │   生成パイプライン            │
                │   (jsonapi-2-typespec)      │
                └─────────────────────────────┘
                               │
                ┌─────────────────────────────┐
                │    中央集権的API             │
                │    ドキュメントポータル       │
                └─────────────────────────────┘
```

### 実装

#### ステップ1: サービス発見と解析
```typescript
// scripts/generate-service-catalog.ts
import { Ruby } from 'jsonapi-2-typespec';
import * as glob from 'glob';
import * as path from 'path';

interface ServiceSpec {
  name: string;
  version: string;
  serializers: Ruby.RubySerializerClass[];
  typeSpec: string;
  openApi: object;
}

async function generateServiceCatalog(): Promise<ServiceSpec[]> {
  const services = [
    { name: 'user-service', path: './services/user-service' },
    { name: 'product-service', path: './services/product-service' },
    { name: 'order-service', path: './services/order-service' },
  ];

  const catalog: ServiceSpec[] = [];

  for (const service of services) {
    console.log(`🔍 ${service.name}を処理中...`);
    
    // サービス内のすべてのシリアライザーを検索
    const serializerFiles = glob.sync(
      `${service.path}/app/serializers/**/*_serializer.rb`
    );
    
    // Rubyシリアライザーを解析
    const serializers = serializerFiles.map(file => {
      try {
        return Ruby.RubySerializerParser.parseFile(file);
      } catch (error) {
        console.warn(`⚠️  ${file}の解析に失敗: ${error.message}`);
        return null;
      }
    }).filter(Boolean);

    if (serializers.length === 0) {
      console.log(`⚠️  ${service.name}でシリアライザーが見つかりません`);
      continue;
    }

    // TypeSpecを生成
    const typeSpecConverter = Ruby.jsonApiToTypeSpec({
      namespace: toPascalCase(service.name),
      generateOperations: true,
      title: `${service.name} API`,
      version: '1.0.0',
    });

    const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
    const typeSpecDefinition = typeSpecConverter(jsonApiSchema);
    const typeSpecCode = new TypeSpec.TypeSpecGenerator()
      .generateDefinition(typeSpecDefinition);

    // OpenAPIを生成
    const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
    const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
      servers: [
        {
          url: `https://api.company.com/${service.name}/v1`,
          description: `${service.name} 本番API`
        }
      ]
    });

    catalog.push({
      name: service.name,
      version: '1.0.0',
      serializers,
      typeSpec: typeSpecCode,
      openApi: openApiSpec,
    });

    console.log(`✅ ${service.name}の仕様を生成 (${serializers.length} シリアライザー)`);
  }

  return catalog;
}

function toPascalCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            .replace(/^([a-z])/, (g) => g.toUpperCase());
}
```

#### ステップ2: 統合ドキュメントの生成
```typescript
// scripts/build-documentation-portal.ts
async function buildDocumentationPortal() {
  const catalog = await generateServiceCatalog();
  
  // サービスインデックスを作成
  const serviceIndex = {
    title: 'マイクロサービスAPIカタログ',
    version: '1.0.0',
    services: catalog.map(service => ({
      name: service.name,
      version: service.version,
      endpoint: `https://api.company.com/${service.name}/v1`,
      documentation: `./services/${service.name}/openapi.yml`,
      typespec: `./services/${service.name}/api.tsp`,
      serializers: service.serializers.length,
    }))
  };

  // 個別サービス仕様を保存
  for (const service of catalog) {
    const serviceDir = `./docs/services/${service.name}`;
    fs.mkdirSync(serviceDir, { recursive: true });
    
    // TypeSpecを保存
    fs.writeFileSync(
      path.join(serviceDir, 'api.tsp'),
      service.typeSpec
    );
    
    // OpenAPIを保存
    Generators.YamlOutput.saveToYamlFile(
      service.openApi,
      path.join(serviceDir, 'openapi.yml')
    );
    
    // SDK例を生成
    const sdkExamples = generateSDKExamples(service);
    fs.writeFileSync(
      path.join(serviceDir, 'sdk-examples.md'),
      sdkExamples
    );
  }

  // カタログインデックスを保存
  fs.writeFileSync(
    './docs/service-catalog.json',
    JSON.stringify(serviceIndex, null, 2)
  );

  console.log(`🎉 ${catalog.length}サービスのドキュメントポータルを生成しました`);
  console.log('📖 ドキュメントは次の場所で利用可能: ./docs/');
}

function generateSDKExamples(service: ServiceSpec): string {
  return `# ${service.name} SDK例

## TypeScriptクライアント
\`\`\`typescript
import { ${toPascalCase(service.name)}Client } from '@company/api-clients';

const client = new ${toPascalCase(service.name)}Client({
  baseURL: 'https://api.company.com/${service.name}/v1',
  apiKey: process.env.API_KEY
});

// Rubyシリアライザーから生成された型安全なAPIコール
const users = await client.users.list();
const user = await client.users.get(userId);
\`\`\`

## cURL例
\`\`\`bash
# Rubyシリアライザー定義から生成
curl -X GET "https://api.company.com/${service.name}/v1/users" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/vnd.api+json"
\`\`\`
`;
}

buildDocumentationPortal();
```

#### ステップ3: 自動監視と更新
```typescript
// scripts/monitor-serializers.ts
import { watch } from 'chokidar';

function startSerializerMonitoring() {
  const watcher = watch('./services/*/app/serializers/**/*.rb', {
    persistent: true
  });

  watcher.on('change', async (filePath) => {
    console.log(`📝 シリアライザーが変更されました: ${filePath}`);
    
    try {
      // 変更されたシリアライザーを再解析
      const serializer = Ruby.RubySerializerParser.parseFile(filePath);
      console.log(`✅ ${serializer.className}の解析に成功しました`);
      
      // ドキュメント再生成をトリガー
      await buildDocumentationPortal();
      
      // 開発チームに通知
      await notifyTeams({
        message: `${path.dirname(filePath)}のAPI仕様が更新されました`,
        changes: [`${serializer.className}を更新`],
        documentation: `https://docs.company.com/api/${extractServiceName(filePath)}`
      });
      
    } catch (error) {
      console.error(`❌ ${filePath}の処理に失敗:`, error.message);
      
      // 解析エラーについて通知
      await notifyTeams({
        level: 'error',
        message: `シリアライザー解析エラー: ${filePath}`,
        error: error.message
      });
    }
  });

  console.log('👀 シリアライザーの変更を監視中...');
}

function extractServiceName(filePath: string): string {
  const match = filePath.match(/services\/([^\/]+)\//);
  return match ? match[1] : 'unknown';
}

async function notifyTeams(notification: any) {
  // Slack、Teams、またはその他の通知統合
  console.log('📢 通知:', notification);
}

startSerializerMonitoring();
```

### 結果
- **中央集権的ドキュメント**: 単一パイプラインから15のマイクロサービスすべてを文書化
- **リアルタイム更新**: シリアライザー変更時にドキュメントが自動更新
- **開発者生産性**: チームがAPIドキュメントに費やす時間が80%削減
- **API一貫性**: 自動化によりすべてのサービスで標準を強制
- **チーム間コラボレーション**: 標準化された形式によりサービス発見が改善

---

## シナリオ4: APIバージョニングと後方互換性

### 背景
**チーム**: ソーシャルメディアプラットフォームのAPI製品チーム  
**課題**: 後方互換性を維持しながらAPIバージョニングを管理  
**目標**: 破壊的変更の自動検出とドキュメント生成

### 実装

#### ステップ1: バージョン比較パイプライン
```typescript
// scripts/api-version-manager.ts
import { Ruby, JsonApi } from 'jsonapi-2-typespec';
import * as semver from 'semver';

interface VersionComparison {
  version: string;
  breaking: boolean;
  changes: ApiChange[];
  compatibility: 'major' | 'minor' | 'patch';
}

interface ApiChange {
  type: 'added' | 'removed' | 'modified';
  severity: 'breaking' | 'non-breaking';
  element: string;
  description: string;
}

async function compareApiVersions(
  currentPath: string, 
  previousPath: string
): Promise<VersionComparison> {
  
  // 現在のシリアライザーを解析
  const currentSerializers = parseDirectory(currentPath);
  const currentSchema = Ruby.rubyToJsonApiSchema(currentSerializers);
  
  // 以前のシリアライザーを解析
  const previousSerializers = parseDirectory(previousPath);
  const previousSchema = Ruby.rubyToJsonApiSchema(previousSerializers);
  
  // 変更を分析
  const changes = analyzeSchemaChanges(previousSchema, currentSchema);
  const hasBreaking = changes.some(change => change.severity === 'breaking');
  
  return {
    version: semver.inc(getCurrentVersion(), hasBreaking ? 'major' : 'minor'),
    breaking: hasBreaking,
    changes,
    compatibility: hasBreaking ? 'major' : 'minor'
  };
}

function analyzeSchemaChanges(
  previous: JsonApi.JsonApiSchema, 
  current: JsonApi.JsonApiSchema
): ApiChange[] {
  const changes: ApiChange[] = [];
  
  // シリアライザーを比較
  const prevSerializers = new Map(previous.serializers.map(s => [s.name, s]));
  const currSerializers = new Map(current.serializers.map(s => [s.name, s]));
  
  // 削除されたシリアライザーをチェック（破壊的）
  for (const [name, serializer] of prevSerializers) {
    if (!currSerializers.has(name)) {
      changes.push({
        type: 'removed',
        severity: 'breaking',
        element: `serializer.${name}`,
        description: `シリアライザーを削除: ${name}`
      });
    }
  }
  
  // 追加されたシリアライザーをチェック（非破壊的）
  for (const [name, serializer] of currSerializers) {
    if (!prevSerializers.has(name)) {
      changes.push({
        type: 'added',
        severity: 'non-breaking',
        element: `serializer.${name}`,
        description: `シリアライザーを追加: ${name}`
      });
    }
  }
  
  // 既存シリアライザーを比較
  for (const [name, current] of currSerializers) {
    const previous = prevSerializers.get(name);
    if (previous) {
      const serializerChanges = compareSerializers(previous, current);
      changes.push(...serializerChanges);
    }
  }
  
  return changes;
}

function compareSerializers(
  previous: JsonApi.JsonApiSerializer,
  current: JsonApi.JsonApiSerializer
): ApiChange[] {
  const changes: ApiChange[] = [];
  
  // 属性を比較
  const prevAttrs = new Map(previous.resource.attributes.map(a => [a.name, a]));
  const currAttrs = new Map(current.resource.attributes.map(a => [a.name, a]));
  
  // 削除された属性（破壊的）
  for (const [name, attr] of prevAttrs) {
    if (!currAttrs.has(name)) {
      changes.push({
        type: 'removed',
        severity: 'breaking',
        element: `${previous.name}.${name}`,
        description: `属性を削除: ${name}`
      });
    }
  }
  
  // 追加された属性（非破壊的）
  for (const [name, attr] of currAttrs) {
    if (!prevAttrs.has(name)) {
      changes.push({
        type: 'added',
        severity: 'non-breaking',
        element: `${current.name}.${name}`,
        description: `属性を追加: ${name}`
      });
    }
  }
  
  // 変更された属性
  for (const [name, currentAttr] of currAttrs) {
    const previousAttr = prevAttrs.get(name);
    if (previousAttr) {
      // 型変更は破壊的
      if (previousAttr.type !== currentAttr.type) {
        changes.push({
          type: 'modified',
          severity: 'breaking',
          element: `${current.name}.${name}`,
          description: `型を${previousAttr.type}から${currentAttr.type}に変更`
        });
      }
      
      // nullable → non-nullableは破壊的
      if (previousAttr.nullable && !currentAttr.nullable) {
        changes.push({
          type: 'modified',
          severity: 'breaking',
          element: `${current.name}.${name}`,
          description: `属性を非nullable化: ${name}`
        });
      }
    }
  }
  
  return changes;
}
```

#### ステップ2: 自動バージョン管理
```typescript
// scripts/release-manager.ts
async function prepareApiRelease() {
  const comparison = await compareApiVersions(
    './app/serializers',
    './previous-version/app/serializers'
  );
  
  console.log(`📋 APIバージョン分析`);
  console.log(`提案バージョン: ${comparison.version}`);
  console.log(`破壊的変更: ${comparison.breaking ? 'あり' : 'なし'}`);
  console.log(`総変更数: ${comparison.changes.length}`);
  
  // 変更ログを生成
  const changelog = generateChangelog(comparison);
  fs.writeFileSync('./CHANGELOG.md', changelog);
  
  // 破壊的変更の移行ガイドを生成
  if (comparison.breaking) {
    const migrationGuide = generateMigrationGuide(comparison);
    fs.writeFileSync('./MIGRATION.md', migrationGuide);
  }
  
  // バージョン固有のドキュメントを生成
  await generateVersionedDocs(comparison.version);
  
  // APIクライアントSDKを更新
  await updateClientSDKs(comparison.version);
  
  console.log('✅ リリース準備完了');
}

function generateChangelog(comparison: VersionComparison): string {
  const breaking = comparison.changes.filter(c => c.severity === 'breaking');
  const nonBreaking = comparison.changes.filter(c => c.severity === 'non-breaking');
  
  return `# 変更ログ - v${comparison.version}

## 🚨 破壊的変更
${breaking.map(change => `- **${change.element}**: ${change.description}`).join('\n')}

## ✨ 新機能
${nonBreaking.filter(c => c.type === 'added').map(change => `- **${change.element}**: ${change.description}`).join('\n')}

## 🔧 改善
${nonBreaking.filter(c => c.type === 'modified').map(change => `- **${change.element}**: ${change.description}`).join('\n')}

${new Date().toISOString()}にRubyシリアライザー分析から生成
`;
}

async function generateVersionedDocs(version: string) {
  // 現在のシリアライザーを解析
  const serializers = parseDirectory('./app/serializers');
  
  // バージョン付きTypeSpecを生成
  const typeSpecCode = Ruby.rubyToOutputPipeline('typespec', {
    namespace: 'ApiV' + version.replace(/\./g, ''),
    title: `ソーシャルメディアAPI v${version}`,
    version: version,
    generateOperations: true,
  })(serializers);
  
  // バージョン付きOpenAPIを生成
  const jsonApiSchema = Ruby.rubyToJsonApiSchema(serializers);
  const openApiGenerator = new Generators.OpenApiFromJsonApiGenerator();
  const openApiSpec = openApiGenerator.generate(jsonApiSchema, {
    info: { version },
    servers: [
      { url: `https://api.social.com/v${version.split('.')[0]}` }
    ]
  });
  
  // バージョン付きドキュメントを保存
  const versionDir = `./docs/versions/v${version}`;
  fs.mkdirSync(versionDir, { recursive: true });
  
  fs.writeFileSync(path.join(versionDir, 'api.tsp'), typeSpecCode);
  Generators.YamlOutput.saveToYamlFile(openApiSpec, path.join(versionDir, 'openapi.yml'));
}
```

### 結果
- **自動バージョニング**: 実際のAPI変更に基づくセマンティックバージョニング
- **破壊的変更検出**: 後方互換性問題の自動識別
- **移行ガイド**: バージョンアップグレード用の自動生成ドキュメント
- **クライアントSDK更新**: すべてのプラットフォームSDKの協調更新
- **リリース信頼性**: 変更影響評価の100%精度

---

## まとめ

これらのユーザーシナリオは、Ruby統合が異なる組織コンテキストでどのように実践的価値を提供するかを示しています：

1. **レガシー移行**: 互換性を維持しながら移行時間を週単位から日単位に短縮
2. **マルチプラットフォームAPI**: 多様なクライアントニーズに対する単一情報源アプローチを実現
3. **マイクロサービスドキュメント**: 分散アーキテクチャにわたってAPIドキュメントをスケール
4. **バージョン管理**: 複雑なバージョニングと互換性分析を自動化

関数型合成アプローチとRuby AST解析機能により、API一貫性、自動化、開発者生産性が重要な実世界のエンタープライズユースケースでツールが価値を発揮します。