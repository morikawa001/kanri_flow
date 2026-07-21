// ============================================================
// AI手続き判定 - HTML統合モジュール
// GAS Webアプリ経由でGemini APIを呼び出す
// ============================================================

const AIJudge = (function() {
  // GAS WebアプリのURL（デプロイ後に設定）
  let GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby5QdVOBRQ_TOZ_YZ4eQLZtqPEj55wF2w4J8_dWAiVh0yIQdi4RX-Au3kG4l-areTw9/exec';

  // 状態管理
  let isLoading = false;
  let lastResult = null;

  // ============================================================
  // 初期化
  // ============================================================

  function init(gasUrl) {
    GAS_WEB_APP_URL = gasUrl || '';
    setupUI();
    console.log('[AIJudge] 初期化完了');
  }

  // ============================================================
  // UI設定
  // ============================================================

  function setupUI() {
    // AI判定ボタンのイベントリスナー
    const aiJudgeBtn = document.getElementById('aiJudgeBtn');
    if (aiJudgeBtn) {
      aiJudgeBtn.addEventListener('click', handleAiJudge);
    }

    // 結果表示エリアの初期化
    const resultArea = document.getElementById('aiResultArea');
    if (resultArea) {
      resultArea.style.display = 'none';
    }
  }

  // ============================================================
  // AI判定ハンドラ
  // ============================================================

  async function handleAiJudge() {
    if (isLoading) return;

    const mailInput = document.getElementById('mailInput');
    const text = mailInput ? mailInput.value.trim() : '';

    if (!text) {
      showResult('warn', 'メール本文を貼り付けてください。');
      return;
    }

    if (!GAS_WEB_APP_URL) {
      showResult('error', 'GAS WebアプリURLが設定されていません。');
      return;
    }

    setLoading(true);
    showResult('loading', 'AI判定中...');

    try {
      const result = await callGAS(text);
      displayResult(result);
    } catch (err) {
      console.error('[AIJudge] Error:', err);
      showResult('error', '判定エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GAS呼び出し
  // ============================================================

  async function callGAS(emailText) {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({
        action: 'judgeProcedure',
        emailText: emailText
      })
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    return await response.json();
  }

  // ============================================================
  // 結果表示
  // ============================================================

  function displayResult(result) {
    if (result.error) {
      showResult('error', result.error);
      return;
    }

    lastResult = result;

    // 手続きボタンのハイライト
    highlightProcedure(result.procedure);

    // 詳細情報の表示
    const resultArea = document.getElementById('aiResultArea');
    if (!resultArea) return;

    const confidencePercent = Math.round(result.confidence * 100);
    const details = result.details || {};

    let detailsHtml = '';
    if (details.研究課題名) detailsHtml += '<div class="ai-detail"><strong>研究課題名:</strong> ' + escapeHtml(details.研究課題名) + '</div>';
    if (details.報告区分) detailsHtml += '<div class="ai-detail"><strong>報告区分:</strong> ' + escapeHtml(details.報告区分) + '</div>';
    if (details.jRCT番号) detailsHtml += '<div class="ai-detail"><strong>jRCT番号:</strong> ' + escapeHtml(details.jRCT番号) + '</div>';
    if (details.起案番号) detailsHtml += '<div class="ai-detail"><strong>起案番号:</strong> ' + escapeHtml(details.起案番号) + '</div>';
    if (details.研究責任者) detailsHtml += '<div class="ai-detail"><strong>研究責任者:</strong> ' + escapeHtml(details.研究責任者) + '</div>';
    if (details.担当者) detailsHtml += '<div class="ai-detail"><strong>担当者:</strong> ' + escapeHtml(details.担当者) + '</div>';
    if (details.締切日) detailsHtml += '<div class="ai-detail"><strong>締切日:</strong> ' + escapeHtml(details.締切日) + '</div>';
    if (details.備考) detailsHtml += '<div class="ai-detail"><strong>備考:</strong> ' + escapeHtml(details.備考) + '</div>';

    resultArea.innerHTML = `
      <div class="ai-result-card">
        <div class="ai-result-header">
          <span class="ai-badge">${escapeHtml(result.procedure)}</span>
          <span class="ai-confidence">信頼度: ${confidencePercent}%</span>
        </div>
        <div class="ai-result-reason">${escapeHtml(result.reason)}</div>
        ${detailsHtml ? '<div class="ai-result-details">' + detailsHtml + '</div>' : ''}
        <div class="ai-result-actions">
          <button class="ai-action-btn" onclick="AIJudge.navigateToProcedure('${escapeHtml(result.procedure)}')">
            この手続きを開始する →
          </button>
        </div>
      </div>
    `;
    resultArea.style.display = 'block';
  }

  // ============================================================
  // 手続きボタンハイライト
  // ============================================================

  function highlightProcedure(procedure) {
    const buttons = document.querySelectorAll('.proc-btn');
    const procedureMap = {
      '承認申請': 0,
      '申請管理者報告': 1,
      '公表管理者報告': 2,
      'その他報告': 3
    };

    const targetIndex = procedureMap[procedure];

    buttons.forEach(function(btn, index) {
      if (index === targetIndex) {
        btn.classList.add('highlighted');
        btn.classList.remove('dimmed');
      } else {
        btn.classList.remove('highlighted');
        btn.classList.add('dimmed');
      }
    });
  }

  // ============================================================
  // 手続きページへ遷移
  // ============================================================

  function navigateToProcedure(procedure) {
    const urls = {
      '承認申請': 'https://morikawa001.github.io/kanri_flow/approval.html',
      '申請管理者報告': 'https://morikawa001.github.io/kanri_flow/apply_report.html',
      '公表管理者報告': 'https://morikawa001.github.io/kanri_flow/publish_report.html',
      'その他報告': 'https://morikawa001.github.io/kanri_flow/other_report.html'
    };

    const url = urls[procedure];
    if (url) {
      window.location.href = url;
    }
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  function showResult(type, message) {
    const resultArea = document.getElementById('aiResultArea');
    if (!resultArea) return;

    const cssClass = {
      'loading': 'ai-loading',
      'success': 'ai-success',
      'warn': 'ai-warn',
      'error': 'ai-error'
    }[type] || 'ai-info';

    resultArea.innerHTML = '<div class="ai-result-card ' + cssClass + '">' + escapeHtml(message) + '</div>';
    resultArea.style.display = 'block';
  }

  function setLoading(loading) {
    isLoading = loading;
    const btn = document.getElementById('aiJudgeBtn');
    if (btn) {
      btn.disabled = loading;
      btn.textContent = loading ? '判定中...' : 'AIで判定する';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ============================================================
  // 公開API
  // ============================================================

  return {
    init: init,
    handleAiJudge: handleAiJudge,
    navigateToProcedure: navigateToProcedure,
    getLastResult: function() { return lastResult; }
  };
})();

// ============================================================
// CSS（HTMLページに追加するスタイル）
// ============================================================

const AI_JUDGE_CSS = `
/* AI判定結果エリア */
.ai-result-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 1.2rem;
  margin-top: 0.8rem;
  animation: slideUp 0.3s ease;
}
.ai-result-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}
.ai-badge {
  background: var(--primary);
  color: var(--inv);
  padding: 0.3rem 0.8rem;
  border-radius: var(--pill);
  font-size: 0.82rem;
  font-weight: 700;
}
.ai-confidence {
  font-size: 0.78rem;
  color: var(--muted);
}
.ai-result-reason {
  font-size: 0.85rem;
  color: var(--text);
  line-height: 1.5;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid var(--border);
}
.ai-result-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.ai-detail {
  font-size: 0.82rem;
  padding: 0.4rem 0.6rem;
  background: var(--surface-2);
  border-radius: var(--r-sm);
}
.ai-detail strong {
  color: var(--primary);
  margin-right: 0.3rem;
}
.ai-result-actions {
  display: flex;
  justify-content: flex-end;
}
.ai-action-btn {
  background: var(--primary);
  color: var(--inv);
  padding: 0.6rem 1.2rem;
  border-radius: var(--pill);
  font-size: 0.82rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ai-action-btn:hover {
  background: var(--primary-2);
  transform: translateY(-1px);
}
.ai-loading {
  color: var(--primary);
  text-align: center;
  padding: 1rem;
}
.ai-error {
  color: var(--error);
  background: var(--error-soft);
  border: 1px solid var(--error);
}
.ai-warn {
  color: var(--warn);
  background: var(--warn-soft);
  border: 1px solid var(--warn);
}
`;
