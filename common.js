/**
 * common.js - 共通JavaScriptユーティリティ
 * 臨床研究支援チーム管理画面共通機能
 */

// テーマ管理モジュール
var ThemeManager = (function() {
  'use strict';

  var STORAGE_KEY = 'kanri-flow-theme';

  // 初期化: 保存されたテーマを復元
  function init() {
    var saved = localStorage.getItem(STORAGE_KEY);
    var root = document.documentElement;
    if (saved) {
      root.setAttribute('data-theme', saved);
    }
    updateButton(saved || root.getAttribute('data-theme'));
  }

  // テーマ切替
  function toggle() {
    var root = document.documentElement;
    var current = root.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
    updateButton(next);
  }

  // ボタンアイコン更新
  function updateButton(theme) {
    var btn = document.getElementById('themeBtn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    }
  }

  // 公開API
  return {
    init: init,
    toggle: toggle
  };
})();

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', function() {
  ThemeManager.init();

  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      ThemeManager.toggle();
    });
  }
});
