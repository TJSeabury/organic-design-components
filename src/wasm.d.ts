/**
 * Go WASM runtime provided by wasm_exec.js.
 * It attaches to globalThis when the script loads.
 */
declare global {
  const Go: new () => {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<void>;
  };
  function extractComplimentaryColorsWasm(
    data: Uint8ClampedArray | Uint8Array
  ): [string, string] | null;
  function extractWarmCoolColorsWasm(
    data: Uint8ClampedArray | Uint8Array
  ): [string, string] | null;
}

export { };
