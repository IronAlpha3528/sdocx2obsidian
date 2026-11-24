import { useRef, useCallback, useEffect } from "react";
import { NoteResultPayload, SessionOutcome } from "../types";

interface WorkerMessageData {
  type: string;
  id?: string;
  result?: NoteResultPayload;
  outcome?: {
    total: number;
    succeeded: number;
    failed: number;
    zip_size: number;
  };
  zipBytes?: ArrayBuffer;
  error?: string;
}

export function useConversionWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<
    Map<
      string,
      {
        resolve: (data: WorkerMessageData) => void;
        reject: (err: Error) => void;
      }
    >
  >(new Map());

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const worker = new Worker("/worker.js");

      worker.onmessage = (e: MessageEvent<WorkerMessageData>) => {
        const { id, type, error } = e.data;
        if (id && pendingRequests.current.has(id)) {
          const { resolve, reject } = pendingRequests.current.get(id)!;
          pendingRequests.current.delete(id);

          if (type === "error" || error) {
            reject(new Error(error || "Worker processing error"));
          } else {
            resolve(e.data);
          }
        }
      };

      worker.onerror = (err) => {
        console.error("Worker fatal error:", err);
        for (const [, { reject }] of pendingRequests.current.entries()) {
          reject(new Error(err.message || "Web Worker fatal error"));
        }
        pendingRequests.current.clear();
      };

      workerRef.current = worker;
    }
    return workerRef.current;
  }, []);

  const sendWorkerRequest = useCallback(
    (type: string, payload?: unknown): Promise<WorkerMessageData> => {
      return new Promise((resolve, reject) => {
        const worker = getWorker();
        const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        pendingRequests.current.set(id, { resolve, reject });
        worker.postMessage({ type, id, payload });
      });
    },
    [getWorker]
  );

  const initRuntime = useCallback(async () => {
    await sendWorkerRequest("init");
  }, [sendWorkerRequest]);

  const startSession = useCallback(async () => {
    await sendWorkerRequest("start_session");
  }, [sendWorkerRequest]);

  const convertNote = useCallback(
    async (filename: string, data: ArrayBuffer): Promise<NoteResultPayload> => {
      const res = await sendWorkerRequest("convert_note", { filename, data });
      if (!res.result) {
        throw new Error("No conversion result returned from worker");
      }
      return res.result;
    },
    [sendWorkerRequest]
  );

  const finishSession = useCallback(async (): Promise<SessionOutcome> => {
    const res = await sendWorkerRequest("finish_session");
    if (!res.outcome || !res.zipBytes) {
      throw new Error("No outcome or zip data returned from worker");
    }

    const blob = new Blob([res.zipBytes], { type: "application/zip" });
    return {
      total: res.outcome.total,
      succeeded: res.outcome.succeeded,
      failed: res.outcome.failed,
      zipSize: res.outcome.zip_size,
      zipBlob: blob,
    };
  }, [sendWorkerRequest]);

  const abortSession = useCallback(async () => {
    if (workerRef.current) {
      try {
        await sendWorkerRequest("abort_session");
      } catch (e) {
        console.warn("Worker abort error (restarting worker):", e);
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  }, [sendWorkerRequest]);

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      pendingRequests.current.clear();
    }
  }, []);

  useEffect(() => {
    return () => {
      terminate();
    };
  }, [terminate]);

  return {
    initRuntime,
    startSession,
    convertNote,
    finishSession,
    abortSession,
    terminate,
  };
}
