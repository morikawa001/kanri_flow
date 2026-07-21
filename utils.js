/**
 * utils.js - 汎用ユーティリティ
 * 臨床研究支援チーム管理画面
 */

var App = App || {};

App.utils = (function() {
  'use strict';

  // HTMLエスケープ（XSS対策）
  function h(str) {
    return String(str || '').replace(/[&<>"']/g, function(m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  // DOM要素の値を取得（フォールバック付き）
  function getValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : (App.state.data[id] || '').toString().trim();
  }

  // DOMからstateにデータを同期
  function setStateFromDom() {
    document.querySelectorAll('[data-bind]').forEach(function(el) {
      App.state.data[el.dataset.bind] = el.type === 'checkbox' ? el.checked : el.value;
    });
    document.querySelectorAll('[data-preset-free]').forEach(function(el) {
      var sel = document.querySelector('[data-preset-select="' + el.dataset.presetFree + '"]');
      if (sel && sel.value !== '__free') return;
      App.state.data[el.dataset.presetFree] = el.value;
    });
  }

  // クリップボードにコピー
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function() {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  // Blobをダウンロード
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 3000);
  }

  // 正規表現エスケープ
  function escapeRegex(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // チェックボックスマーク
  function mark(flag) {
    return flag ? '\u25a0' : '\u2610';
  }

  // 公開API
  return {
    h: h,
    getValue: getValue,
    setStateFromDom: setStateFromDom,
    copyToClipboard: copyToClipboard,
    downloadBlob: downloadBlob,
    escapeRegex: escapeRegex,
    mark: mark
  };
})();
