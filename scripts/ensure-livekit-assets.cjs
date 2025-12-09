#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT_DIR = process.cwd();
const ENV_PATH = path.resolve(ROOT_DIR, ".env");
const LIVEKIT_DIR = path.resolve(ROOT_DIR, "docker/livekit");

function boolFromEnv(value) {
  if (value === undefined || value === null) {
    return false;
  }
  return ["1", "true", "yes", "y", "on", "enabled"].includes(
    String(value).trim().toLowerCase()
  );
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
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

function persistEnvValues(updates) {
  const keys = Object.keys(updates);
  if (!keys.length) {
    return;
  }

  const existingLines = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)
    : [];
  const applied = new Set();
  const nextLines = existingLines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      return line;
    }
    const key = match[1];
    if (!updates[key]) {
      return line;
    }
    applied.add(key);
    return `${key}=${updates[key]}`;
  });

  for (const key of keys) {
    if (!applied.has(key)) {
      nextLines.push(`${key}=${updates[key]}`);
    }
  }

  if (nextLines.length && nextLines[nextLines.length - 1] !== "") {
    nextLines.push("");
  }

  fs.writeFileSync(ENV_PATH, nextLines.join("\n"), "utf8");
}

function ensureEnvValue(env, updates, key, fallback) {
  if (env[key] && env[key].trim() !== "") {
    return env[key];
  }
  updates[key] = fallback;
  env[key] = fallback;
  console.log(`[livekit-assets] ${key} automatisch auf '${fallback}' gesetzt.`);
  return fallback;
}

function resolveLivekitPath(relativeOrAbsolute) {
  if (!relativeOrAbsolute) {
    return null;
  }
  if (path.isAbsolute(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }
  return path.join(LIVEKIT_DIR, relativeOrAbsolute);
}

function ensureRedisSecret(env, updates) {
  if (!boolFromEnv(env.LIVEKIT_ENABLED)) {
    return;
  }

  if (!boolFromEnv(env.LIVEKIT_REDIS_AUTH_ENABLED)) {
    updates.LIVEKIT_REDIS_AUTH_ENABLED = "true";
    env.LIVEKIT_REDIS_AUTH_ENABLED = "true";
    console.log("[livekit-assets] LIVEKIT_REDIS_AUTH_ENABLED automatisch auf 'true' gesetzt.");
  }

  if (env.LIVEKIT_REDIS_PASSWORD && env.LIVEKIT_REDIS_PASSWORD.trim() !== "") {
    if (
      env.LIVEKIT_REDIS_USERNAME &&
      env.LIVEKIT_REDIS_USERNAME.trim() !== "" &&
      (env.LIVEKIT_REDIS_HOST || "").trim() === "livekit-redis"
    ) {
      updates.LIVEKIT_REDIS_USERNAME = "";
      env.LIVEKIT_REDIS_USERNAME = "";
      console.log(
        "[livekit-assets] LIVEKIT_REDIS_USERNAME entfernt (lokaler Redis nutzt requirepass ohne ACL)."
      );
    }
    return;
  }

  const password = crypto.randomBytes(24).toString("base64url");
  updates.LIVEKIT_REDIS_PASSWORD = password;
  env.LIVEKIT_REDIS_PASSWORD = password;
  console.log("[livekit-assets] LIVEKIT_REDIS_PASSWORD automatisch erzeugt.");
}

function ensureTurnCertificates(env, updates) {
  if (!boolFromEnv(env.LIVEKIT_ENABLED)) {
    return;
  }
  if (!boolFromEnv(env.LIVEKIT_TURN_ENABLED)) {
    return;
  }

  const domain = (env.LIVEKIT_TURN_DOMAIN || "").trim();
  if (!domain) {
    throw new Error(
      "LIVEKIT_TURN_DOMAIN fehlt, obwohl TURN aktiviert ist. Bitte in der .env setzen."
    );
  }

  const certValue = ensureEnvValue(
    env,
    updates,
    "LIVEKIT_TURN_CERT_FILE",
    "certs/livekit-turn.crt"
  );
  const keyValue = ensureEnvValue(
    env,
    updates,
    "LIVEKIT_TURN_KEY_FILE",
    "certs/livekit-turn.key"
  );

  const certPath = resolveLivekitPath(certValue);
  const keyPath = resolveLivekitPath(keyValue);
  if (!certPath || !keyPath) {
    throw new Error("Konnte Pfad für TURN-Zertifikate nicht auflösen.");
  }

  const certExists = fs.existsSync(certPath);
  const keyExists = fs.existsSync(keyPath);
  if (certExists && keyExists) {
    return;
  }

  fs.mkdirSync(path.dirname(certPath), { recursive: true });
  console.log(
    `[livekit-assets] Erzeuge selbstsigniertes TURN-Zertifikat für ${domain} …`
  );

  const opensslArgs = [
    "req",
    "-x509",
    "-nodes",
    "-days",
    "825",
    "-newkey",
    "rsa:2048",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-subj",
    `/CN=${domain}`,
    "-addext",
    `subjectAltName = DNS:${domain}`,
  ];

  const result = spawnSync("openssl", opensslArgs, {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(
      "openssl konnte das TURN-Zertifikat nicht erzeugen. Bitte prüfe, ob openssl installiert ist."
    );
  }

  console.log(
    `[livekit-assets] TURN-Zertifikat gespeichert unter ${certValue} / ${keyValue}.`
  );
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.log(
      "[livekit-assets] .env fehlt – überspringe automatische LiveKit-Aufbereitung."
    );
    return;
  }

  const env = parseEnvFile(ENV_PATH);
  const updates = {};

  try {
    ensureRedisSecret(env, updates);
    ensureTurnCertificates(env, updates);
  } finally {
    persistEnvValues(updates);
  }
}

try {
  main();
} catch (error) {
  console.error(`[livekit-assets] ${error.message || error}`);
  process.exit(1);
}


