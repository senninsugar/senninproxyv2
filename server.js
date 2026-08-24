import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicPath = join(__dirname, "public");

// epoxy-transport の dist パスを取得
const epoxyPath = join(__dirname, "node_modules", "@mercuryworkshop", "epoxy-transport", "dist");

const app = express();

// Security Headers (COOP / COEP) Middleware
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
});

// 静的ファイルのミドルウェア設定
app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

// 404 ハンドラー
app.use((req, res) => {
    res.status(404).sendFile(join(publicPath, "404.html"));
});

// Express アプリを統合した HTTP サーバーの作成
const server = createServer(app);

// WebSocket / Wisp ルーティング
server.on("upgrade", (req, socket, head) => {
    if (req.url && req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    } else {
        socket.end();
    }
});

// ポート番号の設定
let port = parseInt(process.env.PORT || "", 10);
if (Number.isNaN(port)) {
    port = 8080;
}

// サーバー起動ログ
server.on("listening", () => {
    const address = server.address();
    if (!address || typeof address === "string") return;

    console.log("Ultraviolet learning proxy is running.");
    console.log(`Port: ${address.port}`);
    console.log(`http://localhost:${address.port}`);
    console.log(`http://${hostname()}:${address.port}`);
});

// グレースフルシャットダウン
function shutdown() {
    console.log("Shutting down server...");
    server.close(() => {
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// 外部からのアクセスを受け取れるよう 0.0.0.0 にバインド
server.listen({
    port,
    host: "0.0.0.0"
});
