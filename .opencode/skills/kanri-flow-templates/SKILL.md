---
name: kanri-flow-templates
description: HTMLページのテンプレート生成スキル。既存ページを元に新しいページを素早く作成します。
---

## テンプレート生成スキル

### 概要
既存のHTMLページの構造を参考に、新しい手続きページを自動生成します。

### 使用方法
1. 既存ページ（例：0719_03_approval.html）をテンプレートとして選択
2. 新しいページ名とタイトルを指定
3. 必要に応じてコンテンツをカスタマイズ

### テンプレート構造
```html
<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{PAGE_TITLE} - 管理者報告フロー統合パネル</title>
  <!-- 共通CSS -->
</head>
<body>
  <!-- ヘッダー -->
  <!-- コンテンツ -->
  <!-- フッター -->
</body>
</html>
```

### カスタマイズ項目
- **ページタイトル**: `{PAGE_TITLE}`を置換
- **コンテンツ**: 各手続きに応じたフォームや説明文を追加
- **アイコン**: 手続きに応じたアイコンを設定

### 使用時のポイント
- 既存ページのCSS変数をそのまま使用
- レスポンシブデザインを維持
- テーマ切替機能を含める
