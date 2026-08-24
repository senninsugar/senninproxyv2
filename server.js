import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import wisp from "wisp-server-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicPath = join(__dirname, "public");

const app = express();

app.use(express.static(publicPath));

app.use(
    "/uv/",
    express.static(uvPath)
);

app.use(
    "/epoxy/",
    express.static(epoxyPath)
);

app.use(
    "/baremux/",
    express.static(baremuxPath)
);

app.use((req, res) => {
    res.status(404);

    res.sendFile(
        join(publicPath, "404.html")
    );
});

const server = createServer();

server.on("request", (req, res) => {
    res.setHeader(
        "Cross-Origin-Opener-Policy",
        "same-origin"
    );

    res.setHeader(
        "Cross-Origin-Embedder-Policy",
        "require-corp"
    );

    app(req, res);
});

server.on(
    "upgrade",
    (req, socket, head) => {
        if (
            req.url &&
            req.url.endsWith("/wisp/")
        ) {
            wisp.routeRequest(
                req,
                socket,
                head
            );

            return;
        }

        socket.end();
    }
);

let port = parseInt(
    process.env.PORT || "",
    10
);

if (Number.isNaN(port)) {
    port = 8080;
}

server.on(
    "listening",
    () => {
        const address =
            server.address();

        if (
            !address ||
            typeof address === "string"
        ) {
            return;
        }

        console.log(
            "Ultraviolet learning proxy is running."
        );

        console.log(
            `Port: ${address.port}`
        );

        console.log(
            `http://localhost:${address.port}`
        );

        console.log(
            `http://${hostname()}:${address.port}`
        );
    }
);

function shutdown() {
    console.log(
        "Shutting down server..."
    );

    server.close(() => {
        process.exit(0);
    });
}

process.on(
    "SIGINT",
    shutdown
);

process.on(
    "SIGTERM",
    shutdown
);

server.listen({
    port
});
