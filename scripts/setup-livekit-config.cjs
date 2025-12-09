#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const ENV_PATH = path.resolve(process.cwd(), ".env");
const OUTPUT_DIR = path.resolve(process.cwd(), "docker/livekit");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "livekit.yaml");

const REQUIRED_KEYS = ["LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"];

function parseEnv(filePath) {
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

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on", "enabled"].includes(normalized);
}

function ensureValue(env, key, fallback) {
  const value = env[key];
  if (value === undefined || value === "") {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(
      `LIVEKIT_ENABLED=true, aber ${key} fehlt in .env. Bitte make setup erneut ausführen.`
    );
  }
  return value;
}

function resolveContainerPath(value) {
  if (!value) {
    return value;
  }
  return value.startsWith("/")
    ? value
    : `/etc/livekit/${value.replace(/^\.?\//, "")}`;
}

function buildConfig(env) {
  const lines = [];
  const logLevel = ensureValue(env, "LIVEKIT_LOG_LEVEL", "info");
  const port = ensureValue(env, "LIVEKIT_PORT", "7880");
  const tcpPort = ensureValue(env, "LIVEKIT_RTC_TCP_PORT", "7881");
  const udpPort = ensureValue(env, "LIVEKIT_RTC_UDP_PORT", "7882");
  const redisHost = ensureValue(env, "LIVEKIT_REDIS_HOST", "livekit-redis");
  const redisPort = ensureValue(env, "LIVEKIT_REDIS_PORT", "6379");
  const redisUser = env.LIVEKIT_REDIS_USERNAME;
  const redisPass = env.LIVEKIT_REDIS_PASSWORD;
  const redisAuthEnabled = normalizeBoolean(
    env.LIVEKIT_REDIS_AUTH_ENABLED,
    false
  );
  const nodeIp = env.LIVEKIT_NODE_IP || "";
  const useExternalIp = normalizeBoolean(env.LIVEKIT_USE_EXTERNAL_IP, true);
  const prometheusPort = env.LIVEKIT_PROMETHEUS_PORT;
  const webhookUrls = (env.LIVEKIT_WEBHOOK_URLS
    ? env.LIVEKIT_WEBHOOK_URLS.split(",")
    : []
  )
    .map((url) => url.trim())
    .filter(Boolean);
  const turnEnabled = normalizeBoolean(env.LIVEKIT_TURN_ENABLED, false);

  lines.push("# Automatisch erzeugt von scripts/setup-livekit-config.cjs");
  lines.push(`# ${new Date().toISOString()}`);
  lines.push(`port: ${port}`);
  lines.push(`log_level: ${logLevel}`);
  lines.push("bind_addresses:");
  lines.push("  - 0.0.0.0");
  lines.push("rtc:");
  lines.push(`  use_external_ip: ${useExternalIp ? "true" : "false"}`);
  lines.push(`  tcp_port: ${tcpPort}`);
  lines.push(`  udp_port: ${udpPort}`);
  if (nodeIp) {
    lines.push(`  node_ip: ${nodeIp}`);
  }

  lines.push("redis:");
  lines.push(`  address: ${redisHost}:${redisPort}`);
  if (redisAuthEnabled) {
    if (redisUser) {
      lines.push(`  username: ${redisUser}`);
    }
    if (redisPass) {
      lines.push(`  password: ${redisPass}`);
    }
  } else if (redisUser || redisPass) {
    console.warn(
      "[setup-livekit-config] LIVEKIT_REDIS_USERNAME/-PASSWORD sind gesetzt, aber LIVEKIT_REDIS_AUTH_ENABLED!=true – Werte werden ignoriert."
    );
  }

  const apiKey = ensureValue(env, "LIVEKIT_API_KEY");
  const apiSecret = ensureValue(env, "LIVEKIT_API_SECRET");
  const keyPairs = new Map([[apiKey, apiSecret]]);

  const extraWebhookKey = env.LIVEKIT_WEBHOOK_API_KEY;
  const extraWebhookSecret = env.LIVEKIT_WEBHOOK_API_SECRET;
  if (extraWebhookKey && extraWebhookSecret) {
    keyPairs.set(extraWebhookKey, extraWebhookSecret);
  } else if (extraWebhookKey && extraWebhookKey !== apiKey) {
    console.warn(
      "[setup-livekit-config] LIVEKIT_WEBHOOK_API_KEY ist gesetzt, aber LIVEKIT_WEBHOOK_API_SECRET fehlt – verwende Haupt-API-Key."
    );
  }

  lines.push("keys:");
  for (const [key, secret] of keyPairs.entries()) {
    lines.push(`  ${key}: ${secret}`);
  }

  if (normalizeBoolean(env.LIVEKIT_WEBHOOK_ENABLED, false) && webhookUrls.length) {
    let webhookKey =
      env.LIVEKIT_WEBHOOK_API_KEY && env.LIVEKIT_WEBHOOK_API_KEY !== ""
        ? env.LIVEKIT_WEBHOOK_API_KEY
        : apiKey;
    if (!keyPairs.has(webhookKey)) {
      console.warn(
        "[setup-livekit-config] Webhook-Key nicht in keys{} gefunden – verwende Haupt-API-Key."
      );
      webhookKey = apiKey;
    }
    lines.push("webhook:");
    lines.push(`  api_key: ${webhookKey}`);
    lines.push("  urls:");
    webhookUrls.forEach((url) => {
      lines.push(`    - ${url}`);
    });
  }

  if (prometheusPort) {
    lines.push(`prometheus_port: ${prometheusPort}`);
  }

  lines.push("turn:");
  if (turnEnabled) {
    const turnCert = env.LIVEKIT_TURN_CERT_FILE;
    const turnKey = env.LIVEKIT_TURN_KEY_FILE;
    if (!turnCert || !turnKey) {
      console.warn(
        "[setup-livekit-config] LIVEKIT_TURN_ENABLED=true, aber LIVEKIT_TURN_CERT_FILE/LIVEKIT_TURN_KEY_FILE fehlen – deaktiviere TURN."
      );
      lines.push("  enabled: false");
    } else {
      lines.push("  enabled: true");
      lines.push(
        `  domain: ${ensureValue(env, "LIVEKIT_TURN_DOMAIN", "turn.example.com")}`
      );
      lines.push(`  tls_port: ${ensureValue(env, "LIVEKIT_TURN_TLS_PORT", "5349")}`);
      lines.push(`  udp_port: ${ensureValue(env, "LIVEKIT_TURN_UDP_PORT", "3478")}`);
      lines.push(`  cert_file: ${resolveContainerPath(turnCert)}`);
      lines.push(`  key_file: ${resolveContainerPath(turnKey)}`);
      if (env.LIVEKIT_TURN_USERNAME || env.LIVEKIT_TURN_PASSWORD) {
        console.warn(
          "[setup-livekit-config] LIVEKIT_TURN_USERNAME/-PASSWORD sind deprecated und werden ignoriert."
        );
      }
    }
  } else {
    lines.push("  enabled: false");
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(".env wurde noch nicht erzeugt. Bitte zuerst make setup ausführen.");
    process.exit(1);
  }

  const env = parseEnv(ENV_PATH);
  if (!normalizeBoolean(env.LIVEKIT_ENABLED, false)) {
    console.log("LIVEKIT_ENABLED=false – überspringe LiveKit-Konfiguration.");
    if (fs.existsSync(OUTPUT_PATH)) {
      console.log(`(Bestehende ${OUTPUT_PATH} bleibt unverändert.)`);
    }
    return;
  }

  for (const key of REQUIRED_KEYS) {
    ensureValue(env, key);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const config = buildConfig(env);
  fs.writeFileSync(OUTPUT_PATH, config, "utf8");
  console.log(`✅ LiveKit-Konfiguration aktualisiert: ${OUTPUT_PATH}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}

