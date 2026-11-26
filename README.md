# 看護スキル評価（試用版）

- 回答者用：`index.html`（公開URLのトップ）
- 管理者用：`admin/index.html`（公開URL の末尾に `/admin/`）

## GitHub Pages での公開手順
1. GitHub で新しいリポジトリを作成（例：`nurse-skill`）
2. 「Add file」→「Upload files」で、このフォルダの中身をすべてアップロード（`admin` と `icons` フォルダも含む）
3. 「Settings」→「Pages」→ Source を「Deploy from a branch」、Branch を `main` / `(root)` にして Save
4. 数分後に `https://<ユーザー名>.github.io/nurse-skill/` で開けます

## iPad のホーム画面に追加
Safari で上のURLを開き、共有ボタン →「ホーム画面に追加」。管理者用は `/admin/` を開いて同様に追加します。

## 注意
- 回答データはそれぞれの端末（ブラウザ）内にのみ保存され、GitHub には送信されません。
- 無料プランの GitHub Pages は公開リポジトリのため、URL を知っている人は誰でもページを開けます（データは見えません）。
- ファイルを更新したときは `sw.js` の `VERSION` を変えると、端末側に新しい版が反映されやすくなります。
