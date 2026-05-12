import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import manifestText from "../../public/manifest.webmanifest?raw";

describe("PWA metadata", () => {
  it("declares installable manifest metadata", () => {
    const manifest = JSON.parse(manifestText) as {
      display?: string;
      icons?: Array<{ src: string; purpose?: string }>;
      start_url?: string;
      theme_color?: string;
    };

    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#111313");
    expect(manifest.icons?.some((icon) => icon.purpose === "maskable")).toBe(true);
  });

  it("links the manifest from the app shell", () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('name="apple-mobile-web-app-capable"');
  });
});
