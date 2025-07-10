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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  test_cases?: string;
  common_mistakes?: string;
}

export default function AdminPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
    category: "",
    testCases: "",
    commonMistakes: "",
  });

  // サンプルデータ
  useEffect(() => {
    setChallenges([
      {
        id: "challenge-1",
        title: "フィボナッチ数列",
        description:
          "与えられた数nまでのフィボナッチ数列を生成する関数を作成してください。",
        difficulty: "easy",
        category: "アルゴリズム",
        test_cases: "fibonacci(5) → [0,1,1,2,3]",
        common_mistakes: "インデックスの範囲指定ミス、再帰の終了条件の誤り",
      },
    ]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("タイトルと説明を入力してください");
      return;
    }

    const newChallenge: Challenge = {
      id: editingChallenge?.id || `challenge-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      difficulty: formData.difficulty,
      category: formData.category,
      test_cases: formData.testCases,
      common_mistakes: formData.commonMistakes,
    };

    if (isEditing && editingChallenge) {
      setChallenges(
        challenges.map((c) => (c.id === editingChallenge.id ? newChallenge : c))
      );
      toast.success("課題を更新しました");
    } else {
      setChallenges([...challenges, newChallenge]);
      toast.success("新しい課題を追加しました");
    }

    resetForm();
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setIsEditing(true);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category,
      testCases: challenge.test_cases || "",
      commonMistakes: challenge.common_mistakes || "",
    });
  };

  const handleDelete = (id: string) => {
    setChallenges(challenges.filter((c) => c.id !== id));
    toast.success("課題を削除しました");
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingChallenge(null);
    setFormData({
      title: "",
      description: "",
      difficulty: "easy",
      category: "",
      testCases: "",
      commonMistakes: "",
    });
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            管理者ダッシュボード
          </h1>
          <p className="text-lg text-gray-600">課題の管理とシステム設定</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 課題追加・編集フォーム */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {isEditing ? "課題を編集" : "新しい課題を追加"}
                </CardTitle>
                <CardDescription>
                  {isEditing
                    ? "課題の内容を編集してください"
                    : "新しい学習課題を作成してください"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      タイトル *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="課題のタイトル"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明 *
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="課題の詳細な説明"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        難易度
                      </label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(value: "easy" | "medium" | "hard") =>
                          setFormData({ ...formData, difficulty: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">初級</SelectItem>
                          <SelectItem value="medium">中級</SelectItem>
                          <SelectItem value="hard">上級</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        カテゴリ
                      </label>
                      <Input
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        placeholder="例: アルゴリズム"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      テストケース
                    </label>
                    <Textarea
                      value={formData.testCases}
                      onChange={(e) =>
                        setFormData({ ...formData, testCases: e.target.value })
                      }
                      placeholder="期待される入力と出力の例"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      よくあるミス
                    </label>
                    <Textarea
                      value={formData.commonMistakes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commonMistakes: e.target.value,
                        })
                      }
                      placeholder="学習者がよく犯すミスや注意点"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {isEditing ? "更新" : "追加"}
                    </Button>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        キャンセル
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 右側: 課題一覧 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>課題一覧</CardTitle>
                <CardDescription>登録されている課題の管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(challenge)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(challenge.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge
                        className={getDifficultyColor(challenge.difficulty)}
                      >
                        {challenge.difficulty}
                      </Badge>
                      {challenge.category && (
                        <Badge variant="outline">{challenge.category}</Badge>
                      )}
                    </div>

                    {challenge.test_cases && (
                      <div className="text-xs text-gray-500">
                        <strong>テストケース:</strong> {challenge.test_cases}
                      </div>
                    )}
                  </div>
                ))}

                {challenges.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    まだ課題が登録されていません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
