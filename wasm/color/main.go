//go:build js && wasm

package main

import (
	"syscall/js"
)

const (
	aestheticLower = 0.5
	aestheticUpper = 0.9
)

// extractComplimentaryFromRGBA filters pixels by aesthetic tone, finds most
// frequent color, returns [mostFrequentHex, complimentaryHex].
func extractComplimentaryFromRGBA(data []byte) (string, string, bool) {
	var colors []RGB
	for i := 0; i+4 <= len(data); i += 4 {
		c := rgbFromBytes(data[i], data[i+1], data[i+2], data[i+3])
		hsl := RGBToHSL(c)
		if !FilterAestheticTone(hsl, aestheticLower, aestheticUpper) {
			continue
		}
		colors = append(colors, c)
	}
	mostFreq, ok := MostFrequentColor(colors)
	if !ok {
		return "", "", false
	}
	comp := Complimentary(mostFreq)
	return RGBToHex(mostFreq), RGBToHex(comp), true
}

// extractWarmCoolFromRGBA filters pixels by aesthetic tone, splits by warmth,
// returns [warmHex, coolHex].
func extractWarmCoolFromRGBA(data []byte) (string, string, bool) {
	var warm, cool []RGB
	for i := 0; i+4 <= len(data); i += 4 {
		c := rgbFromBytes(data[i], data[i+1], data[i+2], data[i+3])
		hsl := RGBToHSL(c)
		if !FilterAestheticTone(hsl, aestheticLower, aestheticUpper) {
			continue
		}
		if IsWarm(hsl) {
			warm = append(warm, c)
		} else {
			cool = append(cool, c)
		}
	}
	if len(warm) == 0 && len(cool) == 0 {
		return "", "", false
	}
	warmAvg := AverageColors(warm)
	coolAvg := AverageColors(cool)
	return RGBToHex(warmAvg), RGBToHex(coolAvg), true
}

func main() {
	// ExtractComplimentaryColors(typedArray) => ["#hex1", "#hex2"] or null
	js.Global().Set("extractComplimentaryColorsWasm", js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 || args[0].Type() != js.TypeObject {
			return js.Null()
		}
		typedArray := args[0]
		length := typedArray.Get("length").Int()
		if length <= 0 {
			return js.Null()
		}
		buf := make([]byte, length)
		n := js.CopyBytesToGo(buf, typedArray)
		if n == 0 {
			return js.Null()
		}
		hex1, hex2, ok := extractComplimentaryFromRGBA(buf[:n])
		if !ok {
			return js.Null()
		}
		arr := []any{hex1, hex2}
		return js.ValueOf(arr)
	}))

	// ExtractWarmCoolColors(typedArray) => ["#warmHex", "#coolHex"] or null
	js.Global().Set("extractWarmCoolColorsWasm", js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 || args[0].Type() != js.TypeObject {
			return js.Null()
		}
		typedArray := args[0]
		length := typedArray.Get("length").Int()
		if length <= 0 {
			return js.Null()
		}
		buf := make([]byte, length)
		n := js.CopyBytesToGo(buf, typedArray)
		if n == 0 {
			return js.Null()
		}
		hex1, hex2, ok := extractWarmCoolFromRGBA(buf[:n])
		if !ok {
			return js.Null()
		}
		arr := []any{hex1, hex2}
		return js.ValueOf(arr)
	}))

	// Keep the Go runtime alive (required for wasm_exec.js)
	select {}
}
