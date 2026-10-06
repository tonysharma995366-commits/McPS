import fs from "fs";
import path from "path";
import { CONFIG } from "../config.js";
import logger from "../logger.js";
const log = logger;
import { createBackup } from "./backups.js";

const VERSION_FILE = path.join(CONFIG.mc.dir, "version.txt");

// In-memory cache for paper versions
let versionsCache = {
  timestamp: 0,
  data: [],
};

const CACHE_TTL = 3600 * 1000; // 1 hour

export async function listPaperVersions() {
  const now = Date.now();
  if (versionsCache.data.length > 0 && now - versionsCache.timestamp < CACHE_TTL) {
    return versionsCache.data;
  }

  try {
    const res = await fetch("https://fill.papermc.io/v3/projects/paper");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // v3 endpoint returns { versions: [...] } or array of version strings/objects
    let versions = [];
    if (Array.isArray(data)) {
      versions = data.map(v => (typeof v === "string" ? v : v.version));
    } else if (data && Array.isArray(data.versions)) {
      versions = data.versions.map(v => (typeof v === "string" ? v : v.version));
    }

    // Sort descending semver-like or reverse alphabetical
    versions = versions.filter(Boolean).sort((a, b) => {
      const pa = a.split(".").map(Number);
      const pb = b.split(".").map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na !== nb) return nb - na;
      }
      return 0;
    });

    versionsCache = { timestamp: now, data: versions };
    return versions;
  } catch (err) {
    log.error("Failed to fetch paper versions:", err.message);
    // Fallback default list if API fails
    return ["1.21.4", "1.21.3", "1.21.1", "1.20.6", "1.20.4", "1.19.4", "1.18.2"];
  }
}

export async function listBuildsForVersion(version) {
  try {
    const res = await fetch(`https://fill.papermc.io/v3/projects/paper/versions/${encodeURIComponent(version)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    let builds = [];
    if (data && Array.isArray(data.builds)) {
      builds = data.builds;
    } else if (Array.isArray(data)) {
      builds = data;
    }

    // Normalize and sort descending by build number
    return builds
      .map((b) => ({
        build: b.build || b.id || 1,
        time: b.time || b.createdAt || new Date().toISOString(),
        channel: b.channel || "default",
        downloads: b.downloads || {},
      }))
      .sort((a, b) => b.build - a.build);
  } catch (err) {
    log.error(`Failed to fetch builds for version ${version}:`, err.message);
    return [{ build: 1, time: new Date().toISOString(), channel: "default", downloads: {} }];
  }
}

export async function getCurrentVersion() {
  let version = "1.20.4";
  let build = "497";
  let source = "default";

  try {
    if (fs.existsSync(VERSION_FILE)) {
      const content = fs.readFileSync(VERSION_FILE, "utf8").trim();
      const parts = content.split(/\s+/);
      if (parts[0]) version = parts[0];
      if (parts[1]) build = parts[1];
      source = "version.txt";
    } else {
      // Try scanning console log
      const logPath = path.join(CONFIG.mc.dir, "logs", "latest.log");
      if (fs.existsSync(logPath)) {
        const logText = fs.readFileSync(logPath, "utf8");
        const match = logText.match(/This server is running Paper version .*?MC: ([0-9.]+).*?build ([0-9]+)/i);
        if (match) {
          version = match[1];
          build = match[2];
          source = "latest.log";
        }
      }
    }
  } catch (err) {
    log.warn("Error reading current version:", err.message);
  }

  return { version, build, source };
}

export async function setPaperVersion(version, build) {
  const versions = await listPaperVersions();
  if (!versions.includes(version)) {
    throw new Error(`Invalid version: ${version}`);
  }

  const builds = await listBuildsForVersion(version);
  const targetBuild = builds.find((b) => String(b.build) === String(build)) || builds[0];
  if (!targetBuild) {
    throw new Error(`Invalid build ${build} for version ${version}`);
  }

  // Auto-backup world before version change
  try {
    await createBackup(`Pre-version-change to ${version} build ${targetBuild.build}`, "auto");
  } catch (err) {
    log.warn("Auto-backup before version change failed:", err.message);
  }

  // Get download URL
  // v3 download URL structure or fallback v2 structure
  let downloadUrl = targetBuild.downloads?.application?.url;
  if (!downloadUrl) {
    downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${targetBuild.build}/downloads/paper-${version}-${targetBuild.build}.jar`;
  } else if (downloadUrl.startsWith("/")) {
    downloadUrl = `https://fill.papermc.io${downloadUrl}`;
  }

  const tempJarPath = path.join(CONFIG.mc.dir, "server.jar.tmp");
  const jarPath = path.join(CONFIG.mc.dir, "server.jar");
  const backupJarPath = path.join(CONFIG.mc.dir, "server.jar.bak");

  log.info(`Downloading Paper ${version} build ${targetBuild.build} from ${downloadUrl}...`);
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Download failed with HTTP ${res.status}`);

  const jarBuffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tempJarPath, jarBuffer);

  // Replace jar safely
  if (fs.existsSync(jarPath)) {
    fs.copyFileSync(jarPath, backupJarPath);
  }
  fs.renameSync(tempJarPath, jarPath);

  // Write version file
  fs.writeFileSync(VERSION_FILE, `${version} ${targetBuild.build}`, "utf8");

  log.info(`Successfully updated Paper to ${version} build ${targetBuild.build}`);
  return { ok: true, version, build: targetBuild.build, restartRequired: true };
}

export async function getAvailableUpdates() {
  const current = await getCurrentVersion();
  const versions = await listPaperVersions();
  const latestVersion = versions[0] || current.version;
  const builds = await listBuildsForVersion(latestVersion);
  const latestBuild = builds[0]?.build || current.build;

  const updateAvailable = latestVersion !== current.version || Number(latestBuild) > Number(current.build);

  return {
    currentVersion: current.version,
    currentBuild: current.build,
    latestVersion,
    latestBuild,
    updateAvailable,
  };
}
