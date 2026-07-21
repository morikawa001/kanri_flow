// ============================================================
// 管理者報告フロー統合パネル - 手続き判定GAS
// ルールベースのキーワードマッチング（AI不使用）
// ============================================================

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: '手続き判定API v2.0 (rule-based)' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === 'judgeProcedure') {
      var result = judgeByKeywords(body.emailText);
      return jsonResponse(result);
    }
    return jsonResponse({ error: '不明なアクション: ' + action }, 400);
  } catch (err) {
    return jsonResponse({ error: 'リクエスト処理エラー: ' + err.message }, 500);
  }
}

var MATCH_RULES = [
  {
    procedure: '承認申請',
    keywords: ['承認申請', '承認', 'IRB', '倫理審査', '審査委員会', '実施承認', '臨床研究審査'],
    reason: '承認申請に関するキーワードが含まれています'
  },
  {
    procedure: '申請管理者報告',
    keywords: ['申請管理者報告', 'CRB', '申請管理者', '管理者報告 申請', '申請管理', '登録', 'jRCT登録', 'CRB登録'],
    reason: '申請管理者報告に関するキーワードが含まれています'
  },
  {
    procedure: '公表管理者報告',
    keywords: ['公表管理者報告', '管理者報告 公表', '公表', 'jRCT', 'JRCT', '公開', '初回公表', '研究登録番号'],
    reason: '公表管理者報告に関するキーワードが含まれています'
  },
  {
    procedure: 'その他報告',
    keywords: ['その他報告', '不適合', '疾病', '定期報告', '医薬品', '医療機器', '不具合', '副作用', '重篤'],
    reason: 'その他報告に関するキーワードが含まれています'
  }
];

function judgeByKeywords(emailText) {
  if (!emailText || emailText.trim().length === 0) {
    return { error: 'メール本文が空です' };
  }

  var t = emailText.replace(/\s/g, '');
  var matchedRules = [];
  var matchCounts = [];

  for (var r = 0; r < MATCH_RULES.length; r++) {
    var rule = MATCH_RULES[r];
    var count = 0;
    for (var k = 0; k < rule.keywords.length; k++) {
      if (t.indexOf(rule.keywords[k]) !== -1) count++;
    }
    if (count > 0) {
      matchedRules.push(rule);
      matchCounts.push(count);
    }
  }

  if (matchedRules.length === 0) {
    return {
      procedure: null,
      confidence: 0,
      reason: '該当する手続きが見つかりませんでした',
      details: {}
    };
  }

  var bestIdx = 0;
  for (var i = 1; i < matchedRules.length; i++) {
    if (matchCounts[i] > matchCounts[bestIdx]) bestIdx = i;
  }

  var best = matchedRules[bestIdx];
  var confidence = Math.min(0.99, matchCounts[bestIdx] / best.keywords.length);

  return {
    procedure: best.procedure,
    confidence: confidence,
    reason: best.reason,
    details: extractDetails(emailText)
  };
}

function extractDetails(text) {
  var d = {};
  var m;
  m = text.match(/研究課題[名:：]\s*([^\n\r]+)/);
  if (m) d.研究課題名 = m[1].trim();
  m = text.match(/報告区分[：:]\s*([^\n\r]+)/);
  if (m) d.報告区分 = m[1].trim();
  m = text.match(/[jJ][Rr][Cc][Tt]\s*[:：]?\s*([^\s\n\r]+)/);
  if (m) d.jRCT番号 = m[1].trim();
  m = text.match(/起案番号[：:]\s*([^\n\r]+)/);
  if (m) d.起案番号 = m[1].trim();
  m = text.match(/(研究責任者|研究代表者)[：:]\s*([^\n\r]+)/);
  if (m) d.研究責任者 = m[2].trim();
  m = text.match(/担当[者：:]\s*([^\n\r]+)/);
  if (m) d.担当者 = m[1].trim();
  m = text.match(/(締切|期限)[日：:]\s*([^\n\r]+)/);
  if (m) d.締切日 = m[2].trim();
  return d;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(
    JSON.stringify(data)
  ).setMimeType(ContentService.MimeType.JSON);
}

function testJudgeProcedure() {
  var testEmail = '公表管理者報告 JRCT登録完了 ABC-123試験 jRCT2024012345 初回公表';
  var result = judgeByKeywords(testEmail);
  console.log(JSON.stringify(result, null, 2));
  return result;
}
