import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, background: "#0e4f4a", color: "#f6f1e7", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: 18, fontWeight: 700 }}>
        N
      </div>
    ),
    size,
  );
}
