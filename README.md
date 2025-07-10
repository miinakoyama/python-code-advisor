# Python Code Advisor

Python 課題の自動フィードバックシステムです。ユーザーが提出した Python コードを安全に実行し、AI（Amazon Bedrock）を使用して個別化されたフィードバックを提供します。

## 概要

このアプリケーションは以下の機能を提供します：

- **安全なコード実行**: Docker コンテナ内でユーザーコードを実行し、システムを保護
- **AI 駆動フィードバック**: Amazon Bedrock（Claude）を使用した個別化された学習アドバイス
- **課題管理**: DynamoDB を使用した課題と提出物の管理
- **Web インターフェース**: Next.js ベースの直感的なユーザーインターフェース
- **チート検出**: 答えを直接求めるようなコードを検出し、学習を促進
- **コスト管理**: AI 使用料の概算と統計情報の提供

## 使用技術

### バックエンド

- **Python 3.11**
- **FastAPI**
- **Mangum**
- **Boto3**
- **Docker**

### フロントエンド

- **Next.js 14**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI**
- **Radix UI**

### インフラ

- **AWS Lambda**
- **API Gateway**
- **DynamoDB**
- **Amazon Bedrock**
- **Serverless Framework**

## セットアップ方法

### 前提条件

- Python 3.11
- Node.js（Serverless Framework と React フロントエンド用）
- Docker（ユーザーコードのサンドボックス実行用）
- AWS CLI（本番環境デプロイ用）

### クイックスタート

1. **依存関係のインストール**:

   ```bash
   # バックエンド
   pip install -r backend/requirements.txt

   # フロントエンド
   cd frontend-next
   npm install
   cd ..
   ```

2. **Serverless Framework のセットアップ**:

   ```bash
   npm install -g serverless serverless-dynamodb-local
   serverless dynamodb install
   ```

3. **開発環境の起動**:
   ```bash
   ./start-dev.sh
   ```

### 手動セットアップ

#### バックエンドセットアップ

1. **Python 依存関係のインストール**:

   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Serverless CLI と DynamoDB ローカルプラグインのインストール**:

   ```bash
   npm install -g serverless serverless-dynamodb-local
   ```

3. **DynamoDB Local のダウンロード**（初回のみ）:

   ```bash
   serverless dynamodb install
   ```

4. **ローカル環境での起動**:
   ```bash
   serverless offline start
   ```
   FastAPI エンドポイントは `http://localhost:3000` で利用可能になります。

#### フロントエンドセットアップ

1. **依存関係のインストール**:

   ```bash
   cd frontend-next
   npm install
   ```

2. **開発サーバーの起動**:
   ```bash
   npm run dev
   ```
   フロントエンドは `http://localhost:3001` で利用可能になります。

## 起動方法

### ローカル開発環境

1. **Docker の起動確認**:
   バックエンドは Docker を使用してユーザーコードを安全に実行します。Docker が起動していることを確認してください。

2. **自動起動スクリプト**（推奨）:

   ```bash
   ./start-dev.sh
   ```

3. **手動起動**:

   ```bash
   # ターミナル1: バックエンド
   serverless offline start

   # ターミナル2: フロントエンド
   cd frontend-next
   npm run dev
   ```

4. **アプリケーションの使用**:
   - ブラウザで `http://localhost:3001` にアクセス
   - 課題を選択
   - Python コードを入力
   - Submit ボタンをクリックしてフィードバックを取得

### 本番環境へのデプロイ

1. **AWS 認証情報の設定**:

   ```bash
   aws configure
   ```

2. **AWS Lambda 関数、API Gateway、DynamoDB テーブルのデプロイ**:

   ```bash
   serverless deploy
   ```

3. **フロントエンドのビルドとデプロイ**:
   ```bash
   cd frontend-next
   npm run build
   # Vercel、Netlify、AWS Amplifyなどでデプロイ
   ```

## 機能詳細

### 受講生機能

- **課題選択**: 難易度別、カテゴリ別の課題一覧
- **コード提出**: 安全な Docker 環境でのコード実行
- **AI フィードバック**: 個別化された改善アドバイス
- **チート検出**: 答えを直接求めるコードの検出と学習促進

### 管理者機能

- **課題管理**: 課題の作成、編集、削除
- **提出履歴**: 学習者の提出履歴と統計
- **コスト管理**: AI 使用料の監視
- **システム統計**: 利用状況の分析

### AI フィードバック機能

- **エラー分析**: 実行エラーの原因説明
- **改善ヒント**: 具体的な改善方向性の提示
- **コード品質**: 可読性と効率性の向上提案
- **学習アドバイス**: 関連リソースと練習方法
- **モチベーション**: 励ましの言葉と成長の認証

## アーキテクチャ

### コード実行フロー

1. ユーザーが Python コードを提出
2. チート検出システムでコードをチェック
3. コードが Docker コンテナ内で実行される（CPU: 0.5, メモリ: 128MB 制限）
4. 実行結果が Amazon Bedrock に送信
5. AI が個別化されたフィードバックを生成
6. 結果とフィードバックが DynamoDB に保存
7. ユーザーにフィードバックを返却

### セキュリティ機能

- Docker コンテナによるコード実行のサンドボックス化
- CPU とメモリ使用量の制限
- 実行時間の制限（10 秒）
- 一時的なファイルシステムの使用
- チート行為の自動検出

## API エンドポイント

### 受講生用

- `POST /submit-code`: コード提出とフィードバック取得
- `GET /challenges`: 課題一覧取得

### 管理者用

- `POST /challenges`: 課題作成
- `PUT /challenges/{id}`: 課題更新
- `DELETE /challenges/{id}`: 課題削除
- `GET /submissions/{challenge_id}`: 提出履歴取得
- `GET /stats`: 統計情報取得

## 環境変数

以下の環境変数を設定してください：

- `AWS_REGION`: AWS リージョン（デフォルト: us-east-1）
- `CHALLENGES_TABLE`: 課題テーブル名（デフォルト: Challenges）
- `SUBMISSIONS_TABLE`: 提出物テーブル名（デフォルト: Submissions）
- `BEDROCK_MODEL_ID`: Bedrock モデル ID（デフォルト: anthropic.claude-3-sonnet-20240229-v1:0）
