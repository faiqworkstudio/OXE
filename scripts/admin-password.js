#!/usr/bin/env node
// Create a login line for the ADMIN_USERS environment variable (password stored as a scrypt hash).
//   node scripts/admin-password.js <username>
// Then in Vercel → Settings → Environment Variables, add the printed line to ADMIN_USERS
// (one user per line), and redeploy.
const readline = require("readline");
const { hashPassword } = require("../api/_lib/auth");

const username = process.argv[2];
if (!username || !/^[A-Za-z0-9._@-]{2,40}$/.test(username)) {
  console.error("Usage: node scripts/admin-password.js <username>   (letters, numbers, . _ @ -)");
  process.exit(1);
}
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Password (at least 10 characters): ", (pw) => {
  rl.close();
  if (!pw || pw.length < 10) { console.error("Password too short."); process.exit(1); }
  console.log(`\nAdd this line to ADMIN_USERS:\n\n${username}:${hashPassword(pw)}\n`);
});
