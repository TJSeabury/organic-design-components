# Color WASM

Go WebAssembly module that offloads slow color extraction from images. Used by `ExtractComplimentaryColorsFromImage` and `ExtractAverageWarmAndCoolColorsFromImage` in the main app.

## Build

```bash
cd wasm/color
GOOS=js GOARCH=wasm go build -o color.wasm .
```

Or from repo root:

```bash
pnpm run build:wasm
```

Output: `wasm/color/color.wasm`. Copy this (and the Go runtime glue) into your app so it can be loaded.

## Copy wasm_exec.js

The Go WASM runtime requires `wasm_exec.js` from the Go toolchain. Go 1.24+ uses `lib/wasm/`; older versions use `misc/wasm/`. From repo root:

```bash
make -C wasm/color install-js
```

This copies `wasm_exec.js` to `src/.generated/`. Or manually (try `lib/wasm` first on Go 1.24+):

```bash
mkdir -p src/.generated
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" src/.generated/   # Go 1.24+
# or
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" src/.generated/  # Go 1.23 and older
```

### How loading the WASM works

Go’s WebAssembly build produces a `.wasm` binary that expects to be started by a small JS runtime. That runtime is `wasm_exec.js`: it defines a `Go` class and knows how to run the Go program and wire Go ↔ JS calls. You have to use it; raw `WebAssembly.instantiate()` alone is not enough.

**1. Load the Go runtime (once)**  
Import or run `src/.generated/wasm_exec.js` so that the `Go` class is available (it attaches to `globalThis.Go`). For example:

```js
import "./.generated/wasm_exec.js";
// or in HTML: <script src="/src/.generated/wasm_exec.js"></script>
```

**2. Fetch and instantiate the WASM**  
Fetch the `color.wasm` binary (you must serve it from your app; e.g. put a copy in `public/` or reference the one in `wasm/color/`). Then instantiate it. You get a `WebAssembly.Instance`.

```js
const wasmResponse = await fetch("/color.wasm");  // or your path
const wasmBytes = await wasmResponse.arrayBuffer();
const { instance } = await WebAssembly.instantiate(wasmBytes);
```

**3. Start the Go program**  
Create a `Go` instance and call `run(instance)`. (`Go` is the class that `wasm_exec.js` attaches to `globalThis.Go` when you load it in step 1.) That starts the Go `main()` and sets up the JS globals that the Go code registers (`extractComplimentaryColorsWasm`, `extractWarmCoolColorsWasm`). This module’s `main()` never exits (it blocks on `select {}`), so `go.run(instance)`’s promise will not resolve; that’s expected. You can call it without `await` so the rest of your app can run.

```js
const go = new Go();   // Go comes from wasm_exec.js (step 1)
go.run(instance);      // do not await; Go main runs forever
```

**4. Use the exported functions**  
After `go.run(instance)` has been called, the global functions are available. Pass a `Uint8ClampedArray` (e.g. `imageData.data`) and use the returned hex strings as needed.

```js
const [hex1, hex2] = extractComplimentaryColorsWasm(imageData.data) ?? [];
```

So in short: load `wasm_exec.js` → fetch `.wasm` → `WebAssembly.instantiate` → `new Go().run(instance)` → then call the globals the Go code registered.

## JS API

After the WASM module is loaded (via `wasm_exec.js` and `new Go().run(instance)`), two globals are set:

- **`extractComplimentaryColorsWasm(typedArray)`**  
  Argument: `Uint8ClampedArray` (e.g. `imageData.data`).  
  Returns: `["#hex1", "#hex2"]` (most frequent + complimentary) or `null`.

- **`extractWarmCoolColorsWasm(typedArray)`**  
  Argument: `Uint8ClampedArray` (e.g. `imageData.data`).  
  Returns: `["#warmHex", "#coolHex"]` or `null`.

The app should still load the image and call `getImageData()` in JS; only the pixel iteration and color math run in WASM.
