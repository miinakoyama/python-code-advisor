# Challenge Advisor

Python 課題の自動フィードバックシステムです。ユーザーが提出した Python コードを安全に実行し、AI（Amazon Bedrock）を使用して個別化されたフィードバックを提供します。

## 概要

このアプリケーションは以下の機能を提供します：

- **安全なコード実行**: Docker コンテナ内でユーザーコードを実行し、システムを保護
- **AI 駆動フィードバック**: Amazon Bedrock（Claude）を使用した個別化された学習アドバイス
- **課題管理**: DynamoDB を使用した課題と提出物の管理
- **Web インターフェース**: React ベースの直感的なユーザーインターフェース

## 使用技術

### バックエンド

- **Python 3.11**
- **FastAPI**
- **Mangum**
- **Boto3**
- **Docker**

### フロントエンド

- **React**
- **Axios**
- **Tailwind CSS**

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

### バックエンドセットアップ

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

### フロントエンドセットアップ

このリポジトリには `frontend/src` 配下に React コンポーネントファイルのみが含まれています。

1. **React アプリケーションの作成**:

   ```bash
   # create-react-appを使用する場合
   npx create-react-app my-challenge-advisor
   cd my-challenge-advisor

   # または Viteを使用する場合
   npm create vite@latest my-challenge-advisor -- --template react
   cd my-challenge-advisor
   ```

2. **コンポーネントのコピー**:
   `frontend/src` の内容をあなたのプロジェクトの `src` ディレクトリにコピーしてください。

3. **依存関係のインストール**:

   ```bash
   npm install axios
   ```

4. **開発サーバーの起動**:
   ```bash
   npm start
   ```

フロントエンドは `/submit-code` エンドポイント（バックエンドが提供）にリクエストを送信するように設定されています。

## 起動方法

### ローカル開発環境

1. **Docker の起動確認**:
   バックエンドは Docker を使用してユーザーコードを安全に実行します。Docker が起動していることを確認してください。

2. **バックエンドの起動**:

   ```bash
   serverless offline start
   ```

3. **フロントエンドの起動**:

   ```bash
   npm start
   ```

4. **アプリケーションの使用**:
   - ブラウザで `http://localhost:3000` にアクセス
   - Challenge ID を入力
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

3. **Amplify ホスティングと API 管理**（オプション）:
   ```bash
   npm install -g @aws-amplify/cli
   amplify init
   amplify add api
   amplify add hosting
   amplify publish
   ```

## アーキテクチャ

### コード実行フロー

1. ユーザーが Python コードを提出
2. コードが Docker コンテナ内で実行される（CPU: 0.5, メモリ: 128MB 制限）
3. 実行結果が Amazon Bedrock に送信
4. AI が個別化されたフィードバックを生成
5. 結果とフィードバックが DynamoDB に保存
6. ユーザーにフィードバックを返却

### セキュリティ機能

- Docker コンテナによるコード実行のサンドボックス化
- CPU とメモリ使用量の制限
- 実行時間の制限（10 秒）
- 一時的なファイルシステムの使用

## 環境変数

以下の環境変数を設定してください：

- `AWS_REGION`: AWS リージョン（デフォルト: us-east-1）
- `CHALLENGES_TABLE`: 課題テーブル名（デフォルト: Challenges）
- `SUBMISSIONS_TABLE`: 提出物テーブル名（デフォルト: Submissions）
- `BEDROCK_MODEL_ID`: Bedrock モデル ID（デフォルト: anthropic.claude-v2）
