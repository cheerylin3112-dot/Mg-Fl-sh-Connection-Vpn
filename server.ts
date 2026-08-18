import express, { Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { VPNServer, User, UserGroup, SubscriptionSource, ParsedConfig, ProtocolType, TransportType, TlsType } from "./src/types";

// Initial seed servers supporting VLESS Reality, VMess WS, Trojan gRPC, Shadowsocks, SSH, WireGuard, and SlowDNS
const INITIAL_SERVERS: VPNServer[] = [
  {
    id: "srv-us-vless-01",
    name: "US East - VLESS Reality (DPI Bypass)",
    host: "198.51.100.45",
    port: 443,
    protocol: "vless",
    country: "United States",
    countryCode: "US",
    city: "New York",
    flag: "🇺🇸",
    virtualIp: "10.88.1.12",
    ping: 18,
    load: 35,
    tier: "vip",
    allowedGroups: ["all", "vip_tier", "pro_tier"],
    enabled: true,
    online: true,
    transport: "ws",
    tlsType: "reality",
    tags: ["fastest", "streaming", "anti_dpi"],
    uuid: "a8e1b8c2-4f32-4d1a-982e-9876543210ab",
    flow: "xtls-rprx-vision",
    sni: "www.cloudflare.com",
    publicKey: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    shortId: "6ba7b810",
    fingerprint: "chrome",
    path: "/apex-vless-ws",
    provider: "Apex Cloud NYC-1",
    bandwidthGbps: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-de-vmess-02",
    name: "Germany - Frankfurt VMess WS+TLS",
    host: "194.187.249.12",
    port: 443,
    protocol: "vmess",
    country: "Germany",
    countryCode: "DE",
    city: "Frankfurt",
    flag: "🇩🇪",
    virtualIp: "10.88.2.33",
    ping: 22,
    load: 42,
    tier: "pro",
    allowedGroups: ["all", "vip_tier", "pro_tier", "free_tier"],
    enabled: true,
    online: true,
    transport: "ws",
    tlsType: "tls",
    tags: ["fastest", "p2p", "gaming"],
    uuid: "b2c3d4e5-f6a7-48b9-bc0d-1e2f3a4b5c6d",
    alterId: 0,
    security: "auto",
    sni: "de-gateway.apex-mesh.net",
    path: "/apex-vmess-ws",
    provider: "DE-CIX Frankfurt MegaNode",
    bandwidthGbps: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-jp-trojan-03",
    name: "Japan - Tokyo Trojan gRPC Ultra",
    host: "103.102.166.2",
    port: 443,
    protocol: "trojan",
    country: "Japan",
    countryCode: "JP",
    city: "Tokyo",
    flag: "🇯🇵",
    virtualIp: "10.88.3.45",
    ping: 48,
    load: 55,
    tier: "vip",
    allowedGroups: ["all", "vip_tier", "pro_tier"],
    enabled: true,
    online: true,
    transport: "grpc",
    tlsType: "tls",
    tags: ["streaming", "gaming"],
    password: "ApexTrojanTokyo2026!",
    sni: "jp-edge.apex-mesh.net",
    serviceName: "apex-trojan-grpc",
    provider: "Equinix Tokyo TY2",
    bandwidthGbps: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-sg-ss-04",
    name: "Singapore - Shadowsocks 2022 AEAD",
    host: "139.99.120.78",
    port: 8388,
    protocol: "shadowsocks",
    country: "Singapore",
    countryCode: "SG",
    city: "Singapore",
    flag: "🇸🇬",
    virtualIp: "10.88.4.88",
    ping: 39,
    load: 40,
    tier: "free",
    allowedGroups: ["all", "free_tier", "pro_tier", "vip_tier"],
    enabled: true,
    online: true,
    transport: "tcp",
    tlsType: "none",
    tags: ["fastest", "p2p"],
    ssMethod: "aes-256-gcm",
    ssPassword: "ApexSecretPassSG2026",
    provider: "SingTel Apex Gateway",
    bandwidthGbps: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-gb-ssh-05",
    name: "UK London - SSH WebSocket (HTTP Custom)",
    host: "185.120.45.19",
    port: 22,
    protocol: "ssh",
    country: "United Kingdom",
    countryCode: "GB",
    city: "London",
    flag: "🇬🇧",
    virtualIp: "10.88.5.19",
    ping: 28,
    load: 30,
    tier: "pro",
    allowedGroups: ["all", "free_tier", "pro_tier", "vip_tier"],
    enabled: true,
    online: true,
    transport: "ws",
    tlsType: "tls",
    tags: ["zero_rate", "anti_dpi"],
    sshUsername: "apex_user",
    sshPassword: "ApexPassLondon2026!",
    sshSniBugHost: "m.youtube.com",
    sshPayload: "GET / HTTP/1.1[crlf]Host: 185.120.45.19[crlf]Upgrade: websocket[crlf]Connection: Upgrade[crlf][crlf]",
    provider: "Apex London Docklands-1",
    bandwidthGbps: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-ch-wg-06",
    name: "Switzerland - WireGuard Privacy Vault",
    host: "179.43.155.8",
    port: 51820,
    protocol: "wireguard",
    country: "Switzerland",
    countryCode: "CH",
    city: "Zurich",
    flag: "🇨🇭",
    virtualIp: "10.88.6.14",
    ping: 25,
    load: 18,
    tier: "ultra",
    allowedGroups: ["all", "vip_tier"],
    enabled: true,
    online: true,
    transport: "tcp",
    tlsType: "none",
    tags: ["tor", "p2p"],
    publicKey: "aPx+CHZURICH+7vGz9L2XQ0kNm4P1wR8tYcE6b3J=",
    provider: "Swiss Alpine Zero-Log Bunker",
    bandwidthGbps: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-br-slowdns-07",
    name: "Brazil - SlowDNS Tunnel (Zero-Balance)",
    host: "177.54.144.9",
    port: 53,
    protocol: "slowdns",
    country: "Brazil",
    countryCode: "BR",
    city: "São Paulo",
    flag: "🇧🇷",
    virtualIp: "10.88.7.99",
    ping: 95,
    load: 62,
    tier: "free",
    allowedGroups: ["all", "free_tier"],
    enabled: true,
    online: true,
    transport: "tcp",
    tlsType: "none",
    tags: ["zero_rate"],
    dnsDomain: "ns1.apex-dns.net",
    dnsPublicKey: "7d8e9f0a1b2c3d4e5f6a",
    provider: "Apex LATAM Core",
    bandwidthGbps: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Initial Users
const USERS_DB: User[] = [
  {
    id: "user-admin-01",
    username: "admin",
    email: "admin@apexvpn.net",
    role: "admin",
    tier: "enterprise",
    createdAt: new Date().toISOString(),
    token: "apex_admin_token_secure_999",
  },
  {
    id: "user-vip-02",
    username: "vip_user",
    email: "vip@example.com",
    role: "user",
    tier: "vip_tier",
    createdAt: new Date().toISOString(),
    token: "apex_vip_token_888",
  },
  {
    id: "user-free-03",
    username: "free_user",
    email: "free@example.com",
    role: "user",
    tier: "free_tier",
    createdAt: new Date().toISOString(),
    token: "apex_free_token_777",
  }
];

// Initial User Groups
const USER_GROUPS: UserGroup[] = [
  { id: "all", name: "Public (All Users)", description: "Accessible to any verified user or free plan", tier: "free_tier", maxBandwidthGb: 50, serverCount: 7 },
  { id: "free_tier", name: "Free Tier Users", description: "Standard community servers with ad support", tier: "free_tier", maxBandwidthGb: 20, serverCount: 3 },
  { id: "vip_tier", name: "VIP Ultra Speed", description: "High-speed 10Gbps VLESS Reality & Trojan servers", tier: "vip_tier", maxBandwidthGb: 500, serverCount: 6 },
  { id: "pro_tier", name: "Pro Gaming & P2P", description: "Low-latency optimized servers with WireGuard", tier: "pro_tier", maxBandwidthGb: 200, serverCount: 5 },
];

// Initial Subscriptions
const SUBSCRIPTIONS_DB: SubscriptionSource[] = [
  {
    id: "sub-global-vip",
    name: "Apex VIP Global Nodes (VLESS + Trojan)",
    token: "sub_vip_apex_98234",
    description: "Official VIP auto-updating node subscription for Android and Desktop clients",
    allowedTier: "vip_tier",
    serverIds: ["srv-us-vless-01", "srv-de-vmess-02", "srv-jp-trojan-03", "srv-ch-wg-06"],
    enabled: true,
    expireDate: "2027-12-31",
    totalTrafficGb: 500,
    usedTrafficGb: 42.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-free-community",
    name: "Apex Free Community Pack",
    token: "sub_free_apex_11223",
    description: "Free public server nodes with auto failover",
    allowedTier: "free_tier",
    serverIds: ["srv-de-vmess-02", "srv-sg-ss-04", "srv-gb-ssh-05", "srv-br-slowdns-07"],
    enabled: true,
    expireDate: "2027-12-31",
    totalTrafficGb: 100,
    usedTrafficGb: 18.2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// In-Memory mutable storage
let serversStore = [...INITIAL_SERVERS];
let usersStore = [...USERS_DB];
let subscriptionsStore = [...SUBSCRIPTIONS_DB];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // AUTHENTICATION API
  // ==========================================

  // Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    let user = usersStore.find((u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());

    if (!user) {
      // Auto-register demo test accounts
      const isNamedAdmin = username.toLowerCase().includes("admin");
      user = {
        id: `user-${Date.now()}`,
        username: username,
        email: `${username}@apexvpn.net`,
        role: isNamedAdmin ? "admin" : "user",
        tier: isNamedAdmin ? "enterprise" : "vip_tier",
        createdAt: new Date().toISOString(),
        token: `apex_${crypto.randomBytes(16).toString("hex")}`,
      };
      usersStore.push(user);
    }

    res.json({
      success: true,
      user,
      token: user.token,
    });
  });

  // Register
  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { username, email, tier } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    const existing = usersStore.find((u) => u.username === username || u.email === email);
    if (existing) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      email,
      role: "user",
      tier: (tier as any) || "free_tier",
      createdAt: new Date().toISOString(),
      token: `apex_${crypto.randomBytes(16).toString("hex")}`,
    };

    usersStore.push(newUser);
    res.json({ success: true, user: newUser, token: newUser.token });
  });

  // Get current user profile
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ authenticated: false, user: null });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const user = usersStore.find((u) => u.token === token);
    if (!user) {
      return res.json({ authenticated: false, user: null });
    }

    res.json({ authenticated: true, user });
  });

  // ==========================================
  // USER SERVER SYNCHRONIZATION API
  // ==========================================

  // Sync servers authorized for current user
  app.get("/api/servers/sync", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    let userTier = "free_tier";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "").trim();
      const user = usersStore.find((u) => u.token === token);
      if (user) {
        userTier = user.tier;
        if (user.role === "admin") {
          // Admin gets all servers including disabled ones
          return res.json({
            success: true,
            syncedAt: new Date().toISOString(),
            serverCount: serversStore.length,
            servers: serversStore,
          });
        }
      }
    }

    // Filter enabled servers published for the user's tier or group
    const publishedServers = serversStore.filter((s) => {
      if (!s.enabled) return false;
      if (s.allowedGroups.includes("all")) return true;
      if (s.allowedGroups.includes(userTier)) return true;
      if (userTier === "vip_tier" || userTier === "enterprise") return true;
      return false;
    });

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      serverCount: publishedServers.length,
      servers: publishedServers,
    });
  });

  // ==========================================
  // ADMIN SERVER MANAGEMENT API
  // ==========================================

  // List all servers (Admin)
  app.get("/api/admin/servers", (req: Request, res: Response) => {
    res.json({
      success: true,
      servers: serversStore,
      totalCount: serversStore.length,
      onlineCount: serversStore.filter((s) => s.online && s.enabled).length,
    });
  });

  // Create new server (Admin)
  app.post("/api/admin/servers", (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.host || !data.port || !data.protocol) {
      return res.status(400).json({ error: "Missing required fields (name, host, port, protocol)" });
    }

    const newServer: VPNServer = {
      id: `srv-${Date.now()}`,
      name: data.name,
      host: data.host,
      port: parseInt(data.port) || 443,
      protocol: data.protocol,
      country: data.country || "Global",
      countryCode: data.countryCode || "UN",
      city: data.city || "Gateway",
      flag: data.flag || "🌐",
      virtualIp: data.virtualIp || `10.88.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`,
      ping: parseInt(data.ping) || Math.floor(Math.random() * 40) + 15,
      load: parseInt(data.load) || Math.floor(Math.random() * 50) + 10,
      tier: data.tier || "pro",
      allowedGroups: data.allowedGroups || ["all"],
      enabled: data.enabled !== undefined ? data.enabled : true,
      online: true,
      transport: data.transport || "ws",
      tlsType: data.tlsType || "tls",
      tags: data.tags || ["fastest"],
      uuid: data.uuid || crypto.randomUUID(),
      password: data.password,
      alterId: data.alterId || 0,
      security: data.security || "auto",
      flow: data.flow,
      sni: data.sni || data.host,
      publicKey: data.publicKey,
      shortId: data.shortId,
      fingerprint: data.fingerprint || "chrome",
      path: data.path || "/apex-ws",
      serviceName: data.serviceName,
      sshUsername: data.sshUsername,
      sshPassword: data.sshPassword,
      sshPayload: data.sshPayload,
      sshSniBugHost: data.sshSniBugHost,
      ssMethod: data.ssMethod,
      ssPassword: data.ssPassword,
      dnsResolver: data.dnsResolver || "1.1.1.1",
      dnsDomain: data.dnsDomain,
      dnsPublicKey: data.dnsPublicKey,
      provider: data.provider || "Apex Private Edge",
      bandwidthGbps: parseInt(data.bandwidthGbps) || 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serversStore.unshift(newServer);
    res.json({ success: true, server: newServer });
  });

  // Update server (Admin)
  app.put("/api/admin/servers/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const index = serversStore.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Server not found" });
    }

    serversStore[index] = {
      ...serversStore[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json({ success: true, server: serversStore[index] });
  });

  // Delete server (Admin)
  app.delete("/api/admin/servers/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    serversStore = serversStore.filter((s) => s.id !== id);
    res.json({ success: true, message: "Server deleted" });
  });

  // Toggle server active/disabled (Admin)
  app.post("/api/admin/servers/:id/toggle", (req: Request, res: Response) => {
    const { id } = req.params;
    const server = serversStore.find((s) => s.id === id);
    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    server.enabled = !server.enabled;
    server.updatedAt = new Date().toISOString();
    res.json({ success: true, server });
  });

  // Test Ping / Availability (Admin)
  app.post("/api/admin/servers/:id/ping", (req: Request, res: Response) => {
    const { id } = req.params;
    const server = serversStore.find((s) => s.id === id);
    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    // Simulated latency test against edge node
    const simulatedPing = Math.floor(Math.random() * 45) + 12;
    const simulatedLoad = Math.floor(Math.random() * 60) + 10;
    server.ping = simulatedPing;
    server.load = simulatedLoad;
    server.online = true;
    server.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      server,
      latencyMs: simulatedPing,
      loadPercent: simulatedLoad,
      packetLossPercent: 0,
    });
  });

  // Bulk import links (Admin)
  app.post("/api/admin/bulk-import", (req: Request, res: Response) => {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "No import content provided" });
    }

    const lines = rawText.split("\n");
    let importedCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        let protocol: ProtocolType = "vless";
        if (trimmed.startsWith("vmess://")) protocol = "vmess";
        else if (trimmed.startsWith("trojan://")) protocol = "trojan";
        else if (trimmed.startsWith("ss://")) protocol = "shadowsocks";
        else if (trimmed.startsWith("ssh://")) protocol = "ssh";

        const newSrv: VPNServer = {
          id: `srv-import-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: `Imported Node ${importedCount + 1}`,
          host: "104.21.45.10",
          port: 443,
          protocol: protocol,
          country: "United States",
          countryCode: "US",
          city: "Global Edge",
          flag: "🌐",
          virtualIp: `10.88.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`,
          ping: Math.floor(Math.random() * 35) + 15,
          load: Math.floor(Math.random() * 40) + 10,
          tier: "pro",
          allowedGroups: ["all"],
          enabled: true,
          online: true,
          transport: "ws",
          tlsType: "tls",
          tags: ["fastest"],
          uuid: crypto.randomUUID(),
          sni: "cloudflare.com",
          path: "/ws",
          provider: "Imported Feed Node",
          bandwidthGbps: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        serversStore.unshift(newSrv);
        importedCount++;
      } catch (e) {
        // continue
      }
    }

    res.json({ success: true, importedCount, totalServers: serversStore.length });
  });

  // ==========================================
  // SUBSCRIPTION SYSTEM API
  // ==========================================

  // Admin list subscriptions
  app.get("/api/admin/subscriptions", (req: Request, res: Response) => {
    res.json({ success: true, subscriptions: subscriptionsStore });
  });

  // Admin create subscription
  app.post("/api/admin/subscriptions", (req: Request, res: Response) => {
    const { name, description, allowedTier, serverIds } = req.body;
    const newSub: SubscriptionSource = {
      id: `sub-${Date.now()}`,
      name: name || "Custom Subscription",
      token: `sub_${crypto.randomBytes(8).toString("hex")}`,
      description: description || "Auto generated subscription feed",
      allowedTier: allowedTier || "all",
      serverIds: serverIds || serversStore.map((s) => s.id),
      enabled: true,
      expireDate: "2027-12-31",
      totalTrafficGb: 500,
      usedTrafficGb: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subscriptionsStore.push(newSub);
    res.json({ success: true, subscription: newSub });
  });

  // Public Base64 Subscription Endpoint (For v2rayNG, Matsuri, Shadowrocket, Clash)
  app.get("/api/subscription/:token", (req: Request, res: Response) => {
    const { token } = req.params;
    const sub = subscriptionsStore.find((s) => s.token === token && s.enabled);

    const relevantServers = sub
      ? serversStore.filter((s) => sub.serverIds.includes(s.id) && s.enabled)
      : serversStore.filter((s) => s.enabled);

    // Format list of links
    const links = relevantServers.map((s) => {
      if (s.protocol === "vless") {
        return `vless://${s.uuid || "e7136f40-362d-4c38-897b-944a17684a0d"}@${s.host}:${s.port}?type=${s.transport}&security=${s.tlsType}&sni=${s.sni || s.host}&path=${encodeURIComponent(s.path || "/ws")}#${encodeURIComponent(s.name)}`;
      }
      if (s.protocol === "vmess") {
        const obj = {
          v: "2",
          ps: s.name,
          add: s.host,
          port: s.port,
          id: s.uuid || "e7136f40-362d-4c38-897b-944a17684a0d",
          aid: s.alterId || 0,
          net: s.transport,
          tls: s.tlsType === "none" ? "" : s.tlsType,
          sni: s.sni || s.host,
          path: s.path || "/ws",
        };
        return `vmess://${Buffer.from(JSON.stringify(obj)).toString("base64")}`;
      }
      if (s.protocol === "trojan") {
        return `trojan://${s.password || "ApexTrojan2026!"}@${s.host}:${s.port}?type=${s.transport}&security=${s.tlsType}&sni=${s.sni || s.host}#${encodeURIComponent(s.name)}`;
      }
      if (s.protocol === "shadowsocks") {
        const auth = Buffer.from(`${s.ssMethod || "aes-256-gcm"}:${s.ssPassword || "ApexPass2026!"}`).toString("base64");
        return `ss://${auth}@${s.host}:${s.port}#${encodeURIComponent(s.name)}`;
      }
      return `vless://${s.uuid || "e7136f40-362d-4c38-897b-944a17684a0d"}@${s.host}:${s.port}#${encodeURIComponent(s.name)}`;
    });

    const plainTextBody = links.join("\n");
    const base64Body = Buffer.from(plainTextBody).toString("base64");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Subscription-Userinfo", "upload=1073741824; download=4294967296; total=107374182400; expire=1800000000");
    res.send(base64Body);
  });

  // User Groups API
  app.get("/api/admin/groups", (req: Request, res: Response) => {
    res.json({ success: true, groups: USER_GROUPS });
  });

  // Overview stats
  app.get("/api/admin/stats", (req: Request, res: Response) => {
    res.json({
      success: true,
      totalServers: serversStore.length,
      activeServers: serversStore.filter((s) => s.enabled).length,
      totalUsers: usersStore.length,
      totalSubscriptions: subscriptionsStore.length,
      totalBandwidthGbps: serversStore.reduce((acc, s) => acc + (s.bandwidthGbps || 10), 0),
      avgLatencyMs: Math.round(serversStore.reduce((acc, s) => acc + s.ping, 0) / serversStore.length),
    });
  });

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", service: "ApexVPN Server Management API", time: new Date().toISOString() });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ApexVPN Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
