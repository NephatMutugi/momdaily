/**
 * Manual trigger for the morning email cron.
 *
 * Usage:
 *   npm run cron:morning
 *
 * Reads CRON_SECRET from .env and POSTs to the local dev server. Handy for
 * end-to-end testing without waiting until the top of the hour.
 *
 * To dispatch against a different host (e.g., your Vercel preview deploy):
 *   APP_ORIGIN=https://preview-xyz.vercel.app npm run cron:morning
 */

const origin =
  process.env.APP_ORIGIN ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is not set in .env — add one to run this script.");
  process.exit(1);
}

async function main() {
  const url = `${origin}/api/cron/send-morning-emails`;
  console.log(`POSTing morning cron → ${url}`);
  const res = await fetch(url, {
    method: "GET",
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(body);
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
