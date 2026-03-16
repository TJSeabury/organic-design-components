/// <reference path="./wasm.d.ts" />

let wasmRuntimeLoaded: Promise<void> | null = null;

const loadWasmRuntime = () => {
  if (typeof window === "undefined") {
    // Skip on server / build-time environments.
    return Promise.resolve();
  }

  if (!wasmRuntimeLoaded) {
    wasmRuntimeLoaded = new Promise<void>((resolve, reject) => {
      if (typeof (globalThis as any).Go === "function") {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "/wasm_exec.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load /wasm_exec.js for Go WASM runtime."));
      document.head.appendChild(script);
    });
  }

  return wasmRuntimeLoaded;
};

await loadWasmRuntime();

const go = new Go();
const wasmResponse = await fetch("/color.wasm");
const wasmBytes = await wasmResponse.arrayBuffer();
const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject);
go.run(instance);

/** Resolves when the WASM has started and the color extraction globals are registered. */
export const wasmReady = new Promise<void>((resolve) => {
  const check = () => {
    if (typeof globalThis.extractComplimentaryColorsWasm === "function") {
      resolve();
      return;
    }
    setTimeout(check, 10);
  };
  setTimeout(check, 0);
});