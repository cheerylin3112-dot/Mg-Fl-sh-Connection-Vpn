import { VPNServer, SecuritySettings, AndroidApkConfig } from '../types';
import QRCode from 'qrcode';

// Generate Mock WireGuard Keypairs
export function generateWireGuardKeys(): { privateKey: string; publicKey: string; presharedKey: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const genKey = (len: number = 43) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res + '=';
  };

  return {
    privateKey: genKey(43),
    publicKey: genKey(43),
    presharedKey: genKey(43),
  };
}

// Generate WireGuard .conf content
export function generateWireguardConfig(server: VPNServer, settings: SecuritySettings): string {
  const generatedKeys = generateWireGuardKeys();
  const dnsIp = settings.dnsProvider === 'cloudflare' ? '1.1.1.1' :
                settings.dnsProvider === 'google' ? '8.8.8.8' :
                (settings.customDnsIp || '1.1.1.1');
  const srvHost = server.host || (server as any).ip || '198.51.100.45';

  return `[Interface]
# Mg Flâsh Connection Profile for ${server.name}
PrivateKey = ${generatedKeys.privateKey}
Address = ${server.virtualIp}/32${settings.ipv6LeakProtection ? ', fd00::88:1/128' : ''}
DNS = ${dnsIp}
MTU = ${settings.mtuSize || 1420}

[Peer]
PublicKey = aPx+${(server.id || 'srv').toUpperCase()}+7vGz9L2XQ0kNm4P1wR8tYcE6b3J=
${generatedKeys.presharedKey ? `PresharedKey = ${generatedKeys.presharedKey}\n` : ''}Endpoint = ${srvHost}:51820
AllowedIPs = 0.0.0.0/0${settings.ipv6LeakProtection ? ', ::/0' : ''}
PersistentKeepalive = 25
`;
}

export function generateOpenVpnConfig(server: VPNServer, settings: SecuritySettings): string {
  const protocol = settings.protocol === 'openvpn-tcp' ? 'tcp-client' : 'udp';
  const port = settings.protocol === 'openvpn-tcp' ? 443 : 1194;
  const srvHost = server.host || (server as any).ip || '198.51.100.45';
  const dnsIp = settings.dnsProvider === 'cloudflare' ? '1.1.1.1' :
                settings.dnsProvider === 'google' ? '8.8.8.8' :
                (settings.customDnsIp || '1.1.1.1');

  return `# Mg Flâsh Connection OpenVPN Profile
client
dev tun
proto ${protocol}
remote ${srvHost} ${port}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA512
verb 3
mute 20
redirect-gateway def1
dhcp-option DNS ${dnsIp}
${settings.killSwitch ? 'block-outside-dns\n' : ''}
<ca>
-----BEGIN CERTIFICATE-----
MIIB/DCCAWWgAwIBAgIUQ0eYn7F4Zq3LpKm9v8WxN2j5t08wDQYJKoZIhvcNAQEL
BQAwDTELMAkGA1UEAwwCY2EwHhcNMjUwMTAxMDAwMDAwWhcNMzUwMTAxMDAwMDAw
WjANMQswCQYDVQQDDAJjYTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB
AMp9q8vN+7K1xY2mP9kR...[APEX-VPN-ROOT-CA]...
-----END CERTIFICATE-----
</ca>
<cert>
-----BEGIN CERTIFICATE-----
MIICBjCCAb8CFQCjF7x9L4k2P0mN8qW5z1yA3t8R7zANBgkqhkiG9w0BAQsFADAN
MQswCQYDVQQDDAJjYTAeFw0yNTAxMDEwMDAwMDBaFw0zNTAxMDEwMDAwMDBaMBcx
FTATBgNVBAMMDFZQTkNsaWVudDAxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA3...[APEX-CLIENT-CERT]...
-----END CERTIFICATE-----
</cert>
<key>
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD3fH+L8kX...
-----END PRIVATE KEY-----
</key>
`;
}

// Generate V2Ray VMess Link and JSON config
export function generateV2rayLink(server: VPNServer, settings: SecuritySettings): { vmessUri: string; vlessUri: string; jsonConfig: string } {
  const uuid = settings.v2ray?.uuid || server.uuid || 'e7136f40-362d-4c38-897b-944a17684a0d';
  const port = server.port || server.v2rayPort || settings.v2ray?.port || 443;
  const srvHost = server.host || (server as any).ip || '198.51.100.45';
  const sni = settings.v2ray?.sni || server.sni || `${server.id}.edge-gateway.apex-mesh.net`;
  const path = settings.v2ray?.path || server.path || '/apex-v2ray-ws';

  // VMess JSON representation
  const vmessObj = {
    v: '2',
    ps: `MgFlash-${server.city}-${server.countryCode}`,
    add: srvHost,
    port: port,
    id: uuid,
    aid: settings.v2ray?.alterId || 0,
    scy: settings.v2ray?.security || 'auto',
    net: settings.v2ray?.network || 'ws',
    type: 'none',
    host: sni,
    path: path,
    tls: settings.v2ray?.tls || 'tls',
    sni: sni,
  };

  const vmessUri = `vmess://${btoa(JSON.stringify(vmessObj))}`;
  const vlessUri = `vless://${uuid}@${srvHost}:${port}?encryption=none&security=tls&type=ws&host=${encodeURIComponent(sni)}&path=${encodeURIComponent(path)}#MgFlash-${server.city}`;

  const jsonConfig = JSON.stringify(
    {
      log: { loglevel: 'warning' },
      inbounds: [
        {
          port: 10808,
          listen: '127.0.0.1',
          protocol: 'socks',
          settings: { auth: 'noauth', udp: true },
          sniffing: { enabled: true, destOverride: ['http', 'tls'] }
        },
        {
          port: 10809,
          listen: '127.0.0.1',
          protocol: 'http',
          settings: { timeout: 300 }
        }
      ],
      outbounds: [
        {
          tag: 'proxy',
          protocol: 'vmess',
          settings: {
            vnext: [
              {
                address: srvHost,
                port: port,
                users: [
                  {
                    id: uuid,
                    alterId: settings.v2ray?.alterId || 0,
                    security: 'auto'
                  }
                ]
              }
            ]
          },
          streamSettings: {
            network: 'ws',
            security: 'tls',
            tlsSettings: {
              serverName: sni,
              allowInsecure: false
            },
            wsSettings: {
              path: path,
              headers: {
                Host: sni
              }
            }
          }
        },
        {
          tag: 'direct',
          protocol: 'freedom',
          settings: {}
        }
      ]
    },
    null,
    2
  );

  return { vmessUri, vlessUri, jsonConfig };
}

// Generate SSH Tunnel & WebSocket Injection configurations
export function generateSshTunnelConfig(server: VPNServer, settings: SecuritySettings): {
  bashCommand: string;
  httpCustomPayload: string;
  sshProfileText: string;
} {
  const username = settings.ssh?.username || server.sshUsername || 'apex_user';
  const password = settings.ssh?.password || server.sshPassword || 'ApexPass2026!';
  const port = server.port || server.sshPort || settings.ssh?.port || 22;
  const srvHost = server.host || (server as any).ip || '198.51.100.45';
  const sni = settings.ssh?.sniBugHost || server.sshSniBugHost || 'm.youtube.com';
  const rawPayload = settings.ssh?.payload || server.sshPayload || `GET / HTTP/1.1[crlf]Host: ${srvHost}[crlf]Upgrade: websocket[crlf]Connection: Upgrade[crlf][crlf]`;

  const bashCommand = `# OpenSSH Dynamic SOCKS5 Proxy via ${server.name}
ssh -N -D 1080 -p ${port} ${username}@${srvHost}

# Or SSH over SSL Stunnel (Port 443):
stunnel /etc/stunnel/apex-ssh.conf && ssh -N -D 1080 -p 443 ${username}@127.0.0.1`;

  const httpCustomPayload = `# HTTP Custom / Injector / NapsternetV SSH Payload
[SSH_CONFIG]
Host = ${srvHost}
Port = ${port}
Username = ${username}
Password = ${password}
SNI_Host = ${sni}
Mode = SSH_WEBSOCKET_SSL

[PAYLOAD]
${rawPayload}
`;

  const sshProfileText = `# Mg Flâsh Connection SSH Tunnel Client Profile
Host mgflash-${server.id}
    HostName ${srvHost}
    User ${username}
    Port ${port}
    DynamicForward 1080
    ServerAliveInterval 30
    ServerAliveCountMax 3
    Compression yes
    StrictHostKeyChecking no
`;

  return { bashCommand, httpCustomPayload, sshProfileText };
}

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#06b6d4', // cyan-500
        light: '#020617', // slate-950
      },
    });
  } catch {
    return '';
  }
}

// Aliases and manifest generator functions
export const generateWireGuardConfig = generateWireguardConfig;
export const generateKotlinVpnService = generateAndroidVpnServiceCode;

export function generateAndroidApkManifestSnippet(apkConfig: AndroidApkConfig, server: VPNServer): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${apkConfig.packageName}">

    <!-- Android VPN & Networking Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="${apkConfig.appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MgFlashVPN"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/Theme.MgFlashVPN">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Dedicated Android VpnService Declaration -->
        <service
            android:name=".service.ApexVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <intent-filter>
                <action android:name="android.net.VpnService" />
                <action android:name="${apkConfig.packageName}.CONNECT" />
                <action android:name="${apkConfig.packageName}.DISCONNECT" />
            </intent-filter>
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="VPN Tunnel routing through ${server.protocol.toUpperCase()}" />
        </service>

        <receiver
            android:name=".receiver.BootReceiver"
            android:exported="true"
            android:enabled="${apkConfig.enableAlwaysOn}">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`;
}

export function generateAndroidVpnServiceCode(apkConfig: AndroidApkConfig, server: VPNServer): string {
  const srvHost = server.host || (server as any).ip || '198.51.100.45';
  return `package ${apkConfig.packageName}.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import ${apkConfig.packageName}.MainActivity

/**
 * Mg Flâsh Connection Native Android VpnService Implementation
 * Supports WireGuard Go TUN, Xray-Core (V2Ray/VLESS), and SSH Tunneling
 */
class ApexVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunning: Boolean = false
    private val selectedProtocol = "${apkConfig.protocol}"

    companion object {
        const val ACTION_CONNECT = "${apkConfig.packageName}.CONNECT"
        const val ACTION_DISCONNECT = "${apkConfig.packageName}.DISCONNECT"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CONNECT -> establishTunnel()
            ACTION_DISCONNECT -> disconnectTunnel()
        }
        return START_STICKY
    }

    private fun establishTunnel() {
        if (isRunning) return
        isRunning = true

        val builder = Builder()
            .setSession("${apkConfig.appName} ($selectedProtocol)")
            .addAddress("${server.virtualIp}", 32)
            .addRoute("0.0.0.0", 0)
            .addDnsServer("${apkConfig.dnsResolver || '1.1.1.1'}")
            .setMtu(1420)
            .setBlocking(true)

        ${apkConfig.enableKillSwitch ? '// Strict System Kill Switch\n        builder.setUnderlyingNetworks(null)' : ''}

        // Initialize Native Core depending on Protocol
        when (selectedProtocol) {
            "v2ray" -> initV2RayCore("${srvHost}", ${server.port || server.v2rayPort || 443})
            "ssh" -> initSshTunnelCore("${srvHost}", ${server.port || server.sshPort || 22})
            else -> initWireguardTun()
        }

        vpnInterface = builder.establish()
        startForeground(1001, createNotification())
    }

    private fun initV2RayCore(host: String, port: Int) {
        // Starts embedded libv2ray.so Go mobile core
        // V2RayPoint.startLoop()
    }

    private fun initSshTunnelCore(host: String, port: Int) {
        // Starts JSch / LibSSH2 background daemon
    }

    private fun initWireguardTun() {
        // Starts WireGuard Go backend tunnel
    }

    private fun disconnectTunnel() {
        isRunning = false
        vpnInterface?.close()
        vpnInterface = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotification(): Notification {
        val channelId = "vpn_channel"
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(channelId, "VPN Active", NotificationManager.IMPORTANCE_LOW)
        manager.createNotificationChannel(channel)

        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)

        return Notification.Builder(this, channelId)
            .setContentTitle("${apkConfig.appName} Connected ($selectedProtocol)")
            .setContentText("Secured via ${server.name} (${srvHost})")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
}
`;
}
