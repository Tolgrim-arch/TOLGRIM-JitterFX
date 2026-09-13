<div align="center">
  <a href="README.md">🇬🇧 English</a> | <a href="README.es.md">🇪🇸 Español</a> | <a href="README.zh.md">🇨🇳 简体中文</a> | <a href="README.ja.md">🇯🇵 日本語</a> | <b>🇰🇷 한국어</b>
</div>

<div align="center">
  <img src="icon.svg" alt="JitterFX Logo" width="120" />
  <h1>JitterFX</h1>
  <p><strong>디지털 아티스트를 위한 WebGL 애니메이션 엔진 (지터 / 손그림 효과)</strong></p>
  <a href="https://tolgrim-arch.github.io/TOLGRIM-JitterFX/">
    <img src="https://img.shields.io/badge/브라우저에서_열기-bb86fc?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open App" />
  </a>
</div>

<br>

JitterFX는 클라이언트 측 이미지 처리 웹 애플리케이션(PWA)입니다. 일러스트레이터와 사진작가가 정적 이미지를 업로드하고 "지터" 또는 손그림 효과가 있는 애니메이션 루프를 생성할 수 있도록 하여 Twitter (X)와 같은 소셜 미디어에서 아트워크를 보호하는 데 이상적입니다.

## 🚀 즉시 액세스

**이 저장소를 다운로드, 복제 또는 컴파일할 필요가 없습니다.**  
도구를 사용하려면 PC 또는 휴대폰에서 다음 링크를 클릭하기만 하면 됩니다.

🌐 **[지금 JITTERFX 열기](https://tolgrim-arch.github.io/TOLGRIM-JitterFX/)**

*(선택 사항: 모바일에서 링크를 열면 브라우저가 홈 화면에 추가할 것을 제안합니다. 이렇게 하면 인터넷 연결 없이 기본 앱으로 작동합니다).*

---

## ✨ 주요 기능

이 도구는 공격적인 Twitter (X) 압축을 우회하고 제작자의 작업을 보호하도록 설계되었습니다.

- **다중 지터 알고리즘:** 글로벌 시프트, 청키 블록, 정적/퍼지 노이즈, 메시 리플, 부드러운 변형 (값 노이즈).
- **이중 내보내기 (GIF 및 WebM):** 
  - 전통적인 GIF를 생성합니다.
  - WebM으로 내보내어 완벽한 앤티앨리어싱 에지가 있는 **알파 투명도**를 유지합니다(Twitter에서 기본적으로 지원됨).
- **통합 무광 배경:** GIF를 사용하는 경우 소셜 네트워크가 강제 검은색 배경으로 일러스트레이션의 가장자리를 파괴하는 것을 방지하기 위해 특정 배경색(Twitter Dark, Dim, Light)을 주입할 수 있습니다.
- **도난 방지 워터마크:** 서명이나 @사용자 이름을 입력하면 JitterFX가 적응형 대비를 사용하여 애니메이션 모서리에 병합하여 이미지를 쉽게 훔칠 수 없게 만듭니다.
- **핑퐁 루프:** 애니메이션이 앞뒤로 흐르도록 하여 루프가 다시 시작될 때 갑작스러운 점프가 없도록 합니다.

## 🛠️ 기술 세부 정보

- **핵심:** HTML5, CSS3, 바닐라 JavaScript.
- **그래픽 엔진:** 프래그먼트 셰이더용 WebGL(브라우저의 GPU 가속).
- **내보내기:** Web Workers를 통한 버퍼 렌더링용 `gif.js` 및 WebM(VP9/H264)용 기본 `MediaRecorder`.
- **아키텍처:** 100% 오프라인 실행을 위한 Service Workers가 있는 프로그레시브 웹 애플리케이션(PWA).
