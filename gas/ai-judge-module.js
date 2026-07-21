// ============================================================
// 手続き判定モジュール（ルールベース、AI不使用）
// クライアント側でキーワードマッチングを実行
// ============================================================

var ProcedureJudger = (function() {
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

  var isLoading = false;
  var lastResult = null;

  function init() {
    setupUI();
    console.log('[ProcedureJudger] 初期化完了');
  }

  function setupUI() {
    var btn = document.getElementById('aiJudgeBtn');
    if (btn) {
      btn.addEventListener('click', handleJudge);
    }
  }

  function handleJudge() {
    if (isLoading) return;
    var input = document.getElementById('mailInput');
    var text = input ? input.value.trim() : '';
    if (!text) {
      showResult('warn', 'メール本文を貼り付けてください。');
      return;
    }

    setLoading(true);
    showResult('loading', '判定中...');

    setTimeout(function() {
      var result = judgeByKeywords(text);
      lastResult = result;
      displayResult(result);
      setLoading(false);
    }, 200);
  }

  function judgeByKeywords(text) {
    var t = text.replace(/\s/g, '');
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
      details: extractDetails(text)
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

  function displayResult(result) {
    highlightProcedure(result.procedure);
    var resultArea = document.getElementById('aiResultArea');
    if (!resultArea) return;

    if (!result.procedure) {
      resultArea.innerHTML = '<div class="ai-result-card ai-warn">該当する手続きが見つかりませんでした。手動で選択してください。</div>';
      resultArea.style.display = 'block';
      return;
    }

    var confidencePercent = Math.round(result.confidence * 100);
    var details = result.details || {};
    var detailsHtml = '';
    if (details.研究課題名) detailsHtml += '<div class="ai-detail"><strong>研究課題名:</strong> ' + escapeHtml(details.研究課題名) + '</div>';
    if (details.報告区分) detailsHtml += '<div class="ai-detail"><strong>報告区分:</strong> ' + escapeHtml(details.報告区分) + '</div>';
    if (details.jRCT番号) detailsHtml += '<div class="ai-detail"><strong>jRCT番号:</strong> ' + escapeHtml(details.jRCT番号) + '</div>';
    if (details.起案番号) detailsHtml += '<div class="ai-detail"><strong>起案番号:</strong> ' + escapeHtml(details.起案番号) + '</div>';
    if (details.研究責任者) detailsHtml += '<div class="ai-detail"><strong>研究責任者:</strong> ' + escapeHtml(details.研究責任者) + '</div>';
    if (details.担当者) detailsHtml += '<div class="ai-detail"><strong>担当者:</strong> ' + escapeHtml(details.担当者) + '</div>';
    if (details.締切日) detailsHtml += '<div class="ai-detail"><strong>締切日:</strong> ' + escapeHtml(details.締切日) + '</div>';
    if (details.備考) detailsHtml += '<div class="ai-detail"><strong>備考:</strong> ' + escapeHtml(details.備考) + '</div>';

    resultArea.innerHTML =
      '<div class="ai-result-card">' +
      '<div class="ai-result-header">' +
      '<span class="ai-badge">' + escapeHtml(result.procedure) + '</span>' +
      '<span class="ai-confidence">信頼度: ' + confidencePercent + '%</span>' +
      '</div>' +
      '<div class="ai-result-reason">' + escapeHtml(result.reason) + '</div>' +
      (detailsHtml ? '<div class="ai-result-details">' + detailsHtml + '</div>' : '') +
      '<div class="ai-result-actions">' +
      '<button class="ai-action-btn" onclick="ProcedureJudger.navigateToProcedure(\'' + escapeHtml(result.procedure) + '\')">この手続きを開始する →</button>' +
      '</div></div>';
    resultArea.style.display = 'block';
  }

  function highlightProcedure(procedure) {
    var buttons = document.querySelectorAll('.proc-btn');
    var map = { '承認申請': 0, '申請管理者報告': 1, '公表管理者報告': 2, 'その他報告': 3 };
    var idx = map[procedure];
    buttons.forEach(function(btn, i) {
      if (i === idx) {
        btn.classList.add('highlighted');
        btn.classList.remove('dimmed');
      } else {
        btn.classList.remove('highlighted');
        btn.classList.add('dimmed');
      }
    });
  }

  function navigateToProcedure(procedure) {
    var urls = {
      '承認申請': 'https://morikawa001.github.io/kanri_flow/approval.html',
      '申請管理者報告': 'https://morikawa001.github.io/kanri_flow/apply_report.html',
      '公表管理者報告': 'https://morikawa001.github.io/kanri_flow/publish_report.html',
      'その他報告': 'https://morikawa001.github.io/kanri_flow/other_report.html'
    };
    var url = urls[procedure];
    if (url) window.location.href = url;
  }

  function showResult(type, message) {
    var resultArea = document.getElementById('aiResultArea');
    if (!resultArea) return;
    var cls = { loading: 'ai-loading', warn: 'ai-warn', error: 'ai-error' }[type] || 'ai-info';
    resultArea.innerHTML = '<div class="ai-result-card ' + cls + '">' + escapeHtml(message) + '</div>';
    resultArea.style.display = 'block';
  }

  function setLoading(loading) {
    isLoading = loading;
    var btn = document.getElementById('aiJudgeBtn');
    if (btn) {
      btn.disabled = loading;
      btn.textContent = loading ? '判定中...' : 'キーワードで判定する';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  return {
    init: init,
    handleJudge: handleJudge,
    navigateToProcedure: navigateToProcedure,
    getLastResult: function() { return lastResult; }
  };
})();
