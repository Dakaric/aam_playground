#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const TEMPLATE_PATH = path.resolve(process.cwd(), "env.template");
const OUTPUT_PATH = path.resolve(process.cwd(), ".env");
const SUPPORTED_SCOPES = new Set(["dev", "prod"]);

function resolveScope() {
  const envScope = (process.env.SETUP_ENV_SCOPE || "").toLowerCase();
  if (SUPPORTED_SCOPES.has(envScope)) {
    return envScope;
  }

  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--scope=")) {
      const value = arg.split("=")[1].toLowerCase();
      if (SUPPORTED_SCOPES.has(value)) {
        return value;
      }
    }
    if (arg === "--scope" || arg === "-s") {
      const value = (args[i + 1] || "").toLowerCase();
      if (SUPPORTED_SCOPES.has(value)) {
        return value;
      }
    }
  }

  return "dev";
}

function parseTemplate(content) {
  const lines = content.split(/\r?\n/);
  const entries = [];
  let pendingMeta = null;

  for (const line of lines) {
    const metaMatch = line.match(/^#\s*@meta\s+(.*)$/);
    if (metaMatch) {
      try {
        pendingMeta = JSON.parse(metaMatch[1]);
      } catch (parseError) {
        const details =
          parseError instanceof Error
            ? parseError.message
            : String(parseError);
        throw new Error(`Ungültiger @meta Block: ${metaMatch[1]} (${details})`);
      }
      continue;
    }

    const varMatch = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (varMatch) {
      entries.push({
        type: "var",
        key: varMatch[1],
        rawValue: varMatch[2],
        meta: pendingMeta,
      });
      pendingMeta = null;
      continue;
    }

    entries.push({ type: "text", value: line });
    pendingMeta = null;
  }

  return entries;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, "utf8");
  return content.split(/\r?\n/).reduce((acc, line) => {
    if (!line || line.trim().startsWith("#")) {
      return acc;
    }
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=(.*)$/);
    if (match) {
      acc[match[1]] = match[2];
    }
    return acc;
  }, {});
}

function updateEnvFile(filePath, updates) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const applied = new Set();

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      return line;
    }
    const key = match[1];
    if (!(key in updates) || updates[key] === undefined) {
      return line;
    }
    applied.add(key);
    return `${key}=${updates[key]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!applied.has(key) && value !== undefined) {
      nextLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(filePath, nextLines.join("\n"), "utf8");
}

function defaultForScope(entry, scope) {
  if (entry.meta?.defaults && entry.meta.defaults[scope] !== undefined) {
    return String(entry.meta.defaults[scope]);
  }
  return entry.rawValue ?? "";
}

function scopeMatches(entry, scope) {
  if (!entry.meta || !Array.isArray(entry.meta.scopes)) {
    return true;
  }
  return entry.meta.scopes.includes(scope);
}

async function promptValue(entry, scope, rl, currentValue) {
  const defaultValue =
    currentValue !== undefined ? currentValue : defaultForScope(entry, scope);
  const description = entry.meta?.description || entry.key;
  const hint =
    defaultValue !== undefined && defaultValue !== ""
      ? ` [${defaultValue}]`
      : " [leer]";

  const question = `${description} (${entry.key}, Scope: ${scope})${hint}: `;
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  const trimmed = answer.trim();

  if (trimmed === ".") {
    return "";
  }
  if (answer === "") {
    return defaultValue;
  }
  return answer;
}

function promptYesNo(rl, question, defaultAnswer = false) {
  const suffix = defaultAnswer ? " (J/n)" : " (j/N)";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix} `, (answer) => {
      const normalized = answer.trim().toLowerCase();
      if (!normalized) {
        resolve(defaultAnswer);
        return;
      }
      resolve(normalized === "j" || normalized === "ja" || normalized === "y");
    });
  });
}

function findMissingEntries(entries, scope, envValues) {
  return entries.filter(
    (entry) =>
      entry.type === "var" &&
      scopeMatches(entry, scope) &&
      (envValues[entry.key] === undefined || envValues[entry.key] === "")
  );
}

async function promptMissingEntries(entries, scope, envValues, rl) {
  if (!entries.length) {
    console.log("✅ Alle benötigten Variablen in .env sind bereits gesetzt.");
    return;
  }

  console.log(
    `⚠️  ${entries.length} neue Variablen fehlen in .env und werden jetzt abgefragt.`
  );

  const updates = {};
  for (const entry of entries) {
    updates[entry.key] = await promptValue(
      entry,
      scope,
      rl,
      envValues[entry.key]
    );
  }

  updateEnvFile(OUTPUT_PATH, updates);
  console.log("✅ Fehlende Variablen ergänzt.");
}

async function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`env.template nicht gefunden (${TEMPLATE_PATH})`);
    process.exit(1);
  }

  const scope = resolveScope();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const entries = parseTemplate(template);

    if (fs.existsSync(OUTPUT_PATH)) {
      const existingEnv = parseEnvFile(OUTPUT_PATH);
      const keepExisting = await promptYesNo(
        rl,
        ".env existiert bereits. Möchtest du die vorhandenen Werte übernehmen?"
      );
      if (keepExisting) {
        const missingEntries = findMissingEntries(entries, scope, existingEnv);
        await promptMissingEntries(missingEntries, scope, existingEnv, rl);
        return;
      }
    }

    const outputLines = [
      `# Erstellt von scripts/setup-env.cjs (Scope: ${scope})`,
      `# ${new Date().toISOString()}`,
    ];

    for (const entry of entries) {
      if (entry.type === "text") {
        outputLines.push(entry.value);
        continue;
      }

      if (entry.type === "var" && scopeMatches(entry, scope)) {
        const value = await promptValue(entry, scope, rl);
        outputLines.push(`${entry.key}=${value}`);
      } else if (entry.type === "var") {
        outputLines.push(`${entry.key}=${entry.rawValue ?? ""}`);
      }
    }

    if (!outputLines[outputLines.length - 1].endsWith("\n")) {
      outputLines.push("");
    }

    fs.writeFileSync(OUTPUT_PATH, outputLines.join("\n"), "utf8");
    console.log(`.env aktualisiert (Scope: ${scope})`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();

