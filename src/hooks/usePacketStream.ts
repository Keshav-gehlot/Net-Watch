import { useEffect, useMemo, useRef, useState } from "react";
import { Packet, AlertItem } from "@/types/network";

interface Options {
  simulate?: boolean;
  websocketUrl?: string; // e.g., ws://localhost:8765
}

const randomIp = () =>
  `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

const protocols = ["TCP", "UDP", "ICMP", "ARP"] as const;

function genPacket(): Packet {
  const proto = protocols[Math.floor(Math.random() * protocols.length)];
  const srcIp = randomIp();
  const dstIp = randomIp();
  const tcpudp = proto === "TCP" || proto === "UDP";
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    srcIp,
    dstIp,
    protocol: proto,
    srcPort: tcpudp ? Math.floor(Math.random() * 65535) : undefined,
    dstPort: tcpudp ? [80, 443, 53, 22, 123, 8080][Math.floor(Math.random() * 6)] : undefined,
    length: Math.floor(Math.random() * 1400) + 64,
    payloadPreview: Math.random() > 0.7 ? Math.random().toString(36).slice(2, 10) : undefined,
  };
}

export function usePacketStream({ simulate = true, websocketUrl }: Options) {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [pps, setPps] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Intrusion rules state
  const portHitsRef = useRef<Map<string, Set<number>>>(new Map());
  const recentCountsRef = useRef<Map<string, number>>(new Map());

  // Stats updater for PPS
  useEffect(() => {
    let lastCount = 0;
    const interval = setInterval(() => {
      const nowCount = packets.length;
      setPps(Math.max(0, nowCount - lastCount));
      lastCount = nowCount;
    }, 1000);
    return () => clearInterval(interval);
  }, [packets.length]);

  // Simulated generator
  useEffect(() => {
    if (!simulate) return;
    setConnected(true);
    const id = setInterval(() => {
      const burst = Math.random() < 0.1 ? 50 : Math.floor(Math.random() * 5) + 1; // occasional bursts
      const newPackets: Packet[] = Array.from({ length: burst }, () => genPacket());
      handleIncoming(newPackets);
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulate]);

  // WebSocket connection
  useEffect(() => {
    if (!websocketUrl) return;
    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const pkt: Packet = data;
        handleIncoming([pkt]);
      } catch (_) {}
    };
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websocketUrl]);

  function handleIncoming(newPackets: Packet[]) {
    setPackets((prev) => {
      const next = [...newPackets, ...prev].slice(0, 5000);
      runDetections(newPackets);
      return next;
    });
  }

  function addAlert(alert: AlertItem) {
    setAlerts((prev) => [alert, ...prev].slice(0, 500));
  }

  // Simple detections
  function runDetections(newPackets: Packet[]) {
    const now = Date.now();

    for (const p of newPackets) {
      // Port scan: > N distinct ports in X seconds
      if (p.srcIp && typeof p.dstPort === "number") {
        const set = portHitsRef.current.get(p.srcIp) || new Set<number>();
        set.add(p.dstPort);
        portHitsRef.current.set(p.srcIp, set);
        if (set.size >= 20) {
          addAlert({
            id: crypto.randomUUID(),
            time: now,
            packetId: p.id,
            srcIp: p.srcIp,
            threat: "Port Scan",
            confidence: Math.min(95, 50 + set.size * 2),
            details: `${p.srcIp} hit ${set.size} distinct ports`,
          });
          set.clear();
        }
      }

      // DDoS-like burst: high PPS from one IP
      const c = (recentCountsRef.current.get(p.srcIp) || 0) + 1;
      recentCountsRef.current.set(p.srcIp, c);
      if (c > 200) {
        addAlert({
          id: crypto.randomUUID(),
          time: now,
          packetId: p.id,
          srcIp: p.srcIp,
          threat: "DDoS",
          confidence: Math.min(98, 40 + c / 2),
          details: `${p.srcIp} very high PPS in short time`,
        });
        recentCountsRef.current.set(p.srcIp, 0);
      }

      // Suspicious protocol on unusual ports
      if (p.protocol === "ICMP" && (p.dstPort || 0) > 0) {
        addAlert({
          id: crypto.randomUUID(),
          time: now,
          packetId: p.id,
          srcIp: p.srcIp,
          threat: "Suspicious Protocol",
          confidence: 70,
          details: `ICMP with port ${p.dstPort}`,
        });
      }
    }

    // decay counts every second
    setTimeout(() => {
      recentCountsRef.current.forEach((val, key) => {
        recentCountsRef.current.set(key, Math.max(0, val - 50));
      });
    }, 1000);
  }

  const stats = useMemo(() => {
    const byProto = new Map<string, number>();
    const byIp = new Map<string, number>();
    for (const p of packets) {
      byProto.set(p.protocol, (byProto.get(p.protocol) || 0) + 1);
      byIp.set(p.srcIp, (byIp.get(p.srcIp) || 0) + 1);
    }
    const topProtocols = Array.from(byProto.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => ({ name: k, value: v }));
    const topTalkers = Array.from(byIp.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
    return { topProtocols, topTalkers };
  }, [packets]);

  return {
    packets,
    alerts,
    connected,
    pps,
    stats,
    setPackets,
    setAlerts,
  } as const;
}
