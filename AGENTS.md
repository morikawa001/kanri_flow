# プロジェクトコンテキスト（常に参照すること）

## Gitリモート構成（最重要）
2つのリモートがあり、**両方にpushする必要がある**：

```bash
git push origin master          # 開発用リポジトリ
git push kanri_flow master:main # GitHub Pages公開用
```

`kanri_flow` へのpushを忘れるとWebサイトが更新されない。
詳細は `.opencode/skills/kanri-flow/SKILL.md` 参照。

## トラブルシューティングの優先順位
修正が反映されない場合：
1. まず**リモート構成**を確認（origin vs kanri_flow）
2. 次に**ブラウザキャッシュ**（ハードリロード）
3. 最後に**コード自体**の確認
