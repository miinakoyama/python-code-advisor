import os
import json
import boto3
from fastapi import FastAPI, HTTPException
from mangum import Mangum
from uuid import uuid4
from run_code import run_in_docker

app = FastAPI()

dynamodb = boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION", "us-east-1"))
challenges_table = dynamodb.Table(os.getenv("CHALLENGES_TABLE", "Challenges"))
submissions_table = dynamodb.Table(os.getenv("SUBMISSIONS_TABLE", "Submissions"))

bedrock = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))

PROMPT_TEMPLATE = """
あなたの役割はPython課題のアドバイザーです。
テスト結果:
{test_result}

よくあるミス:
{common_mistakes}

決して正解コードを教えないでください。以下の観点でフィードバックを生成してください。
- エラー原因の候補
- ロジックチェックと改善ヒント
- コード品質と可読性向上の提案
- パフォーマンス改善案
- 学習に役立つリンク
- モチベーションを維持するためのメッセージ
"""

@app.post("/submit-code")
async def submit_code(payload: dict):
    code = payload.get("code")
    challenge_id = payload.get("challenge_id")
    if not code or not challenge_id:
        raise HTTPException(status_code=400, detail="code and challenge_id required")

    result = run_in_docker(code)

    prompt = PROMPT_TEMPLATE.format(
        test_result=json.dumps(result, ensure_ascii=False),
        common_mistakes="登録されたよくあるミスをここに挿入"
    )

    response = bedrock.invoke_model(
        modelId=os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-v2"),
        body=json.dumps({"prompt": prompt})
    )
    body = json.loads(response.get("body", "{}"))
    feedback = body.get("completion", "")

    submissions_table.put_item(Item={
        "submission_id": str(uuid4()),
        "challenge_id": challenge_id,
        "code": code,
        "result": result,
        "feedback": feedback
    })

    return {"feedback": feedback, "result": result}

handler = Mangum(app)
