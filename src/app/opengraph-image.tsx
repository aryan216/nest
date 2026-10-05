import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f6f1e7", color: "#14211f", padding: "72px" }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#0e4f4a" }}>Verified property in {brand.city}</div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 650, lineHeight: 1 }}>{brand.name}</div>
        <div style={{ display: "flex", fontSize: 32 }}>Inspected in person. No brokerage for buyers.</div>
      </div>
    ),
    size,
  );
}
