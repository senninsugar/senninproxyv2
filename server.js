import express from "express";
import { createServer } from "node:http";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { join } from "node:path";
import { hostname } from "node:os";
import wisp from "wisp-server-node";

const app = express();

app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
});

app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

app.use((req, res) => {
    res.status(404).sendFile(join(publicPath, "404.html"), (err) => {
        if (err) {
            res.status(404).send("404 Not Found");
        }
    });
});

const server = createServer(app); 

server.on("upgrade", (req, socket, head) => {
    if (req.url?.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
        return;
    }
    socket.end();
});

let port = parseInt(process.env.PORT || "8080", 10);

server.on("listening", () => {
    const address = server.address();
    if (!address || typeof address === "string") return;

    console.log("Ultraviolet learning proxy is running.");
    console.log(`http://localhost:${address.port}`);
    console.log(`http://${hostname()}:${address.port}`);
});

function shutdown() {
    console.log("Shutting down server...");
    server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen({ port });
