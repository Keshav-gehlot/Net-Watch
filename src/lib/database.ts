import { Packet, AlertItem } from "@/types/network";

const DB_NAME = "NetWatchDB";
const DB_VERSION = 1;
const PACKETS_STORE = "packets";
const ALERTS_STORE = "alerts";
const SESSIONS_STORE = "sessions";

export interface NetworkSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  packetCount: number;
  totalBytes: number;
  description?: string;
}

class NetWatchDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create packets store
        if (!db.objectStoreNames.contains(PACKETS_STORE)) {
          const packetsStore = db.createObjectStore(PACKETS_STORE, { keyPath: "id" });
          packetsStore.createIndex("timestamp", "timestamp", { unique: false });
          packetsStore.createIndex("srcIp", "srcIp", { unique: false });
          packetsStore.createIndex("protocol", "protocol", { unique: false });
        }

        // Create alerts store
        if (!db.objectStoreNames.contains(ALERTS_STORE)) {
          const alertsStore = db.createObjectStore(ALERTS_STORE, { keyPath: "id" });
          alertsStore.createIndex("time", "time", { unique: false });
          alertsStore.createIndex("threat", "threat", { unique: false });
        }

        // Create sessions store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
          sessionsStore.createIndex("startTime", "startTime", { unique: false });
        }
      };
    });
  }

  async savePackets(packets: Packet[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction([PACKETS_STORE], "readwrite");
    const store = transaction.objectStore(PACKETS_STORE);

    const promises = packets.map(packet => 
      new Promise<void>((resolve, reject) => {
        const request = store.put(packet);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );

    await Promise.all(promises);
  }

  async getPackets(limit = 1000): Promise<Packet[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PACKETS_STORE], "readonly");
      const store = transaction.objectStore(PACKETS_STORE);
      const index = store.index("timestamp");
      const request = index.openCursor(null, "prev");
      
      const packets: Packet[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < limit) {
          packets.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(packets);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveAlerts(alerts: AlertItem[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction([ALERTS_STORE], "readwrite");
    const store = transaction.objectStore(ALERTS_STORE);

    const promises = alerts.map(alert => 
      new Promise<void>((resolve, reject) => {
        const request = store.put(alert);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );

    await Promise.all(promises);
  }

  async getAlerts(limit = 500): Promise<AlertItem[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ALERTS_STORE], "readonly");
      const store = transaction.objectStore(ALERTS_STORE);
      const index = store.index("time");
      const request = index.openCursor(null, "prev");
      
      const alerts: AlertItem[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < limit) {
          alerts.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(alerts);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async createSession(session: NetworkSession): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SESSIONS_STORE], "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.put(session);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSessions(): Promise<NetworkSession[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SESSIONS_STORE], "readonly");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldData(olderThanDays = 7): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    // Clear old packets
    return new Promise((resolve, reject) => {
      const packetsTransaction = this.db!.transaction([PACKETS_STORE], "readwrite");
      const packetsStore = packetsTransaction.objectStore(PACKETS_STORE);
      const packetsIndex = packetsStore.index("timestamp");
      const packetsRange = IDBKeyRange.upperBound(cutoffTime);
      const request = packetsIndex.openCursor(packetsRange);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Clear old alerts
          const alertsTransaction = this.db!.transaction([ALERTS_STORE], "readwrite");
          const alertsStore = alertsTransaction.objectStore(ALERTS_STORE);
          const alertsIndex = alertsStore.index("time");
          const alertsRequest = alertsIndex.openCursor(packetsRange);
          
          alertsRequest.onsuccess = (alertEvent) => {
            const alertCursor = (alertEvent.target as IDBRequest).result;
            if (alertCursor) {
              alertCursor.delete();
              alertCursor.continue();
            } else {
              resolve();
            }
          };
          alertsRequest.onerror = () => reject(alertsRequest.error);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const netWatchDB = new NetWatchDB();
