package main

import (
	"math"
)

// RGB holds 0-1 components.
type RGB struct{ R, G, B float64 }

// HSL holds H 0-360, S and L 0-1.
type HSL struct{ H, S, L float64 }

// LAB holds L 0-100, a and b approximately -128..127.
type LAB struct{ L, A, B float64 }

func rgbFromBytes(r, g, b, _ uint8) RGB {
	return RGB{
		R: float64(r) / 255,
		G: float64(g) / 255,
		B: float64(b) / 255,
	}
}

// RGBToHSL converts sRGB (0-1) to HSL. H in 0-360, S and L in 0-1.
func RGBToHSL(c RGB) HSL {
	min := math.Min(c.R, math.Min(c.G, c.B))
	max := math.Max(c.R, math.Max(c.G, c.B))
	l := (min + max) / 2
	if min == max {
		return HSL{H: 0, S: 0, L: l}
	}
	d := max - min
	var s float64
	if l > 0.5 {
		s = d / (2 - max - min)
	} else {
		s = d / (max + min)
	}
	var h float64
	switch max {
	case c.R:
		h = (c.G - c.B) / d
		if c.G < c.B {
			h += 6
		}
	case c.G:
		h = (c.B-c.R)/d + 2
	case c.B:
		h = (c.R-c.G)/d + 4
	}
	h *= 60
	if h < 0 {
		h += 360
	}
	return HSL{H: h, S: s, L: l}
}

// HSLToRGB converts HSL to sRGB (0-1).
func HSLToRGB(h HSL) RGB {
	if h.S == 0 {
		return RGB{R: h.L, G: h.L, B: h.L}
	}
	var q float64
	if h.L < 0.5 {
		q = h.L * (1 + h.S)
	} else {
		q = h.L + h.S - h.L*h.S
	}
	p := 2*h.L - q
	hk := h.H / 360
	tr := hk + 1.0/3
	tg := hk
	tb := hk - 1.0/3
	clip := func(t float64) float64 {
		if t < 0 {
			t++
		}
		if t > 1 {
			t--
		}
		if t < 1.0/6 {
			return p + (q-p)*6*t
		}
		if t < 0.5 {
			return q
		}
		if t < 2.0/3 {
			return p + (q-p)*(2.0/3-t)*6
		}
		return p
	}
	return RGB{R: clip(tr), G: clip(tg), B: clip(tb)}
}

// RGBToLAB converts sRGB (0-1) to CIE LAB.
func RGBToLAB(c RGB) LAB {
	// sRGB -> linear RGB
	linear := func(v float64) float64 {
		if v <= 0.04045 {
			return v / 12.92
		}
		return math.Pow((v+0.055)/1.055, 2.4)
	}
	r := linear(c.R)
	g := linear(c.G)
	b := linear(c.B)
	// D65 reference
	x := r*0.4124564 + g*0.3575761 + b*0.1804375
	y := r*0.2126729 + g*0.7151522 + b*0.0721750
	z := r*0.0193339 + g*0.1191920 + b*0.9503041
	// XYZ normalized by D65 white point
	xn, yn, zn := 0.95047, 1.0, 1.08883
	x, y, z = x/xn, y/yn, z/zn
	f := func(t float64) float64 {
		if t > 0.008856 {
			return math.Pow(t, 1.0/3)
		}
		return (7.787*t + 16.0/116)
	}
	fy := f(y)
	l := 116*fy - 16
	a := 500 * (f(x) - fy)
	bLab := 200 * (fy - f(z))
	return LAB{L: l, A: a, B: bLab}
}

// LABToRGB converts CIE LAB to sRGB (0-1).
func LABToRGB(lab LAB) RGB {
	y := (lab.L + 16) / 116
	x := lab.A/500 + y
	z := y - lab.B/200
	invF := func(t float64) float64 {
		if t > 0.20689655172413793 {
			return t * t * t
		}
		return (t - 16.0/116) / 7.787
	}
	xn, yn, zn := 0.95047, 1.0, 1.08883
	x = xn * invF(x)
	y = yn * invF(y)
	z = zn * invF(z)
	// linear RGB
	r := x*3.2404542 + y*(-1.5371385) + z*(-0.4985314)
	g := x*(-0.9692660) + y*1.8760108 + z*0.0415560
	b := x*0.0556434 + y*(-0.2040259) + z*1.0572252
	// linear -> sRGB
	gamma := func(v float64) float64 {
		if v <= 0.0031308 {
			return v * 12.92
		}
		return 1.055*math.Pow(v, 1/2.4) - 0.055
	}
	return RGB{R: gamma(r), G: gamma(g), B: gamma(b)}
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

// FilterAestheticTone matches JS: L in [lower, upper], S >= 0.2.
func FilterAestheticTone(h HSL, lower, upper float64) bool {
	if h.L < lower || h.L > upper {
		return false
	}
	if h.S < 0.2 {
		return false
	}
	return true
}

// Quantize for most-frequent: 16 levels per channel => 4096 buckets.
const quantBits = 4
const quantLevels = 1 << quantBits

func quantizeRGB(c RGB) (int, int, int) {
	qr := int(clamp01(c.R) * (quantLevels - 0.001))
	qg := int(clamp01(c.G) * (quantLevels - 0.001))
	qb := int(clamp01(c.B) * (quantLevels - 0.001))
	if qr >= quantLevels {
		qr = quantLevels - 1
	}
	if qg >= quantLevels {
		qg = quantLevels - 1
	}
	if qb >= quantLevels {
		qb = quantLevels - 1
	}
	return qr, qg, qb
}

// MostFrequentColor returns the most frequent color from the slice (quantized).
func MostFrequentColor(colors []RGB) (RGB, bool) {
	if len(colors) == 0 {
		return RGB{}, false
	}
	type key struct{ r, g, b int }
	counts := make(map[key]int)
	var bestKey key
	bestCount := 0
	for _, c := range colors {
		qr, qg, qb := quantizeRGB(c)
		k := key{qr, qg, qb}
		counts[k]++
		if counts[k] > bestCount {
			bestCount = counts[k]
			bestKey = k
		}
	}
	// unquantize center of bin
	r := (float64(bestKey.r) + 0.5) / quantLevels
	g := (float64(bestKey.g) + 0.5) / quantLevels
	b := (float64(bestKey.b) + 0.5) / quantLevels
	return RGB{R: r, G: g, B: b}, true
}

// Complimentary returns hue + 180 in HSL.
func Complimentary(c RGB) RGB {
	h := RGBToHSL(c)
	h.H = math.Mod(h.H+180, 360)
	if h.H < 0 {
		h.H += 360
	}
	return HSLToRGB(h)
}

// IsWarm returns true if hue is in (90, 270) (warm range in JS).
func IsWarm(h HSL) bool {
	return h.H > 90 && h.H < 270
}

// AverageColors averages in LAB space (perceptually uniform).
func AverageColors(colors []RGB) RGB {
	if len(colors) == 0 {
		return RGB{}
	}
	var sumL, sumA, sumB float64
	for _, c := range colors {
		lab := RGBToLAB(c)
		sumL += lab.L
		sumA += lab.A
		sumB += lab.B
	}
	n := float64(len(colors))
	avg := LAB{
		L: sumL / n,
		A: sumA / n,
		B: sumB / n,
	}
	return LABToRGB(avg)
}

// RGBToHex returns "#rrggbb".
func RGBToHex(c RGB) string {
	r := int(clamp01(c.R) * 255.999)
	g := int(clamp01(c.G) * 255.999)
	b := int(clamp01(c.B) * 255.999)
	return "#" + formatHexByte(r) + formatHexByte(g) + formatHexByte(b)
}

func formatHexByte(v int) string {
	const hex = "0123456789abcdef"
	if v < 0 {
		v = 0
	}
	if v > 255 {
		v = 255
	}
	return string([]byte{hex[v>>4], hex[v&0xf]})
}
