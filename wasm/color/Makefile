# Build Go WebAssembly module for color extraction
.PHONY: build
build:
	GOOS=js GOARCH=wasm go build -o color.wasm .

# Copy Go's wasm_exec.js into src/.generated (run from repo root: make -C wasm/color install-js)
# Go 1.24+ uses lib/wasm; Go 1.23 and older use misc/wasm.
.PHONY: install-js
install-js:
	@GOROOT=$$(go env GOROOT); \
	mkdir -p ../../src/.generated; \
	if [ -f "$$GOROOT/lib/wasm/wasm_exec.js" ]; then \
		cp "$$GOROOT/lib/wasm/wasm_exec.js" ../../src/.generated/wasm_exec.js; \
		echo "Copied wasm_exec.js (lib/wasm) to src/.generated/"; \
	elif [ -f "$$GOROOT/misc/wasm/wasm_exec.js" ]; then \
		cp "$$GOROOT/misc/wasm/wasm_exec.js" ../../src/.generated/wasm_exec.js; \
		echo "Copied wasm_exec.js (misc/wasm) to src/.generated/"; \
	else \
		echo "wasm_exec.js not found in $$GOROOT (tried lib/wasm and misc/wasm)"; exit 1; \
	fi
