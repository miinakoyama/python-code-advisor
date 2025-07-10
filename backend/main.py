import os
import json
import boto3
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from uuid import uuid4
from run_code import run_in_docker
from typing import Dict, List, Optional
from decimal import Decimal

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DynamoDB接続（ローカル用）
try:
    # ローカルDynamoDBを使用
    dynamodb_endpoint = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:8001")
    dynamodb = boto3.resource(
        "dynamodb", 
        region_name=os.getenv("AWS_REGION", "ap-northeast-1"),
        endpoint_url=dynamodb_endpoint,
        aws_access_key_id="local",
        aws_secret_access_key="local"
    )
    
    challenges_table = dynamodb.Table(os.getenv("CHALLENGES_TABLE", "Challenges"))
    submissions_table = dynamodb.Table(os.getenv("SUBMISSIONS_TABLE", "Submissions"))
    DYNAMODB_AVAILABLE = True
    print("✅ DynamoDB Localに接続しました")
except Exception as e:
    print(f"❌ DynamoDB接続エラー: {e}")
    DYNAMODB_AVAILABLE = False
    # インメモリストレージ（開発用）
    challenges_data = {}
    submissions_data = {}

# Bedrock接続（AWS用）
try:
    # AWS Bedrockを使用（プロファイル指定）
    session = boto3.Session(profile_name="049381387567_Student")
    bedrock = session.client("bedrock-runtime", region_name=os.getenv("AWS_REGION", "ap-northeast-1"))
    BEDROCK_AVAILABLE = True
    print("✅ AWS Bedrockに接続しました")
except Exception as e:
    print(f"❌ Bedrock接続エラー: {e}")
    BEDROCK_AVAILABLE = False

# チート検出キーワード
CHEAT_KEYWORDS = [
    "答えを教えて", "正解を教えて", "解答を教えて", "答えは", "正解は",
    "answer", "solution", "correct answer", "give me the answer",
    "tell me the answer", "what is the answer", "show me the solution"
]

def detect_cheat_attempt(code: str) -> bool:
    """コード内にチート行為のキーワードが含まれているかチェック"""
    code_lower = code.lower()
    return any(keyword in code_lower for keyword in CHEAT_KEYWORDS)

def estimate_cost(input_tokens: int, output_tokens: int) -> float:
    """Claude-3 Sonnetのコストを概算（2024年時点）"""
    # 入力: $3.00 per 1M tokens, 出力: $15.00 per 1M tokens
    input_cost = (input_tokens / 1_000_000) * 3.00
    output_cost = (output_tokens / 1_000_000) * 15.00
    return input_cost + output_cost

def get_challenge_common_mistakes(challenge_id: str) -> str:
    """課題のよくあるミスを取得"""
    if not DYNAMODB_AVAILABLE:
        return "一般的なミスや注意点を確認してください"
    
    try:
        response = challenges_table.get_item(Key={"challenge_id": challenge_id})
        challenge = response.get("Item", {})
        return challenge.get("common_mistakes", "一般的なミスや注意点を確認してください")
    except Exception:
        return "一般的なミスや注意点を確認してください"

def convert_floats_to_decimals(obj):
    """辞書内のfloat型をDecimal型に変換"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, float):
                obj[key] = Decimal(str(value))
            elif isinstance(value, dict):
                convert_floats_to_decimals(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        convert_floats_to_decimals(item)
    return obj

def save_submission(submission_data: Dict):
    """提出履歴を保存"""
    if not DYNAMODB_AVAILABLE:
        submission_id = str(uuid4())
        submissions_data[submission_id] = submission_data
        return
    
    try:
        # float型をDecimal型に変換
        submission_data_converted = convert_floats_to_decimals(submission_data.copy())
        submissions_table.put_item(Item=submission_data_converted)
    except Exception as e:
        print(f"提出履歴の保存に失敗: {e}")

PROMPT_TEMPLATE = """
あなたはPython学習者のための親切で励ましのあるアドバイザーです。

課題情報:
- 課題ID: {challenge_id}
- 課題タイトル: {challenge_title}
- 課題説明: {challenge_description}

テスト結果:
{test_result}

よくあるミス:
{common_mistakes}

以下の観点で建設的で励ましのあるフィードバックを生成してください：

1. **エラー分析**: エラーが発生した場合、原因を分かりやすく説明
2. **改善ヒント**: 具体的な改善方向性を示す（答えは教えない）
3. **コード品質**: 可読性や効率性の向上提案
4. **学習アドバイス**: 関連する学習リソースや練習方法
5. **モチベーション**: 励ましの言葉と成長を認めるメッセージ

重要なルール：
- 決して正解コードを提供しない
- ヒントや方向性を示すにとどめる
- 学習者の努力を認め、励ます
- 次回の挑戦を促す

フィードバックは日本語で、親しみやすく、建設的なトーンで書いてください。
"""

@app.get("/")
async def root():
    return {"message": "Python Code Advisor API"}

@app.get("/challenges")
async def get_challenges():
    """課題一覧を取得"""
    if not DYNAMODB_AVAILABLE:
        # サンプルデータを返す
        return {
            "challenges": [
                {
                    "challenge_id": "challenge-1",
                    "title": "フィボナッチ数列",
                    "description": "与えられた数nまでのフィボナッチ数列を生成する関数を作成してください。",
                    "difficulty": "easy",
                    "category": "アルゴリズム"
                },
                {
                    "challenge_id": "challenge-2",
                    "title": "文字列の逆順",
                    "description": "与えられた文字列を逆順にする関数を作成してください。",
                    "difficulty": "easy",
                    "category": "文字列操作"
                }
            ]
        }
    
    try:
        response = challenges_table.scan()
        challenges = response.get("Items", [])
        return {"challenges": challenges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"課題の取得に失敗しました: {str(e)}")

@app.post("/challenges")
async def create_challenge(challenge: Dict):
    """新しい課題を作成"""
    if not DYNAMODB_AVAILABLE:
        challenge_id = challenge.get("id") or str(uuid4())
        challenge["challenge_id"] = challenge_id
        challenges_data[challenge_id] = challenge
        return {"message": "課題を作成しました", "challenge_id": challenge_id}
    
    try:
        challenge_id = challenge.get("id") or str(uuid4())
        challenge["challenge_id"] = challenge_id
        
        # float型をDecimal型に変換
        challenge_converted = convert_floats_to_decimals(challenge.copy())
        challenges_table.put_item(Item=challenge_converted)
        return {"message": "課題を作成しました", "challenge_id": challenge_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"課題の作成に失敗しました: {str(e)}")

@app.put("/challenges/{challenge_id}")
async def update_challenge(challenge_id: str, challenge: Dict):
    """課題を更新"""
    if not DYNAMODB_AVAILABLE:
        challenge["challenge_id"] = challenge_id
        challenges_data[challenge_id] = challenge
        return {"message": "課題を更新しました"}
    
    try:
        challenge["challenge_id"] = challenge_id
        # float型をDecimal型に変換
        challenge_converted = convert_floats_to_decimals(challenge.copy())
        challenges_table.put_item(Item=challenge_converted)
        return {"message": "課題を更新しました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"課題の更新に失敗しました: {str(e)}")

@app.delete("/challenges/{challenge_id}")
async def delete_challenge(challenge_id: str):
    """課題を削除"""
    if not DYNAMODB_AVAILABLE:
        if challenge_id in challenges_data:
            del challenges_data[challenge_id]
        return {"message": "課題を削除しました"}
    
    try:
        challenges_table.delete_item(Key={"challenge_id": challenge_id})
        return {"message": "課題を削除しました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"課題の削除に失敗しました: {str(e)}")

@app.post("/submit-code")
async def submit_code(payload: dict):
    """コードを提出してフィードバックを取得"""
    code = payload.get("code")
    challenge_id = payload.get("challenge_id")
    
    if not code or not challenge_id:
        raise HTTPException(status_code=400, detail="code and challenge_id required")

    # チート検出
    if detect_cheat_attempt(code):
        return {
            "feedback": "申し訳ございませんが、答えを直接求めるような内容は検出されました。\n\n学習のためには、まず自分で考えてみることが大切です。\n\nヒント：\n- 問題を小さな部分に分けて考えてみましょう\n- 紙に書き出して整理してみましょう\n- エラーメッセージをよく読んでみましょう\n\n頑張ってください！きっと解けますよ！ 💪",
            "result": {"stdout": "", "stderr": "", "returncode": 0},
            "cost": 0.0,
            "cheat_detected": True
        }

    # コード実行
    result = run_in_docker(code)
    
    # 課題情報を取得
    challenge_title = "不明な課題"
    challenge_description = ""
    
    if DYNAMODB_AVAILABLE:
        try:
            challenge_response = challenges_table.get_item(Key={"challenge_id": challenge_id})
            challenge = challenge_response.get("Item", {})
            challenge_title = challenge.get("title", "不明な課題")
            challenge_description = challenge.get("description", "")
        except Exception:
            pass
    else:
        # インメモリデータから取得
        challenge = challenges_data.get(challenge_id, {})
        challenge_title = challenge.get("title", "不明な課題")
        challenge_description = challenge.get("description", "")

    common_mistakes = get_challenge_common_mistakes(challenge_id)

    # AIフィードバック生成
    if not BEDROCK_AVAILABLE:
        # Bedrockが利用できない場合のフォールバック
        feedback = f"""
{challenge_title}の課題について、以下の観点でアドバイスします：

**実行結果**: {'成功' if result['returncode'] == 0 else '失敗'}

**改善のヒント**:
- コードの構造を見直してみましょう
- 変数の名前を分かりやすくしてみましょう
- エラーメッセージをよく読んで、問題を特定しましょう

**学習のポイント**:
- 小さな部分から順番に確認していきましょう
- デバッグ出力を追加して、処理の流れを確認しましょう

頑張ってください！プログラミングは練習が大切です。💪
        """
        estimated_cost = 0.0
    else:
        prompt = PROMPT_TEMPLATE.format(
            challenge_id=challenge_id,
            challenge_title=challenge_title,
            challenge_description=challenge_description,
            test_result=json.dumps(result, ensure_ascii=False),
            common_mistakes=common_mistakes
        )

        try:
            response = bedrock.invoke_model(
                modelId=os.getenv("BEDROCK_MODEL_ID", "apac.anthropic.claude-3-5-sonnet-20240620-v1:0"),
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1000,
                    "messages": [{"role": "user", "content": prompt}]
                })
            )
            
            body = json.loads(response.get("body", "{}"))
            content = body.get("content", [{}])
            feedback = content[0].get("text", "フィードバックの生成に失敗しました")
            
            # コスト概算
            input_tokens = len(prompt.split()) * 1.3  # 概算
            output_tokens = len(feedback.split()) * 1.3  # 概算
            estimated_cost = estimate_cost(input_tokens, output_tokens)
            
        except Exception as e:
            feedback = f"AIフィードバックの生成中にエラーが発生しました: {str(e)}"
            estimated_cost = 0.0

    # 提出履歴を保存
    submission_data = {
        "submission_id": str(uuid4()),
        "challenge_id": challenge_id,
        "code": code,
        "result": result,
        "feedback": feedback,
        "cost": estimated_cost,
        "timestamp": str(uuid4())  # 簡易的なタイムスタンプ
    }
    save_submission(submission_data)

    return {
        "feedback": feedback,
        "result": result,
        "cost": estimated_cost,
        "cheat_detected": False
    }

@app.get("/submissions/{challenge_id}")
async def get_submissions(challenge_id: str):
    """特定の課題の提出履歴を取得"""
    if not DYNAMODB_AVAILABLE:
        submissions = [sub for sub in submissions_data.values() if sub.get("challenge_id") == challenge_id]
        return {"submissions": submissions}
    
    try:
        response = submissions_table.query(
            IndexName="challenge_id-index",
            KeyConditionExpression="challenge_id = :challenge_id",
            ExpressionAttributeValues={":challenge_id": challenge_id}
        )
        submissions = response.get("Items", [])
        return {"submissions": submissions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"提出履歴の取得に失敗しました: {str(e)}")

@app.get("/stats")
async def get_stats():
    """統計情報を取得"""
    if not DYNAMODB_AVAILABLE:
        return {
            "total_challenges": len(challenges_data),
            "total_submissions": len(submissions_data),
            "total_cost": sum(sub.get("cost", 0) for sub in submissions_data.values())
        }
    
    try:
        # 課題数
        challenges_response = challenges_table.scan(Select="COUNT")
        challenge_count = challenges_response.get("Count", 0)
        
        # 提出数
        submissions_response = submissions_table.scan(Select="COUNT")
        submission_count = submissions_response.get("Count", 0)
        
        # 総コスト（Decimal型をfloat型に変換）
        submissions = submissions_table.scan()
        total_cost = 0.0
        for sub in submissions.get("Items", []):
            cost = sub.get("cost", 0)
            if isinstance(cost, Decimal):
                total_cost += float(cost)
            else:
                total_cost += cost
        
        return {
            "total_challenges": challenge_count,
            "total_submissions": submission_count,
            "total_cost": total_cost
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"統計情報の取得に失敗しました: {str(e)}")

handler = Mangum(app)
