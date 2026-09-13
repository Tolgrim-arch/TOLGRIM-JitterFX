<div align="center">
  **🇬🇧 English** | [🇪🇸 Español](README.es.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md)
</div>

<div align="center">
  <img src="icon.svg" alt="JitterFX Logo" width="120" />
  <h1>JitterFX</h1>
  <p><strong>WebGL Animation Engine (Jitter / Hand-drawn) for Digital Artists</strong></p>
  <a href="https://tolgrim-arch.github.io/TOLGRIM-JitterFX/">
    <img src="https://img.shields.io/badge/Open_Web_App-bb86fc?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open App" />
  </a>
</div>

<br>

JitterFX is a client-side web application (PWA) for image processing. It allows illustrators and photographers to upload static images and generate animated loops with a "jitter" or hand-drawn effect, ideal for protecting artworks on social media like Twitter (X).

## 🚀 Instant Access

**No need to download, clone, or compile this repository.**  
To use the tool, simply click the following link from your PC or mobile phone:

🌐 **[OPEN JITTERFX NOW](https://tolgrim-arch.github.io/TOLGRIM-JitterFX/)**

*(Optional: If you open the link on your mobile, the browser will suggest adding it to the home screen. If you do, it will work as a native app without an internet connection).*

---

## ✨ Main Features

This tool was designed to bypass aggressive Twitter (X) compressions and protect creators' work:

- **Multiple Jitter Algorithms:** Global Shift, Chunky Blocks, Static/Fuzzy Noise, Mesh Ripple, and Smooth Deformation (Value Noise).
- **Dual Export (GIF & WebM):** 
  - Generates traditional GIFs.
  - Exports in WebM to preserve **Alpha Transparency** with perfect anti-aliased edges (natively supported by Twitter).
- **Integrated Matte Background:** If you use GIF, you can inject specific background colors (Twitter Dark, Dim, Light) to prevent the social network from destroying your illustration's edges with a forced black background.
- **Anti-Theft Watermark:** Enter your signature or @username, and JitterFX will fuse it into the corner of the animation with adaptive contrast, making it impossible to easily steal the image.
- **Ping-Pong Loop:** Ensures the animation flows back and forth so there are no sudden jumps when the loop restarts.

## 🛠️ Technical Details

- **Core:** HTML5, CSS3, Vanilla JavaScript.
- **Graphics Engine:** WebGL for fragment shaders (GPU acceleration in the browser).
- **Export:** `gif.js` for buffer rendering via Web Workers and native `MediaRecorder` for WebM (VP9/H264).
- **Architecture:** Progressive Web App (PWA) with Service Workers for 100% Offline execution.
