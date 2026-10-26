import { generateKeyPairSync } from "node:crypto";

// Makes the two keys that let your site prove to Google and Apple that the push is really from you.
const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
const publicB64 = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]).toString("base64url");

console.log("");
console.log("Add these three to Cloudflare (Settings, Variables and Secrets):");
console.log("");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + publicB64);
console.log("VAPID_PRIVATE_KEY=" + priv.d);
console.log("VAPID_SUBJECT=mailto:you@example.com");
console.log("");
console.log("Keep VAPID_PRIVATE_KEY secret. Replace the email with a real one of yours.");
console.log("");
