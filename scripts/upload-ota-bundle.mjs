/**
 * Upload OTA Bundle Script
 *
 * Builds the website, zips the dist folder, and uploads as latest.zip
 * to the Supabase Storage bucket "ota-bundles".
 *
 * Usage:
 *   $env:SUPABASE_URL="https://xxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-key"
 *   node scripts/upload-ota-bundle.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const websiteDir = path.join(__dirname, "../apps/website");
const distDir = path.join(websiteDir, "dist");
const bucketName = "ota-bundles";

async function buildAndUpload() {
  console.log("Building website...");
  execSync("pnpm run build", { cwd: websiteDir, stdio: "inherit" });

  console.log("Packaging latest bundle...");
  const zipPath = path.join(websiteDir, "latest.zip");

  const zip = new AdmZip();
  zip.addLocalFolder(distDir);
  zip.writeZip(zipPath);
  console.log(`Created ${zipPath}`);

  console.log("Ensuring storage bucket exists...");
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucketName);

  if (!bucketExists) {
    console.log(`Creating bucket: ${bucketName}`);
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
    });
    if (error) {
      console.error("Failed to create bucket:", error.message);
      process.exit(1);
    }
  }

  console.log("Uploading to Supabase Storage...");
  const fileContent = fs.readFileSync(zipPath);

  const { error } = await supabase.storage
    .from(bucketName)
    .upload("latest.zip", fileContent, {
      contentType: "application/zip",
      upsert: true,
    });

  if (error) {
    console.error("Upload failed:", error.message);
    process.exit(1);
  }

  // Gerar e fazer upload de version.json para que a Edge Function possa ler a versão correta
  const version = process.env.GITHUB_SHA || Date.now().toString();
  const versionJsonContent = JSON.stringify({ version });
  
  const { error: versionError } = await supabase.storage
    .from(bucketName)
    .upload("version.json", versionJsonContent, {
      contentType: "application/json",
      upsert: true,
    });

  if (versionError) {
    console.error("Failed to upload version.json:", versionError.message);
    process.exit(1);
  }

  console.log(`Successfully uploaded latest.zip and version.json to ${bucketName}`);

  fs.unlinkSync(zipPath);

  console.log("\nDone! Edge Function URL:");
  console.log(`${supabaseUrl}/functions/v1/ota-version`);
}

buildAndUpload().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
