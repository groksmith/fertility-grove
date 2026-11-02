// Send one command to the Figma plugin through the TalkToFigma relay.
// Usage: FG_CHANNEL=<id> node fg.mjs <command> <params.json | '{"inline":"json"}'>
// Nodes with `image: "/abs/path.png"` are inlined as base64 before sending.
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

const [command, arg = "{}"] = process.argv.slice(2);
const channel = process.env.FG_CHANNEL;
if (!command || !channel) {
  console.error("usage: FG_CHANNEL=<id> node fg.mjs <command> <params.json|json>");
  process.exit(2);
}
const params = JSON.parse(existsSync(arg) ? readFileSync(arg, "utf8") : arg);
const inline = (n) => {
  if (n && typeof n === "object") {
    if (typeof n.image === "string") {
      n.imageBase64 = readFileSync(n.image).toString("base64");
      delete n.image;
    }
    if (Array.isArray(n.children)) n.children.forEach(inline);
  }
};
(params.nodes || []).forEach(inline);

const ws = new WebSocket("ws://localhost:3055");
const id = randomUUID();
const timer = setTimeout(() => {
  console.error("timeout");
  process.exit(1);
}, Number(process.env.FG_TIMEOUT || 240000));
ws.addEventListener("open", () => ws.send(JSON.stringify({ type: "join", channel, id: "join-" + id })));
ws.addEventListener("message", (e) => {
  const d = JSON.parse(e.data);
  if (d.type === "system" && d.message?.result?.startsWith?.("Connected to channel")) {
    ws.send(JSON.stringify({ id, type: "message", channel, message: { id, command, params: { ...params, commandId: id } } }));
    return;
  }
  const m = d.message;
  if (m && m.id === id && ("result" in m || "error" in m)) {
    clearTimeout(timer);
    if (m.error) {
      console.error("ERROR:", typeof m.error === "string" ? m.error : JSON.stringify(m.error));
      process.exit(1);
    }
    console.log(JSON.stringify(m.result));
    ws.close();
    process.exit(0);
  }
});
ws.addEventListener("error", (e) => {
  console.error("socket error", e.message || e);
  process.exit(1);
});
