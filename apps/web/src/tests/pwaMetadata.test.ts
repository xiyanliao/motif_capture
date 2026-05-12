import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import headersText from "../../public/_headers?raw";
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
    expect(manifest.icons?.some((icon) => icon.src === "/icons/icon-192.png")).toBe(true);
    expect(manifest.icons?.some((icon) => icon.src === "/icons/icon-512.png")).toBe(true);
  });

  it("links the manifest from the app shell", () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('name="apple-mobile-web-app-capable"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/icon-180.png"');
  });

  it("declares Cloudflare Pages headers for PWA assets", () => {
    expect(headersText).toContain("/manifest.webmanifest");
    expect(headersText).toContain("Content-Type: application/manifest+json");
    expect(headersText).toContain("/sw.js");
    expect(headersText).toContain("Cache-Control: no-cache");
  });
});
