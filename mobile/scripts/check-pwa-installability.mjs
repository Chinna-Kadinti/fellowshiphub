const endpoint = process.argv[2] ?? "http://127.0.0.1:9224";
const pageUrl = process.argv[3] ?? "http://127.0.0.1:4173";

const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = targets.find((target) => target.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("No Chrome page target found.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let commandId = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function command(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await command("Page.enable");
await command("Runtime.enable");
await command("Page.navigate", { url: pageUrl });
await pause(3_000);

const [manifestResult, installabilityResult, runtimeResult] = await Promise.all([
  command("Page.getAppManifest"),
  command("Page.getInstallabilityErrors"),
  command("Runtime.evaluate", {
    expression: `(async () => {
      const registration = "serviceWorker" in navigator
        ? await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((resolve) => setTimeout(() => resolve(null), 5000))
          ])
        : null;
      return JSON.stringify({
        secureContext: window.isSecureContext,
        serviceWorkerScope: registration?.scope ?? null,
        standalone: matchMedia("(display-mode: standalone)").matches
      });
    })()`,
    awaitPromise: true,
    returnByValue: true
  })
]);

const manifest = JSON.parse(manifestResult.data);
const runtime = JSON.parse(runtimeResult.result.value);
const result = {
  url: pageUrl,
  manifest: {
    name: manifest.name,
    start_url: manifest.start_url,
    display: manifest.display,
    icons: manifest.icons?.map(({ src, sizes, type, purpose }) => ({
      src,
      sizes,
      type,
      purpose
    }))
  },
  installabilityErrors: installabilityResult.installabilityErrors,
  runtime
};

console.log(JSON.stringify(result, null, 2));
socket.close();

if (
  installabilityResult.installabilityErrors.length > 0 ||
  !manifest.icons?.some((icon) => icon.sizes === "192x192") ||
  !manifest.icons?.some((icon) => icon.sizes === "512x512") ||
  !runtime.serviceWorkerScope
) {
  process.exitCode = 1;
}
