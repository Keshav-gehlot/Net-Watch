#!/usr/bin/env python3
# NetWatch Python Agent - Lightweight packet sniffer & WebSocket broadcaster
# Requirements: Python 3.9+, scapy (pip install scapy), websockets (pip install websockets)
# Usage: sudo python3 netwatch_agent.py -i eth0 -p 8765

import argparse
import asyncio
import json
import time
from datetime import datetime

from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw
import websockets

clients = set()

async def ws_handler(websocket):
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)

async def broadcast(msg: str):
    if not clients:
        return
    await asyncio.gather(*(c.send(msg) for c in list(clients)), return_exceptions=True)

def pkt_to_dict(pkt):
    ts = int(time.time() * 1000)
    data = {
        "id": f"{ts}-{pkt.time}",
        "timestamp": ts,
        "srcIp": None,
        "dstIp": None,
        "protocol": "OTHER",
        "srcPort": None,
        "dstPort": None,
        "length": len(pkt),
        "payloadPreview": None,
    }
    if IP in pkt:
        data["srcIp"] = pkt[IP].src
        data["dstIp"] = pkt[IP].dst
    if TCP in pkt:
        data["protocol"] = "TCP"
        data["srcPort"] = int(pkt[TCP].sport)
        data["dstPort"] = int(pkt[TCP].dport)
    elif UDP in pkt:
        data["protocol"] = "UDP"
        data["srcPort"] = int(pkt[UDP].sport)
        data["dstPort"] = int(pkt[UDP].dport)
    elif ICMP in pkt:
        data["protocol"] = "ICMP"
    if Raw in pkt:
        payload = bytes(pkt[Raw].load)[:16]
        data["payloadPreview"] = payload.hex()
    return data

async def main():
    parser = argparse.ArgumentParser(description="NetWatch Agent - Sniff and stream packets over WebSocket")
    parser.add_argument("-i", "--interface", required=True, help="Network interface (e.g., eth0, wlan0)")
    parser.add_argument("-p", "--port", type=int, default=8765, help="WebSocket port")
    args = parser.parse_args()

    loop = asyncio.get_event_loop()

    async def producer(pkt):
        data = pkt_to_dict(pkt)
        await broadcast(json.dumps(data))

    async def run_sniffer():
        sniff(iface=args.interface, prn=lambda pkt: asyncio.run_coroutine_threadsafe(producer(pkt), loop), store=False)

    print(f"[NetWatch] {datetime.now()} - Starting WebSocket server on ws://0.0.0.0:{args.port}")
    print(f"[NetWatch] Sniffing on {args.interface}. Use Ctrl+C to stop.")

    server = await websockets.serve(ws_handler, "0.0.0.0", args.port, max_size=2**20)

    try:
        await run_sniffer()
    except KeyboardInterrupt:
        print("\n[NetWatch] Stopping...")
    finally:
        server.close()
        await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except PermissionError:
        print("Run as root/Administrator to access raw sockets.")
