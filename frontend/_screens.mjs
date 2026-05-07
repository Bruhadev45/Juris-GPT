import { chromium } from "playwright";

const SCREENS = [
  ["landing", "/"],
  ["chat_unauth", "/chat"],
  ["dashboard", "/dashboard"],
  ["dashboard_chat", "/dashboard/chat"],
  ["dashboard_contracts", "/dashboard/contracts"],
  ["dashboard_compliance", "/dashboard/compliance"],
];

const out = "/tmp/jurisgpt_screens";
const fs = await import("fs");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

const summaries = [];
for (const [name, path] of SCREENS) {
  const url = `http://localhost:3001${path}`;
  consoleErrors.length = 0;
  try {
    const resp = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 25000,
    });
    await page.waitForTimeout(800);
    const png = `${out}/${name}.png`;
    await page.screenshot({ path: png, fullPage: true });
    const title = await page.title();
    const headings = await page.$$eval(
      "h1, h2",
      (els) => els.slice(0, 6).map((e) => e.textContent.trim().slice(0, 80))
    );
    summaries.push({
      name,
      url,
      status: resp.status(),
      title,
      headings,
      consoleErrors: [...consoleErrors],
      screenshot: png,
    });
  } catch (err) {
    summaries.push({ name, url, error: err.message });
  }
}
fs.writeFileSync(
  `${out}/summary.json`,
  JSON.stringify(summaries, null, 2)
);
console.log(JSON.stringify(summaries, null, 2));
await browser.close();
