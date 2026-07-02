import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  const loginText = await page.locator("body").innerText();

  await page.fill('input[type="password"]', "admin");
  await page.click('button:has-text("Нэвтрэх")');
  await page.waitForURL("**/editor", { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  await page.fill('label:has-text("Жуулчны нэр") input', "Codex тест жуулчин");
  await page.fill('label:has-text("Гэрээний дугаарын төгсгөл") input', "TEST");
  await page.fill('label:has-text("Утас") input', "99999999");
  await page.click('button:has-text("Хадгалах")');
  await page.waitForFunction(() => document.body.innerText.includes("Гэрээ хадгалагдлаа."), null, { timeout: 15000 });

  const bodyText = await page.locator("body").innerText();
  const pages = await page.locator(".contract-page").count();
  const printPagesHaveSize = await page.locator(".contract-page").evaluateAll((nodes) =>
    nodes.every((node) => {
      const style = getComputedStyle(node);
      return style.width !== "0px" && style.height !== "0px";
    })
  );

  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const pdfText = pdf.toString("latin1");
  const pdfPageCount = (pdfText.match(/\/Type\s*\/Page\b/g) ?? []).length;

  let deleted = false;
  const activeDelete = page.locator(".history-item.active .delete");
  if ((await activeDelete.count()) > 0) {
    page.once("dialog", (dialog) => dialog.accept());
    await activeDelete.click();
    await page.waitForFunction(
      () => document.body.innerText.includes("Гэрээ устгагдлаа.") || document.body.innerText.includes("Шинэ гэрээний загвар"),
      null,
      { timeout: 15000 }
    );
    deleted = true;
  }

  const result = {
    loginPageLoaded: loginText.includes("Гэрээний систем"),
    currentUrl: page.url(),
    pages,
    printPagesHaveSize,
    pdfPageCount,
    historyHasSaved: bodyText.includes("Codex тест жуулчин") && bodyText.includes("Х-26-1-TEST"),
    deleted,
    consoleErrors: errors
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.loginPageLoaded || !result.historyHasSaved || !result.deleted || result.pages !== 3 || result.pdfPageCount !== 3 || errors.length) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
