<div align="center">
  <a href="README.md">🇬🇧 English</a> | <a href="README.es.md">🇪🇸 Español</a> | <a href="README.zh.md">🇨🇳 简体中文</a> | <b>🇯🇵 日本語</b> | <a href="README.ko.md">🇰🇷 한국어</a>
</div>

<div align="center">
  <img src="icon.svg" alt="JitterFX Logo" width="120" />
  <h1>JitterFX</h1>
  <p><strong>デジタルアーティストのための WebGL アニメーションエンジン (ジッター / 手描き風)</strong></p>
  <a href="https://tolgrim-arch.github.io/TOLGRIM-JitterFX/">
    <img src="https://img.shields.io/badge/ブラウザで開く-bb86fc?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open App" />
  </a>
</div>

<br>

JitterFX は、クライアントサイドの画像処理 Web アプリケーション (PWA) です。イラストレーターや写真家が静止画像をアップロードし、「ジッター」や手描き効果のあるアニメーションループを生成できるようにします。これは、Twitter (X) などのソーシャルメディアでアートワークを保護するのに最適です。

## 🚀 即時アクセス

**このリポジトリをダウンロード、クローン、コンパイルする必要はありません。**  
ツールを使用するには、PC または携帯電話から次のリンクをクリックするだけです：

🌐 **[JITTERFX を今すぐ開く](https://tolgrim-arch.github.io/TOLGRIM-JitterFX/)**

*(オプション: 携帯電話でリンクを開くと、ブラウザがホーム画面への追加を提案します。追加すると、インターネット接続なしでネイティブアプリとして機能します)。*

---

## ✨ 主な機能

このツールは、Twitter (X) の強力な圧縮を回避し、クリエイターの作品を保護するように設計されています：

- **複数のジッターアルゴリズム:** グローバルシフト、チャンキーブロック、静的/ファジーノイズ、メッシュリップル、スムーズな変形 (バリューノイズ)。
- **デュアルエクスポート (GIF & WebM):** 
  - 従来の GIF を生成します。
  - WebM でエクスポートし、完璧なアンチエイリアスエッジを持つ **アルファ透明度** を保持します（Twitter でネイティブサポート）。
- **統合されたマット背景:** GIF を使用する場合は、特定の背景色 (Twitter Dark、Dim、Light) を挿入して、ソーシャルネットワークが強制的な黒い背景でイラストのエッジを破壊するのを防ぐことができます。
- **盗難防止ウォーターマーク:** 署名または @ユーザー名を入力すると、JitterFX が適応性のあるコントラストでアニメーションの隅に融合し、画像を簡単に盗むことを不可能にします。
- **ピンポンループ:** アニメーションが前後に流れるようにし、ループが再開したときに突然のジャンプが発生しないようにします。

## 🛠️ 技術詳細

- **コア:** HTML5、CSS3、バニラ JavaScript。
- **グラフィックエンジン:** フラグメントシェーダー用の WebGL (ブラウザでの GPU アクセラレーション)。
- **エクスポート:** Web Workers を介したバッファレンダリング用の `gif.js` および WebM (VP9/H264) 用のネイティブ `MediaRecorder`。
- **アーキテクチャ:** 100% オフライン実行のための Service Workers を備えたプログレッシブ Web アプリケーション (PWA)。
