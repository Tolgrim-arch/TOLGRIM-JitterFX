<div align="center">
  [🇬🇧 English](README.md) | [🇪🇸 Español](README.es.md) | **🇨🇳 简体中文** | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md)
</div>

<div align="center">
  <img src="icon.svg" alt="JitterFX Logo" width="120" />
  <h1>JitterFX</h1>
  <p><strong>面向数字艺术家的 WebGL 动画引擎 (Jitter / 手绘效果)</strong></p>
  <a href="https://tolgrim-arch.github.io/TOLGRIM-JitterFX/">
    <img src="https://img.shields.io/badge/在浏览器中打开-bb86fc?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open App" />
  </a>
</div>

<br>

JitterFX 是一款客户端图像处理 Web 应用程序 (PWA)。它允许插画家和摄影师上传静态图像并生成具有“抖动”或手绘效果的动画循环，非常适合在 Twitter (X) 等社交媒体上保护艺术作品。

## 🚀 立即访问

**无需下载、克隆或编译此存储库。**  
要使用该工具，只需通过您的 PC 或手机点击以下链接：

🌐 **[立即打开 JITTERFX](https://tolgrim-arch.github.io/TOLGRIM-JitterFX/)**

*(可选：如果您在手机上打开链接，浏览器会建议将其添加到主屏幕。添加后，它将作为原生应用程序离线运行)。*

---

## ✨ 主要功能

此工具旨在绕过 Twitter (X) 的严重压缩并保护创作者的作品：

- **多种抖动算法：** 全局位移、粗糙块状、静态/模糊噪声、网格波纹和平滑变形 (Value Noise)。
- **双重导出 (GIF 和 WebM)：** 
  - 生成传统 GIF。
  - 以 WebM 格式导出，以保留**Alpha 透明度**和完美的抗锯齿边缘（Twitter 原生支持）。
- **集成的哑光背景：** 如果使用 GIF，您可以注入特定的背景颜色 (Twitter Dark、Dim、Light)，以防止社交网络强制使用黑色背景破坏您的插图边缘。
- **防盗水印：** 输入您的签名或 @用户名，JitterFX 会将其与自适应对比度融合到动画角落，从而使盗图变得不可能。
- **乒乓循环：** 确保动画来回流动，以至于在循环重新开始时不会出现突然的跳跃。

## 🛠️ 技术细节

- **核心：** HTML5、CSS3、原生 JavaScript。
- **图形引擎：** 用于片段着色器的 WebGL（浏览器中的 GPU 加速）。
- **导出：** `gif.js` 用于通过 Web Workers 渲染缓冲区，本机 `MediaRecorder` 用于 WebM (VP9/H264)。
- **架构：** 渐进式 Web 应用程序 (PWA)，带有用于 100% 离线执行的 Service Workers。
