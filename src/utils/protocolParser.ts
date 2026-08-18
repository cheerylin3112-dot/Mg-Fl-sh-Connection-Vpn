import { VPNServer, ProtocolType, TransportType, TlsType, ParsedConfig } from '../types';

/**
 * Universal VPN & Proxy Protocol Parser and Generator
 * Supports: VLESS, VMess, Trojan, Shadowsocks, SOCKS5, HTTP/HTTPS Proxy, SSH Tunnel, DNS Tunnel, WireGuard, V2Ray JSON
 */

export function parseVpnLink(raw: string): ParsedConfig {
  const trimmed = raw.trim();

  try {
    // 1. VLESS Protocol: vless://uuid@host:port?param=value#name
    if (trimmed.startsWith('vless://')) {
      return parseVlessUri(trimmed);
    }

    // 2. VMess Protocol: vmess://base64EncodedJson
    if (trimmed.startsWith('vmess://')) {
      return parseVmessUri(trimmed);
    }

    // 3. Trojan Protocol: trojan://password@host:port?param=value#name
    if (trimmed.startsWith('trojan://')) {
      return parseTrojanUri(trimmed);
    }

    // 4. Shadowsocks Protocol: ss://base64@host:port#name or ss://base64
    if (trimmed.startsWith('ss://')) {
      return parseShadowsocksUri(trimmed);
    }

    // 5. SOCKS5 Proxy: socks5://user:pass@host:port or socks5://host:port#name
    if (trimmed.startsWith('socks5://') || trimmed.startsWith('socks://')) {
      return parseSocks5Uri(trimmed);
    }

    // 6. HTTP / HTTPS Proxy: http://user:pass@host:port
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      // Check if it's a proxy link or subscription link
      return parseHttpProxyUri(trimmed);
    }

    // 7. SSH Tunnel: ssh://user:pass@host:port
    if (trimmed.startsWith('ssh://')) {
      return parseSshUri(trimmed);
    }

    // 8. DNS Tunnel / SlowDNS: dns://pubkey:nameserver@domain
    if (trimmed.startsWith('dns://') || trimmed.startsWith('slowdns://')) {
      return parseSlowDnsUri(trimmed);
    }

    // 9. Raw JSON configuration
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return parseV2rayJson(trimmed);
    }

    // 10. HTTP Injector / NetMod Payload Block
    if (trimmed.includes('[SSH_CONFIG]') || trimmed.includes('[PAYLOAD]') || trimmed.includes('HTTP/1.1')) {
      return parsePayloadConfig(trimmed);
    }

    return {
      valid: false,
      protocol: 'vless',
      rawInput: raw,
      name: 'Unknown Configuration',
      server: '',
      port: 0,
      transport: 'tcp',
      tlsType: 'none',
      error: 'Unrecognized protocol schema. Expected vless://, vmess://, trojan://, ss://, socks5://, ssh://, or JSON format.'
    };
  } catch (err: any) {
    return {
      valid: false,
      protocol: 'vless',
      rawInput: raw,
      name: 'Parse Error',
      server: '',
      port: 0,
      transport: 'tcp',
      tlsType: 'none',
      error: err?.message || 'Failed to parse configuration string.'
    };
  }
}

function parseVlessUri(uri: string): ParsedConfig {
  const url = new URL(uri);
  const uuid = url.username;
  const server = url.hostname;
  const port = parseInt(url.port) || 443;
  const name = decodeURIComponent(url.hash ? url.hash.substring(1) : `${server}:${port}`);
  
  const searchParams = url.searchParams;
  const transport = (searchParams.get('type') as TransportType) || 'ws';
  const security = searchParams.get('security');
  const tlsType: TlsType = security === 'reality' ? 'reality' : security === 'tls' ? 'tls' : 'none';
  const sni = searchParams.get('sni') || searchParams.get('host') || undefined;
  const path = searchParams.get('path') || undefined;
  const serviceName = searchParams.get('serviceName') || undefined;
  const publicKey = searchParams.get('pbk') || undefined;
  const shortId = searchParams.get('sid') || undefined;
  const flow = searchParams.get('flow') || undefined;

  return {
    valid: true,
    protocol: 'vless',
    rawInput: uri,
    name,
    server,
    port,
    uuid,
    transport,
    tlsType,
    sni,
    path,
    serviceName,
    publicKey,
    shortId,
    flow
  };
}

function parseVmessUri(uri: string): ParsedConfig {
  const b64 = uri.replace('vmess://', '').trim();
  let jsonStr = '';
  try {
    jsonStr = atob(b64);
  } catch {
    jsonStr = decodeURIComponent(escape(atob(b64)));
  }

  const data = JSON.parse(jsonStr);
  const server = data.add || data.host || '';
  const port = parseInt(data.port) || 443;
  const uuid = data.id || '';
  const name = data.ps || `${server}:${port}`;
  const net = (data.net as TransportType) || 'ws';
  const tlsType: TlsType = data.tls === 'tls' ? 'tls' : 'none';
  const path = data.path || undefined;
  const sni = data.sni || data.host || undefined;

  return {
    valid: true,
    protocol: 'vmess',
    rawInput: uri,
    name,
    server,
    port,
    uuid,
    transport: net,
    tlsType,
    path,
    sni,
  };
}

function parseTrojanUri(uri: string): ParsedConfig {
  const url = new URL(uri);
  const password = url.username || url.password;
  const server = url.hostname;
  const port = parseInt(url.port) || 443;
  const name = decodeURIComponent(url.hash ? url.hash.substring(1) : `Trojan-${server}`);
  
  const searchParams = url.searchParams;
  const transport = (searchParams.get('type') as TransportType) || 'tcp';
  const security = searchParams.get('security');
  const tlsType: TlsType = security === 'none' ? 'none' : 'tls';
  const sni = searchParams.get('sni') || searchParams.get('peer') || undefined;
  const path = searchParams.get('path') || undefined;
  const serviceName = searchParams.get('serviceName') || undefined;

  return {
    valid: true,
    protocol: 'trojan',
    rawInput: uri,
    name,
    server,
    port,
    password,
    transport,
    tlsType,
    sni,
    path,
    serviceName
  };
}

function parseShadowsocksUri(uri: string): ParsedConfig {
  const clean = uri.replace('ss://', '');
  let name = 'Shadowsocks Node';
  let body = clean;

  if (clean.includes('#')) {
    const parts = clean.split('#');
    body = parts[0];
    name = decodeURIComponent(parts[1]);
  }

  let server = '';
  let port = 8388;
  let method = 'aes-256-gcm';
  let password = '';

  if (body.includes('@')) {
    // Format: ss://base64(method:pass)@host:port
    const [authPart, hostPart] = body.split('@');
    const [host, portStr] = hostPart.split(':');
    server = host;
    port = parseInt(portStr) || 8388;

    try {
      const decodedAuth = atob(authPart);
      const [m, p] = decodedAuth.split(':');
      method = m;
      password = p;
    } catch {
      password = authPart;
    }
  } else {
    // Whole string is base64 encoded
    try {
      const decoded = atob(body);
      const [authPart, hostPart] = decoded.split('@');
      const [m, p] = authPart.split(':');
      const [h, portStr] = hostPart.split(':');
      method = m;
      password = p;
      server = h;
      port = parseInt(portStr) || 8388;
    } catch {
      server = body;
    }
  }

  return {
    valid: true,
    protocol: 'shadowsocks',
    rawInput: uri,
    name,
    server,
    port,
    ssMethod: method,
    password,
    transport: 'tcp',
    tlsType: 'none'
  };
}

function parseSocks5Uri(uri: string): ParsedConfig {
  const url = new URL(uri);
  return {
    valid: true,
    protocol: 'socks5',
    rawInput: uri,
    name: decodeURIComponent(url.hash ? url.hash.substring(1) : `SOCKS5-${url.hostname}`),
    server: url.hostname,
    port: parseInt(url.port) || 1080,
    uuid: url.username || undefined,
    password: url.password || undefined,
    transport: 'tcp',
    tlsType: 'none'
  };
}

function parseHttpProxyUri(uri: string): ParsedConfig {
  const url = new URL(uri);
  const isHttps = uri.startsWith('https://');
  return {
    valid: true,
    protocol: isHttps ? 'https-proxy' : 'http-proxy',
    rawInput: uri,
    name: decodeURIComponent(url.hash ? url.hash.substring(1) : `HTTP-Proxy-${url.hostname}`),
    server: url.hostname,
    port: parseInt(url.port) || (isHttps ? 443 : 8080),
    uuid: url.username || undefined,
    password: url.password || undefined,
    transport: 'tcp',
    tlsType: isHttps ? 'tls' : 'none',
    sni: isHttps ? url.hostname : undefined
  };
}

function parseSshUri(uri: string): ParsedConfig {
  const url = new URL(uri);
  return {
    valid: true,
    protocol: 'ssh',
    rawInput: uri,
    name: decodeURIComponent(url.hash ? url.hash.substring(1) : `SSH-${url.hostname}`),
    server: url.hostname,
    port: parseInt(url.port) || 22,
    uuid: url.username || 'root',
    password: url.password || undefined,
    transport: 'tcp',
    tlsType: url.searchParams.get('ssl') === '1' ? 'tls' : 'none',
    sni: url.searchParams.get('sni') || undefined,
    sshPayload: url.searchParams.get('payload') || undefined
  };
}

function parseSlowDnsUri(uri: string): ParsedConfig {
  // Format: dns://pubkey@nameserver:53/domain#name
  const clean = uri.replace('dns://', '').replace('slowdns://', '');
  return {
    valid: true,
    protocol: 'slowdns',
    rawInput: uri,
    name: 'SlowDNS Tunnel Node',
    server: clean.split('@')[1]?.split(':')[0] || '8.8.8.8',
    port: 53,
    publicKey: clean.split('@')[0] || undefined,
    transport: 'tcp',
    tlsType: 'none'
  };
}

function parseV2rayJson(jsonStr: string): ParsedConfig {
  const config = JSON.parse(jsonStr);
  const outbound = config.outbounds?.[0];
  if (!outbound) {
    throw new Error('Invalid V2Ray JSON: No outbounds found');
  }

  const proto = (outbound.protocol as ProtocolType) || 'vless';
  const vnext = outbound.settings?.vnext?.[0];
  const server = vnext?.address || '127.0.0.1';
  const port = vnext?.port || 443;
  const user = vnext?.users?.[0];
  const uuid = user?.id;
  const flow = user?.flow;
  const stream = outbound.streamSettings || {};
  const transport = (stream.network as TransportType) || 'tcp';
  const security = stream.security;
  const tlsType: TlsType = security === 'reality' ? 'reality' : security === 'tls' ? 'tls' : 'none';
  const sni = stream.tlsSettings?.serverName || stream.realitySettings?.serverName;
  const publicKey = stream.realitySettings?.publicKey;
  const shortId = stream.realitySettings?.shortId;
  const path = stream.wsSettings?.path;

  return {
    valid: true,
    protocol: proto,
    rawInput: jsonStr,
    name: `Xray-${proto.toUpperCase()}-${server}`,
    server,
    port,
    uuid,
    flow,
    transport,
    tlsType,
    sni,
    publicKey,
    shortId,
    path
  };
}

function parsePayloadConfig(payloadText: string): ParsedConfig {
  const lines = payloadText.split('\n');
  let host = '127.0.0.1';
  let port = 22;
  let user = 'user';
  let pass = '';
  let sni = '';

  for (const line of lines) {
    const [k, v] = line.split('=').map((s) => s.trim());
    if (k?.toLowerCase() === 'host') host = v;
    if (k?.toLowerCase() === 'port') port = parseInt(v) || 22;
    if (k?.toLowerCase() === 'username') user = v;
    if (k?.toLowerCase() === 'password') pass = v;
    if (k?.toLowerCase() === 'sni_host') sni = v;
  }

  return {
    valid: true,
    protocol: 'http-custom',
    rawInput: payloadText,
    name: `HTTP-Custom-${host}`,
    server: host,
    port: port,
    uuid: user,
    password: pass,
    sni: sni,
    transport: 'ws',
    tlsType: 'tls',
    sshPayload: payloadText
  };
}

/**
 * Generate shareable URI string for any VPN Server
 */
export function generateShareableUri(server: VPNServer): string {
  const nameEncoded = encodeURIComponent(server.name);

  if (server.protocol === 'vless') {
    const params = new URLSearchParams();
    params.set('type', server.transport);
    params.set('security', server.tlsType);
    if (server.sni) params.set('sni', server.sni);
    if (server.path) params.set('path', server.path);
    if (server.serviceName) params.set('serviceName', server.serviceName);
    if (server.publicKey) params.set('pbk', server.publicKey);
    if (server.shortId) params.set('sid', server.shortId);
    if (server.flow) params.set('flow', server.flow);
    if (server.fingerprint) params.set('fp', server.fingerprint);

    return `vless://${server.uuid || 'e7136f40-362d-4c38-897b-944a17684a0d'}@${server.host}:${server.port}?${params.toString()}#${nameEncoded}`;
  }

  if (server.protocol === 'vmess') {
    const vmessData = {
      v: '2',
      ps: server.name,
      add: server.host,
      port: server.port,
      id: server.uuid || 'e7136f40-362d-4c38-897b-944a17684a0d',
      aid: server.alterId || 0,
      scy: server.security || 'auto',
      net: server.transport,
      type: 'none',
      host: server.sni || '',
      path: server.path || '',
      tls: server.tlsType === 'none' ? '' : server.tlsType,
      sni: server.sni || ''
    };
    return `vmess://${btoa(JSON.stringify(vmessData))}`;
  }

  if (server.protocol === 'trojan') {
    const params = new URLSearchParams();
    params.set('type', server.transport);
    params.set('security', server.tlsType);
    if (server.sni) params.set('sni', server.sni);
    if (server.path) params.set('path', server.path);
    if (server.serviceName) params.set('serviceName', server.serviceName);
    return `trojan://${server.password || 'ApexTrojan2026!'}@${server.host}:${server.port}?${params.toString()}#${nameEncoded}`;
  }

  if (server.protocol === 'shadowsocks') {
    const auth = btoa(`${server.ssMethod || 'aes-256-gcm'}:${server.ssPassword || 'ApexPass2026!'}`);
    return `ss://${auth}@${server.host}:${server.port}#${nameEncoded}`;
  }

  if (server.protocol === 'socks5') {
    return `socks5://${server.uuid || 'apex'}:${server.password || 'secret'}@${server.host}:${server.port}#${nameEncoded}`;
  }

  if (server.protocol === 'ssh' || server.protocol === 'http-custom') {
    return `ssh://${server.sshUsername || 'root'}:${server.sshPassword || 'ApexPass2026!'}@${server.host}:${server.port}?ssl=1&sni=${encodeURIComponent(server.sshSniBugHost || 'm.youtube.com')}#${nameEncoded}`;
  }

  if (server.protocol === 'wireguard') {
    return `wireguard://${server.host}:${server.port}?pubkey=${encodeURIComponent(server.publicKey || 'aPx+WG01+7vGz9L2XQ0kNm4P1wR8tYcE6b3J=')}#${nameEncoded}`;
  }

  return `vless://${server.uuid || 'e7136f40-362d-4c38-897b-944a17684a0d'}@${server.host}:${server.port}#${nameEncoded}`;
}

/**
 * Generate full Xray-Core JSON client configuration
 */
export function generateClientJson(server: VPNServer): string {
  const isVless = server.protocol === 'vless';
  const isTrojan = server.protocol === 'trojan';
  const isVmess = server.protocol === 'vmess';

  const outboundProto = isVless ? 'vless' : isTrojan ? 'trojan' : isVmess ? 'vmess' : 'shadowsocks';

  const streamSettings: any = {
    network: server.transport,
    security: server.tlsType,
  };

  if (server.tlsType === 'tls') {
    streamSettings.tlsSettings = {
      serverName: server.sni || server.host,
      allowInsecure: false,
      fingerprint: server.fingerprint || 'chrome'
    };
  } else if (server.tlsType === 'reality') {
    streamSettings.realitySettings = {
      serverName: server.sni || 'www.cloudflare.com',
      fingerprint: server.fingerprint || 'chrome',
      show: false,
      publicKey: server.publicKey || '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      shortId: server.shortId || '6ba7b810',
      spiderX: '/'
    };
  }

  if (server.transport === 'ws') {
    streamSettings.wsSettings = {
      path: server.path || '/apex-v2ray-ws',
      headers: { Host: server.sni || server.host }
    };
  } else if (server.transport === 'grpc') {
    streamSettings.grpcSettings = {
      serviceName: server.serviceName || 'apex-grpc',
      multiMode: true
    };
  }

  const outboundSettings: any = {};
  if (isVless) {
    outboundSettings.vnext = [
      {
        address: server.host,
        port: server.port,
        users: [
          {
            id: server.uuid || 'e7136f40-362d-4c38-897b-944a17684a0d',
            encryption: 'none',
            flow: server.flow || undefined,
            level: 8
          }
        ]
      }
    ];
  } else if (isVmess) {
    outboundSettings.vnext = [
      {
        address: server.host,
        port: server.port,
        users: [
          {
            id: server.uuid || 'e7136f40-362d-4c38-897b-944a17684a0d',
            alterId: server.alterId || 0,
            security: server.security || 'auto',
            level: 8
          }
        ]
      }
    ];
  } else if (isTrojan) {
    outboundSettings.servers = [
      {
        address: server.host,
        port: server.port,
        password: server.password || 'ApexTrojan2026!',
        level: 8
      }
    ];
  }

  const fullConfig = {
    log: { loglevel: 'warning' },
    dns: {
      servers: [server.dnsResolver || '1.1.1.1', '8.8.8.8', 'localhost']
    },
    inbounds: [
      {
        tag: 'socks',
        port: 10808,
        listen: '127.0.0.1',
        protocol: 'socks',
        settings: { auth: 'noauth', udp: true },
        sniffing: { enabled: true, destOverride: ['http', 'tls'] }
      },
      {
        tag: 'http',
        port: 10809,
        listen: '127.0.0.1',
        protocol: 'http',
        settings: { timeout: 300 }
      }
    ],
    outbounds: [
      {
        tag: 'proxy',
        protocol: outboundProto,
        settings: outboundSettings,
        streamSettings: streamSettings
      },
      { tag: 'direct', protocol: 'freedom', settings: {} },
      { tag: 'block', protocol: 'blackhole', settings: {} }
    ]
  };

  return JSON.stringify(fullConfig, null, 2);
}
