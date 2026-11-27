/**
 * わたしのスキルマップ 回答受付スクリプト（Google Apps Script）
 * 1. 下の ADMIN_KEY を、管理者だけが知るパスワードに書き換えてください。
 * 2. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *    次のユーザーとして実行：自分／アクセスできるユーザー：全員
 */
const ADMIN_KEY = 'ここを管理者用パスワードに変更';
const SHEET_NAME = '回答';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d && d.action === 'setPeriod') {
      if (!d.key || d.key !== ADMIN_KEY || ADMIN_KEY.indexOf('ここを') === 0) return out_({ ok: false, error: 'key' });
      const ps = periodSheet_();
      ps.getRange('B1').setValue(String(d.start || '').slice(0, 10));
      ps.getRange('B2').setValue(String(d.end || '').slice(0, 10));
      return out_({ ok: true, start: String(d.start || ''), end: String(d.end || '') });
    }
    const p = period_(), today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    if ((p.start && today < p.start) || (p.end && today > p.end)) return out_({ ok: false, error: 'closed' });
    if (!d || !d.row || !d.row.id || !d.row['氏名'] || !d.row['職員番号']) return out_({ ok: false, error: 'bad' });
    const row = { '受信日時': new Date() };
    Object.keys(d.row).slice(0, 200).forEach(function (k) { row[String(k).slice(0, 80)] = clean_(d.row[k]); });
    ['id', '職員番号'].forEach(function (k) { if (row[k] !== undefined && /^[0-9]+$/.test(String(row[k]))) row[k] = "'" + row[k]; }); // 先頭の0が消えないよう文字列として保存
    const sh = sheet_();
    let header = sh.getLastRow() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
    const add = Object.keys(row).filter(function (k) { return header.indexOf(k) < 0; });
    if (add.length) {
      header = header.concat(add);
      sh.getRange(1, 1, 1, header.length).setValues([header]);
      sh.setFrozenRows(1);
    }
    const vals = header.map(function (h) { return h in row ? row[h] : ''; });
    const idCol = header.indexOf('id') + 1;
    let target = 0;
    if (sh.getLastRow() > 1) {
      const ids = sh.getRange(2, idCol, sh.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).replace(/^'/, '') === String(row.id).replace(/^'/, '')) { target = i + 2; break; }
      }
    }
    if (target) sh.getRange(target, 1, 1, vals.length).setValues([vals]);
    else sh.getRange(sh.getLastRow() + 1, 1, 1, vals.length).setValues([vals]);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (e.parameter.action === 'period') { const p = period_(); return out_({ ok: true, start: p.start, end: p.end }); }
  if (!e.parameter.key || e.parameter.key !== ADMIN_KEY || ADMIN_KEY.indexOf('ここを') === 0) {
    return out_({ ok: false, error: 'key' });
  }
  const sh = sheet_();
  if (sh.getLastRow() < 2) return out_({ ok: true, rows: [] });
  const v = sh.getDataRange().getValues();
  const h = v[0];
  const rows = v.slice(1).map(function (r) {
    const o = {};
    h.forEach(function (k, i) { o[k] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
  return out_({ ok: true, rows: rows });
}

function periodSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('回答期間');
  if (!sh) { sh = ss.insertSheet('回答期間'); sh.getRange('A1:A3').setValues([['回答開始日'], ['回答終了日'], ['※日付は 2026-12-01 の形で入力。空欄なら期間の制限なし']]); }
  return sh;
}
function period_() {
  const v = periodSheet_().getRange('B1:B2').getValues();
  const f = function (x) { if (x instanceof Date) return Utilities.formatDate(x, 'Asia/Tokyo', 'yyyy-MM-dd'); return String(x || '').trim().replace(/\//g, '-'); };
  return { start: f(v[0][0]), end: f(v[1][0]) };
}
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}
function clean_(v) {
  if (typeof v === 'number') return v;
  let s = String(v == null ? '' : v).slice(0, 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // 数式として実行されないようにする
  return s;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
