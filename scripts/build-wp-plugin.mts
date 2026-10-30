/**
 * Packs wordpress/vanduo-marse-booking into a zip plus a version manifest under
 * public/wordpress/, so every deploy publishes the current plugin and installed
 * copies can update themselves from the Plugins page (ADR-0016). Runs before
 * `next build`; the outputs are generated, not committed.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { zipSync, type Zippable } from "fflate";

const SLUG = "vanduo-marse-booking";
const SOURCE = join("wordpress", SLUG);
const OUT = join("public", "wordpress");

function header(php: string, name: string): string {
  const match = php.match(new RegExp(`^\\s*\\*\\s*${name}:\\s*(.+)$`, "m"));
  if (!match) throw new Error(`${SLUG}.php has no "${name}:" header`);
  return match[1].trim();
}

/** Every file under `dir`, keyed by its path inside the zip (`vanduo-marse-booking/...`). */
function collect(dir: string, files: Zippable = {}): Zippable {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) collect(path, files);
    else files[join(SLUG, relative(SOURCE, path)).split("\\").join("/")] = readFileSync(path);
  }
  return files;
}

const php = readFileSync(join(SOURCE, `${SLUG}.php`), "utf8");
const version = header(php, "Version");
const constant = php.match(/define\(\s*'VM_BOOKING_VERSION',\s*'([^']+)'\s*\)/)?.[1];
if (constant !== version) throw new Error(`Version header (${version}) and VM_BOOKING_VERSION (${constant}) differ`);

// WordPress needs the plugin folder at the zip root, or the update installs a second copy.
const zip = zipSync(collect(SOURCE), { level: 9 });

const readme = readFileSync(join(SOURCE, "readme.txt"), "utf8");
const manifest = {
  name: header(php, "Plugin Name"),
  slug: SLUG,
  version,
  requires: header(php, "Requires at least"),
  requires_php: header(php, "Requires PHP"),
  tested: readme.match(/^Tested up to:\s*(.+)$/m)?.[1].trim() ?? "",
  // Relative on purpose: the plugin joins it to the app address it already trusts.
  package: `/wordpress/${SLUG}.zip?v=${version}`,
  last_updated: new Date().toISOString(),
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${SLUG}.zip`), zip);
writeFileSync(join(OUT, `${SLUG}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`WordPress plugin ${version}: ${OUT}/${SLUG}.zip (${Math.round(zip.length / 1024)} KB)`);
