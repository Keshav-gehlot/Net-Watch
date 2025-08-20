import { useCallback, useEffect, useRef, useState } from "react";
import { Packet } from "@/types/network";

export interface AnalysisTask {
  id: string;
  type: "threat-analysis" | "pattern-detection" | "statistics" | "geolocation";
  packets: Packet[];
  config?: Record<string, any>;
}

export interface AnalysisResult {
  taskId: string;
  type: string;
  result: any;
  processingTime: number;
  error?: string;
}

export const usePacketAnalysisWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<Map<string, (result: AnalysisResult) => void>>(new Map());

  useEffect(() => {
    // Create worker
    const worker = new Worker(
      new URL("../workers/packetAnalysis.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;
    setIsWorkerReady(true);

    // Handle worker messages
    worker.onmessage = (e: MessageEvent<AnalysisResult>) => {
      const result = e.data;
      const callback = pendingTasks.get(result.taskId);
      
      if (callback) {
        callback(result);
        setPendingTasks(prev => {
          const newMap = new Map(prev);
          newMap.delete(result.taskId);
          return newMap;
        });
      }
    };

    worker.onerror = (error) => {
      console.error("Worker error:", error);
    };

    // Cleanup
    return () => {
      worker.terminate();
      setIsWorkerReady(false);
    };
  }, []);

  const analyzePackets = useCallback(
    (type: AnalysisTask["type"], packets: Packet[], config?: Record<string, any>): Promise<AnalysisResult> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isWorkerReady) {
          reject(new Error("Worker not ready"));
          return;
        }

        const taskId = crypto.randomUUID();
        const task: AnalysisTask = {
          id: taskId,
          type,
          packets,
          config
        };

        // Store callback for this task
        setPendingTasks(prev => new Map(prev).set(taskId, resolve));

        // Send task to worker
        workerRef.current.postMessage(task);

        // Set timeout to avoid hanging
        setTimeout(() => {
          setPendingTasks(prev => {
            const newMap = new Map(prev);
            if (newMap.has(taskId)) {
              newMap.delete(taskId);
              reject(new Error("Analysis timeout"));
            }
            return newMap;
          });
        }, 30000); // 30 second timeout
      });
    },
    [isWorkerReady]
  );

  const analyzeThreat = useCallback(
    (packets: Packet[]) => analyzePackets("threat-analysis", packets),
    [analyzePackets]
  );

  const detectPatterns = useCallback(
    (packets: Packet[]) => analyzePackets("pattern-detection", packets),
    [analyzePackets]
  );

  const calculateStatistics = useCallback(
    (packets: Packet[]) => analyzePackets("statistics", packets),
    [analyzePackets]
  );

  const getGeolocation = useCallback(
    (packets: Packet[]) => analyzePackets("geolocation", packets),
    [analyzePackets]
  );

  return {
    isWorkerReady,
    analyzeThreat,
    detectPatterns,
    calculateStatistics,
    getGeolocation,
    analyzePackets
  };
};
