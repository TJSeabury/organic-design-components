/// <reference path="./wasm.d.ts" />
import "./.generated/wasm_exec.js";

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