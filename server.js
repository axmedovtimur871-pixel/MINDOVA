import express from "express";
import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = Number(process.env.OWNER_ID);
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error("BOT_TOKEN is missing. See .env.example");
  process.exit(1);
}

/* ---------------- Storage ----------------
   MONGODB_URI set  -> MongoDB (free Atlas tier, survives Render restarts)
   otherwise        -> JSON file in DATA_DIR (needs a Render persistent disk) */
async function makeStore() {
  if (process.env.MONGODB_URI) {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const col = client.db("mindova").collection("site");
    return {
      load: () => col.findOne({ _id: "site" }),
      save: (d) => col.replaceOne({ _id: "site" }, { _id: "site", ...d }, { upsert: true }),
    };
  }
  const dir = process.env.DATA_DIR || path.join(__dirname, "data");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "data.json");
  return {
    async load() {
      try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return null; }
    },
    async save(d) {
      const tmp = file + ".tmp";
      await fs.writeFile(tmp, JSON.stringify(d, null, 2));
      await fs.rename(tmp, file);
    },
  };
}

const store = await makeStore();
let db = (await store.load()) ?? {
  nextId: 2,
  events: [],
  team: [{ id: 1, name: "Temurbek Ahmedov", role: "Founder", bio: "Leads MINDOVA and builds the community.", photo: "" }],
};
delete db._id;
const save = () => store.save(db);

/* ---------------- Helpers ---------------- */
const EVENT_FIELDS = ["title", "date", "time", "place", "desc", "link"];
const MEMBER_FIELDS = ["name", "role", "bio"];
const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const validLink = (v) => v === "-" || /^https?:\/\//i.test(v);
const evLine = (e) => `#${e.id} · ${e.date} ${e.time} · ${e.title}`;
const mLine = (m, i) => `${i + 1}. #${m.id} · ${m.name} (${m.role})${m.photo ? " 📷" : ""}`;

/* ---------------- Bot ---------------- */
const bot = new Bot(TOKEN);

// Owner only. Everyone else gets a polite refusal (and their ID, handy for first setup).
bot.use(async (ctx, next) => {
  if (ctx.from?.id === OWNER_ID) return next();
  if (ctx.chat?.type === "private") await ctx.reply(`This bot is private.\nYour Telegram ID: ${ctx.from?.id}`);
});

const HELP = `MINDOVA admin

Events
/events – list events
/addevent – add an event (step by step)
/editevent <id> <field> <value>
   fields: ${EVENT_FIELDS.join(", ")}
/delevent <id>

Team
/team – list members
/addmember – add a member (with photo)
/editmember <id> <field> <value>
   fields: ${MEMBER_FIELDS.join(", ")}
/photo <id> – change a member's photo
/move <id> <position> – change order
/delmember <id>

/cancel – stop what you are doing`;

bot.command(["start", "help"], (ctx) => ctx.reply(HELP));

/* ----- Step-by-step flows ----- */
const sessions = new Map();

const FLOWS = {
  event: {
    steps: [
      { key: "title", ask: "Event title?" },
      { key: "date", ask: "Date? Use YYYY-MM-DD, for example 2026-11-14", check: validDate, error: "That date doesn't look right. Use YYYY-MM-DD, for example 2026-11-14." },
      { key: "time", ask: "Time? For example 15:00" },
      { key: "place", ask: "Place?" },
      { key: "desc", ask: "Short description?" },
      { key: "link", ask: "Registration link? Send - if there is none.", check: validLink, error: "Send a link starting with http:// or https://, or - for none." },
    ],
    async done(d) {
      const e = { id: db.nextId++, ...d, link: d.link === "-" ? "" : d.link };
      db.events.push(e);
      await save();
      return `Event added ✅\n${evLine(e)}`;
    },
  },
  member: {
    steps: [
      { key: "name", ask: "Member's full name?" },
      { key: "role", ask: "Role? For example Designer" },
      { key: "bio", ask: "One-line bio?" },
      { key: "photo", ask: "Send a photo, or - to skip.", photo: true, optional: true },
    ],
    async done(d) {
      const m = { id: db.nextId++, name: d.name, role: d.role, bio: d.bio, photo: d.photo || "" };
      db.team.push(m);
      await save();
      return `Member added ✅\n${m.name} (${m.role})`;
    },
  },
  photo: {
    steps: [{ key: "photo", ask: "Send the new photo.", photo: true }],
    async done(d) {
      const m = db.team.find((x) => x.id === d.id);
      if (!m) return "Member not found.";
      m.photo = d.photo;
      await save();
      return `Photo updated for ${m.name} ✅`;
    },
  },
};

function startFlow(ctx, name, data = {}) {
  sessions.set(ctx.from.id, { name, i: 0, data });
  return ctx.reply(`${FLOWS[name].steps[0].ask}\n\n(/cancel to stop)`);
}

bot.command("cancel", (ctx) => {
  sessions.delete(ctx.from.id);
  return ctx.reply("Cancelled.");
});

bot.command("addevent", (ctx) => startFlow(ctx, "event"));
bot.command("addmember", (ctx) => startFlow(ctx, "member"));
bot.command("photo", (ctx) => {
  const id = Number(ctx.match);
  if (!db.team.some((m) => m.id === id)) return ctx.reply("Usage: /photo <id>. Use the # number from /team.");
  return startFlow(ctx, "photo", { id });
});

/* ----- Lists ----- */
bot.command("events", (ctx) => {
  if (!db.events.length) return ctx.reply("No events yet. Use /addevent.");
  const sorted = [...db.events].sort((a, b) => a.date.localeCompare(b.date));
  return ctx.reply(sorted.map(evLine).join("\n"));
});
bot.command("team", (ctx) => {
  if (!db.team.length) return ctx.reply("No members yet. Use /addmember.");
  return ctx.reply(db.team.map(mLine).join("\n"));
});

/* ----- Edit ----- */
const editor = (kind) => async (ctx) => {
  const fields = kind === "event" ? EVENT_FIELDS : MEMBER_FIELDS;
  const m = ctx.match.match(/^(\d+)\s+(\w+)\s+([\s\S]+)$/);
  if (!m) return ctx.reply(`Usage: /edit${kind} <id> <field> <new value>\nFields: ${fields.join(", ")}`);
  const [, idStr, field, raw] = m;
  const list = kind === "event" ? db.events : db.team;
  const item = list.find((x) => x.id === Number(idStr));
  if (!item) return ctx.reply("Not found. Use the # number from the list.");
  if (!fields.includes(field)) return ctx.reply(`Unknown field. Choose from: ${fields.join(", ")}`);
  let value = raw.trim();
  if (field === "date" && !validDate(value)) return ctx.reply("Date must look like 2026-11-14.");
  if (field === "link") {
    if (!validLink(value)) return ctx.reply("Send a link starting with http:// or https://, or - to remove it.");
    if (value === "-") value = "";
  }
  item[field] = value;
  await save();
  return ctx.reply(`Updated ${field} ✅`);
};
bot.command("editevent", editor("event"));
bot.command("editmember", editor("member"));

/* ----- Reorder team ----- */
bot.command("move", async (ctx) => {
  const m = ctx.match.match(/^(\d+)\s+(\d+)$/);
  if (!m) return ctx.reply("Usage: /move <id> <position>. Example: /move 3 1 puts member #3 first.");
  const from = db.team.findIndex((x) => x.id === Number(m[1]));
  if (from < 0) return ctx.reply("Member not found.");
  const to = Math.min(Math.max(Number(m[2]), 1), db.team.length) - 1;
  const [item] = db.team.splice(from, 1);
  db.team.splice(to, 0, item);
  await save();
  return ctx.reply("Moved ✅\n\n" + db.team.map(mLine).join("\n"));
});

/* ----- Delete (with confirmation) ----- */
const askDelete = (kind) => (ctx) => {
  const list = kind === "event" ? db.events : db.team;
  const item = list.find((x) => x.id === Number(ctx.match));
  if (!item) return ctx.reply(`Usage: /del${kind} <id>. Use the # number from the list.`);
  const kb = new InlineKeyboard().text("Yes, delete", `del:${kind}:${item.id}`).text("Cancel", "noop");
  return ctx.reply(`Delete "${item.title ?? item.name}"?`, { reply_markup: kb });
};
bot.command("delevent", askDelete("event"));
bot.command("delmember", askDelete("member"));

bot.callbackQuery(/^del:(event|member):(\d+)$/, async (ctx) => {
  const [, kind, id] = ctx.match;
  const key = kind === "event" ? "events" : "team";
  db[key] = db[key].filter((x) => x.id !== Number(id));
  await save();
  await ctx.editMessageText("Deleted ✅");
  await ctx.answerCallbackQuery();
});
bot.callbackQuery("noop", async (ctx) => {
  await ctx.editMessageText("Cancelled.");
  await ctx.answerCallbackQuery();
});

/* ----- Answers inside a flow ----- */
bot.on("message", async (ctx) => {
  const s = sessions.get(ctx.from.id);
  if (!s) return ctx.reply("Send /help to see what I can do.");
  if (ctx.message.text?.startsWith("/")) return ctx.reply("Unknown command. Send /cancel to stop the current step.");

  const flow = FLOWS[s.name];
  const step = flow.steps[s.i];
  let value;

  if (step.photo) {
    if (ctx.message.photo) value = ctx.message.photo.at(-1).file_id;
    else if (step.optional && ctx.message.text?.trim() === "-") value = "";
    else return ctx.reply("Please send a photo" + (step.optional ? " (or - to skip)." : "."));
  } else {
    value = ctx.message.text?.trim();
    if (!value) return ctx.reply("Please send text.");
    if (step.check && !step.check(value)) return ctx.reply(step.error);
  }

  s.data[step.key] = value;
  s.i++;
  if (s.i < flow.steps.length) return ctx.reply(flow.steps[s.i].ask);

  sessions.delete(ctx.from.id);
  return ctx.reply(await flow.done(s.data));
});

bot.catch((err) => console.error("Bot error:", err.error ?? err));

/* ---------------- Website + API ---------------- */
const app = express();

app.get("/healthz", (_req, res) => res.send("ok"));

app.get("/api/data", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    events: db.events,
    team: db.team.map((m) => ({ ...m, photo: m.photo ? `/photo/${m.photo}` : "" })),
  });
});

// Photos stay on Telegram's servers; we stream them through only for photos used on the site.
app.get("/photo/:id", async (req, res) => {
  try {
    if (!db.team.some((m) => m.photo === req.params.id)) return res.status(404).end();
    const f = await bot.api.getFile(req.params.id);
    const r = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${f.file_path}`);
    if (!r.ok) throw new Error("telegram file fetch failed");
    res.set("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.status(404).end();
  }
});

app.use(express.static(path.join(__dirname, "public")));

/* ---------------- Start ---------------- */
await bot.init();
await bot.api.setMyCommands([
  { command: "help", description: "Show all commands" },
  { command: "events", description: "List events" },
  { command: "addevent", description: "Add an event" },
  { command: "team", description: "List team members" },
  { command: "addmember", description: "Add a team member" },
  { command: "cancel", description: "Cancel current action" },
]);

const baseUrl = process.env.RENDER_EXTERNAL_URL; // set automatically by Render
const secret = crypto.createHash("sha256").update(TOKEN).digest("hex").slice(0, 32);
const hookPath = `/webhook/${secret}`;

if (baseUrl) {
  app.use(hookPath, express.json(), webhookCallback(bot, "express", { secretToken: secret }));
}

app.listen(PORT, async () => {
  console.log(`MINDOVA running on port ${PORT}`);
  if (!OWNER_ID) console.warn("OWNER_ID is not set: nobody can use the bot yet.");
  if (baseUrl) {
    await bot.api.setWebhook(`${baseUrl}${hookPath}`, { secret_token: secret });
    console.log("Telegram webhook set");
  } else {
    await bot.api.deleteWebhook();
    bot.start(); // local development uses long polling
    console.log("Bot polling (local mode)");
  }
});
