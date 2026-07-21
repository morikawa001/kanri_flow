// ============================================================
// 管理者報告フロー統合パネル - AI手続き判定GAS
// Google AI Studio (Gemini API) を使用した手続き判定
// ============================================================

// Google AI StudioのAPIキー（スクリプトプロパティに設定）
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

// ============================================================
// Webアプリ エントリーポイント
// ============================================================

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'health') {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ message: '管理者報告フロー AI判定API v1.0' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'judgeProcedure') {
      const result = judgeProcedure(body.emailText);
      return jsonResponse(result);
    }

    return jsonResponse({ error: '不明なアクション: ' + action }, 400);

  } catch (err) {
    return jsonResponse({ error: 'リクエスト処理エラー: ' + err.message }, 500);
  }
}

// ============================================================
// 手続き判定メイン関数
// ============================================================

function judgeProcedure(emailText) {
  if (!emailText || emailText.trim().length === 0) {
    return { error: 'メール本文が空です' };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return { error: 'Gemini APIキーが設定されていません。スクリプトプロパティにGEMINI_API_KEYを設定してください。' };
  }

  const prompt = buildPrompt(emailText);
  const geminiResponse = callGeminiAPI(prompt, apiKey);

  if (geminiResponse.error) {
    return { error: geminiResponse.error };
  }

  const parsed = parseAIResponse(geminiResponse);
  return parsed;
}

// ============================================================
// プロンプト生成
// ============================================================

function buildPrompt(emailText) {
  return `あなたは臨床研究支援チームのアシスタントです。以下のメール本文を分析し、該当する手続き種別と詳細情報を判定してください。

## 手続き種類
1. **承認申請** - 実施承認申請書の起案・承認手続き（キーワード: 承認, 起案, 実施承認, IRB, 倫理審査）
2. **申請管理者報告** - 申請に関する管理者報告（キーワード: CRB, 申請, 申請管理者, 登録）
3. **公表管理者報告** - 公表に関する管理者報告（キーワード: 管理者報告, 公表, JRCT, jRCT, 研究登録番号）
4. **その他報告** - 不適合報告・疾病等報告・定期報告（キーワード: 不適合, 疾病, 定期報告, 医薬品, 医療機器）

## 出力形式
以下のJSON形式で出力してください（マークダウンのコードブロックで囲まないでください）:
{
  "procedure": "承認申請|申請管理者報告|公表管理者報告|その他報告",
  "confidence": 0.0〜1.0の数値,
  "reason": "判定理由の簡潔な説明",
  "details": {
    "研究課題名": "メール本文から読み取れる研究課題名（なければ空文字）",
    "報告区分": "初回公表|変更|軽微変更|届出外|定期報告|不適合報告|疾病等報告|承認申請|その他（判別できなければ空文字）",
    "起案番号": "起案番号（なければ空文字）",
    "jRCT番号": "jRCT番号（なければ空文字）",
    "研究責任者": "研究責任者名（なければ空文字）",
    "担当者": "担当者名（なければ空文字）",
    "締切日": "締切日・期限（なければ空文字）",
    "備考": "その他の補足情報（なければ空文字）"
  }
}

## メール本文:
${emailText}`;
}

// ============================================================
// Gemini API呼び出し
// ============================================================

function callGeminiAPI(prompt, apiKey) {
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 40
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const url = GEMINI_URL + '?key=' + apiKey;
  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (statusCode !== 200) {
    console.error('Gemini API Error:', statusCode, responseBody);
    return { error: 'Gemini API呼び出し失敗 (HTTP ' + statusCode + ')' };
  }

  try {
    const json = JSON.parse(responseBody);
    return json;
  } catch (e) {
    return { error: 'レスポンス解析エラー: ' + e.message };
  }
}

// ============================================================
// AIレスポンス解析
// ============================================================

function parseAIResponse(response) {
  try {
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return { error: 'AIから応答がありませんでした' };
    }

    const text = candidates[0].content.parts[0].text;

    // JSON部分を抽出（マークダウンコードブロック対応）
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // 前後の空白を除去
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    // バリデーション
    const validProcedures = ['承認申請', '申請管理者報告', '公表管理者報告', 'その他報告'];
    if (!validProcedures.includes(parsed.procedure)) {
      return { error: '無効な手続き種別: ' + parsed.procedure };
    }

    // confidence の正規化
    parsed.confidence = Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0));

    return {
      success: true,
      procedure: parsed.procedure,
      confidence: parsed.confidence,
      reason: parsed.reason || '',
      details: parsed.details || {}
    };

  } catch (e) {
    console.error('Parse error:', e.message, response);
    return { error: 'AI応答の解析に失敗しました: ' + e.message };
  }
}

// ============================================================
// ユーティリティ
// ============================================================

function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(
    JSON.stringify(data)
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// テスト用関数（GASエディタで直接実行）
// ============================================================

function testJudgeProcedure() {
  const testEmail = `
件名: 【公表管理者報告】JRCT登録完了のお知らせ

田中様

以下の研究のjRCT登録が完了しましたのでご報告いたします。
研究課題名: ABC-123試験
jRCT番号: jRCT2024012345
報告区分: 初回公表
締切日: 2026年8月31日

ご確認ください。
`;

  const result = judgeProcedure(testEmail);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// ============================================================
// スクリプトプロパティ設定ガイド
// ============================================================

/*
 Google AI StudioのAPIキーをスクリプトプロパティに設定する手順:

 1. https://aistudio.google.com/apikey でAPIキーを取得
 2. GASエディタで [プロジェクトの設定] > [スクリプトプロパティ] を開く
 3. 以下のプロパティを追加:
    - キー: GEMINI_API_KEY
    - 値: 取得したAPIキー
 4. [保存] をクリック

※ APIキーは機密情報です。GitHub等にコミットしないでください。
*/
