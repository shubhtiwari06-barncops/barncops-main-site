import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { composeDoorReply, doorUrl, fallbackReply, replyToSocialDm, type DoorIn } from "./dm-door.ts";

const RESULT = /won by|margin of|rzp\.io|caste|religion|\bparty\b|phone number/i;

function prose(text: string): string {
  return text.split("https://wa.me/")[0];
}

test("the social webhook does not call Ask or the WhatsApp intake", () => {
  const webhook = readFileSync(new URL("../routes/api.social.webhook.ts", import.meta.url), "utf8");
  const door = readFileSync(new URL("./dm-door.ts", import.meta.url), "utf8");
  assert.equal(webhook.includes("handleInbound"), false);
  assert.equal(webhook.includes("wa-ask"), false);
  assert.equal(webhook.includes("intake-engine"), false);
  assert.equal(door.includes("api.whatsapp"), false);
  assert.equal(door.includes("replyAtlas"), false);
});

test("the door URL sits next to the WhatsApp ask URL", () => {
  assert.equal(doorUrl({ ATLAS_WA_ASK_URL: "https://atlas.barncops.in/api/wa-ask/" }), "https://atlas.barncops.in/api/dm-door/");
  assert.equal(doorUrl({ ATLAS_DM_DOOR_URL: "https://example.test/api/dm-door" }), "https://example.test/api/dm-door/");
});

test("a seat question is one WhatsApp handoff and not a result", async () => {
  const input: DoorIn = { channel: "instagram", userId: "9", text: "who won Barmer" };
  const sent: string[] = [];
  const text = await replyToSocialDm(input, {
    env: { ATLAS_WA_SECRET: "x".repeat(32), ATLAS_WA_ASK_URL: "https://atlas.example/api/wa-ask/" },
    fetchImpl: async () => new Response(JSON.stringify({
      text: "The answer is delivered on WhatsApp.\nWhat do you want: a seat, a region, a leader, or a plan?\nhttps://wa.me/919522236699?text=who%20won%20Barmer%20(ref%20I.LS.Barmer)",
    }), { status: 200 }),
    send: async (_c, _id, body) => { sent.push(body); },
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0], text);
  assert.match(text, /wa\.me\/919522236699/);
  assert.match(decodeURIComponent(text), /\(ref I\.LS\.Barmer\)/);
  assert.equal(RESULT.test(prose(text)), false);
});

test("a result-shaped Atlas reply is not sent", async () => {
  const input: DoorIn = { channel: "facebook", userId: "4", text: "who won Barmer" };
  const text = await composeDoorReply(input, { ATLAS_WA_SECRET: "x".repeat(32), ATLAS_WA_ASK_URL: "https://atlas.example/api/wa-ask/" }, async () => {
    return new Response(JSON.stringify({ text: "Barmer was won by 12,345 votes.\nhttps://rzp.io/rzp/example" }), { status: 200 });
  });
  assert.equal(RESULT.test(prose(text)), false);
  assert.match(text, /The answer is delivered on WhatsApp/);
  assert.match(decodeURIComponent(text), /\(ref F\.GEN\.ask\)/);
});

test("price is one figure when Atlas is down", () => {
  const text = fallbackReply({ channel: "instagram", userId: "1", text: "what is the price" });
  assert.equal(prose(text), "Ask Sarathi from ₹1,499.\n");
  assert.equal((text.match(/₹/g) || []).length, 1);
  assert.equal(/rzp\.io/.test(text), false);
  assert.match(decodeURIComponent(text), /\(ref I\.PR\.ask-sarathi\)/);
});

test("advisory collects a lead and has no price", () => {
  const text = fallbackReply({ channel: "facebook", userId: "2", text: "We need custom research" });
  assert.match(text, /name/i);
  assert.match(text, /organisation/i);
  assert.match(text, /need/i);
  assert.match(text, /time/i);
  assert.equal(/₹|wa\.me|rzp\.io/.test(text), false);
});

test("Hindi is answered in Hindi and a phone is not requested", () => {
  const text = fallbackReply({ channel: "instagram", userId: "3", text: "बड़मेर में कौन जीता" });
  assert.match(prose(text), /जवाब WhatsApp पर दिया जाता है/);
  assert.equal(/नंबर|phone|मोबाइल/.test(prose(text)), false);
  assert.match(text, /wa\.me\/919522236699/);
});
