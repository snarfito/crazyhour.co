import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "src/app/opengraph-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1030",
          backgroundImage:
            "radial-gradient(1100px 650px at 50% -80px, rgba(176, 97, 255, 0.45), transparent 60%), " +
            "radial-gradient(900px 600px at 100% 280px, rgba(63, 224, 255, 0.28), transparent 62%), " +
            "radial-gradient(800px 500px at -80px 560px, rgba(255, 46, 136, 0.24), transparent 60%)",
        }}
      >
        <img src={logoSrc} width={594} height={480} alt="Crazy Hour" />
      </div>
    ),
    size
  );
}
