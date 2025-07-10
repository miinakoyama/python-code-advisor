"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Code, BookOpen, Lightbulb, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

interface Feedback {
  feedback: string;
  result: {
    stdout: string;
    stderr: string;
    returncode: number;
  };
  cost: number;
  cheat_detected?: boolean;
}

export default function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // サンプル課題データ
  useEffect(() => {
    setChallenges([
      {
        id: "challenge-1",
        title: "フィボナッチ数列",
        description:
          "与えられた数nまでのフィボナッチ数列を生成する関数を作成してください。",
        difficulty: "easy",
        category: "アルゴリズム",
      },
      {
        id: "challenge-2",
        title: "文字列の逆順",
        description: "与えられた文字列を逆順にする関数を作成してください。",
        difficulty: "easy",
        category: "文字列操作",
      },
      {
        id: "challenge-3",
        title: "素数判定",
        description:
          "与えられた数が素数かどうかを判定する関数を作成してください。",
        difficulty: "medium",
        category: "数学",
      },
    ]);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = async () => {
    if (!selectedChallenge || !code.trim()) {
      toast.error("課題を選択し、コードを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/submit-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          challenge_id: selectedChallenge.id,
        }),
      });

      if (!response.ok) {
        throw new Error("APIリクエストに失敗しました");
      }

      const data = await response.json();
      setFeedback(data);

      if (data.cheat_detected) {
        toast.warning("チート行為が検出されました");
      } else {
        toast.success("フィードバックを生成しました！");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Code className="w-8 h-8 text-blue-600" />
            Python Code Advisor
          </h1>
          <p className="text-lg text-gray-600">
            AI駆動のPython学習支援システム
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 課題選択 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  課題を選択
                </CardTitle>
                <CardDescription>
                  学習したい課題を選択してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedChallenge?.id === challenge.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedChallenge(challenge)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {challenge.title}
                      </h3>
                      <Badge
                        className={getDifficultyColor(challenge.difficulty)}
                      >
                        {challenge.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {challenge.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {challenge.category}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 管理者モード切り替え */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">管理者モード</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isAdmin) {
                      window.location.href = "/";
                    } else {
                      window.location.href = "/admin";
                    }
                  }}
                  className="w-full"
                >
                  {isAdmin
                    ? "受講生モードに切り替え"
                    : "管理者モードに切り替え"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 右側: コード入力とフィードバック */}
          <div className="space-y-6">
            {/* コード入力 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  コードを入力
                </CardTitle>
                <CardDescription>
                  {selectedChallenge
                    ? selectedChallenge.title
                    : "課題を選択してください"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="ここにPythonコードを入力してください..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  disabled={!selectedChallenge}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedChallenge || !code.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? "処理中..." : "コードを提出"}
                </Button>
              </CardContent>
            </Card>

            {/* フィードバック表示 */}
            {feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    AIフィードバック
                    {feedback.cheat_detected && (
                      <Badge variant="destructive" className="ml-2">
                        チート検出
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    あなたのコードに対する改善アドバイス
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${
                      feedback.cheat_detected
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-blue-50"
                    }`}
                  >
                    <h4
                      className={`font-semibold mb-2 ${
                        feedback.cheat_detected
                          ? "text-orange-900"
                          : "text-blue-900"
                      }`}
                    >
                      {feedback.cheat_detected
                        ? "⚠️ 注意"
                        : "💡 改善アドバイス"}
                    </h4>
                    <div
                      className={`text-sm whitespace-pre-wrap ${
                        feedback.cheat_detected
                          ? "text-orange-800"
                          : "text-blue-800"
                      }`}
                    >
                      {feedback.feedback}
                    </div>
                  </div>

                  {!feedback.cheat_detected && feedback.result.stderr && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2">
                        ⚠️ エラー
                      </h4>
                      <pre className="text-sm text-red-800 whitespace-pre-wrap">
                        {feedback.result.stderr}
                      </pre>
                    </div>
                  )}

                  {!feedback.cheat_detected && feedback.result.stdout && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">
                        📤 出力
                      </h4>
                      <pre className="text-sm text-green-800 whitespace-pre-wrap">
                        {feedback.result.stdout}
                      </pre>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      実行結果:{" "}
                      {feedback.result.returncode === 0 ? "成功" : "失敗"}
                    </span>
                    <span>コスト: ${feedback.cost?.toFixed(4) || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
