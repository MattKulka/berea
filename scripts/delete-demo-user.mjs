import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = process.argv[2];
const { data } = await admin.auth.admin.listUsers();
const user = data.users.find((u) => u.email === email);
if (user) {
  await admin.auth.admin.deleteUser(user.id);
  console.log("deleted", user.id);
} else {
  console.log("not found");
}
