const form = document.getElementById("proxy-form");
const input = document.getElementById("url");
const button = document.getElementById("go-button");
const error = document.getElementById("error");

function showError(message) {
    error.textContent = message;
    error.hidden = false;
}

function hideError() {
    error.textContent = "";
    error.hidden = true;
}

function normalizeUrl(value) {
    let url = value.trim();
    if (!url) throw new Error("URLを入力してください。");
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("HTTPまたはHTTPSのURLを指定してください。");
    }
    return parsed.href;
}

async function loadUltravioletConfig() {
    if (window.__uv$config) return window.__uv$config;

    const response = await fetch("/uv/uv.config.js", { cache: "no-store" });
    if (!response.ok) throw new Error("設定ファイルを読み込めませんでした。");

    const source = await response.text();
    const script = document.createElement("script");
    script.textContent = source;
    document.head.appendChild(script);

    if (!window.__uv$config) throw new Error("設定の初期化に失敗しました。");
    return window.__uv$config;
}

async function registerServiceWorker(config) {
    if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker非対応のブラウザです。");
    }

    const registration = await navigator.serviceWorker.register(config.sw, {
        scope: config.prefix
    });
    await navigator.serviceWorker.ready;
    return registration;
}

async function openInAboutBlank(targetUrl) {
    // about:blankの新規ウィンドウを開く
    const blankWindow = window.open("about:blank", "_blank");
    if (!blankWindow) {
        throw new Error("ポップアップがブロックされました。許可してください。");
    }

    const doc = blankWindow.document;
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>senninproxy</title>
            <style>
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
                iframe { width: 100%; height: 100%; border: none; }
            </style>
        </head>
        <body>
            <iframe src="${targetUrl}"></iframe>
        </body>
        </html>
    `);
    doc.close();
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    hideError();

    button.disabled = true;
    button.textContent = "読み込み中...";

    try {
        const url = normalizeUrl(input.value);
        const config = await loadUltravioletConfig();

        if (typeof config.encodeUrl !== "function") {
            throw new Error("URLエンコーダーが利用できません。");
        }

        await registerServiceWorker(config);

        const encoded = config.encodeUrl(url);
        const target = `${config.prefix}${encoded}`;

        await openInAboutBlank(target);
    } catch (err) {
        showError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
        button.disabled = false;
        button.textContent = "開く";
    }
});

input.addEventListener("input", hideError);
