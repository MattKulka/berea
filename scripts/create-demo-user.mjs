import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = process.argv[2];
const password = process.argv[3];

const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) {
  console.error("ERROR", error.message);
  process.exit(1);
}
console.log("Created demo user:", data.user.id);
