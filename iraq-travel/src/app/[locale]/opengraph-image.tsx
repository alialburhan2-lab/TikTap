import { ImageResponse } from "next/og";

export const alt = "IRAQ TRAVEL — Discover the Land Between Two Rivers.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded Open Graph card (illustration, not a photograph). */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, background: "linear-gradient(180deg,#081a2f 0%,#163a63 60%,#b8892b 100%)", color: "#fbf8f2", fontFamily: "serif" }}>
        <div style={{ position: "absolute", left: 80, bottom: 170, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 120, height: 40, background: "#2a1d0c" }} />
          <div style={{ width: 220, height: 50, background: "#2a1d0c" }} />
          <div style={{ width: 340, height: 70, background: "#2a1d0c" }} />
        </div>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 10, color: "#e5c57e" }}>IRAQ TRAVEL</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, marginTop: 12 }}>Discover Iraq.</div>
        <div style={{ display: "flex", fontSize: 32, marginTop: 12, color: "#ece1cb" }}>Discover the Land Between Two Rivers.</div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 16, display: "flex", background: "linear-gradient(90deg,#86621a,#d9b25f,#86621a)" }} />
      </div>
    ),
    size,
  );
}
