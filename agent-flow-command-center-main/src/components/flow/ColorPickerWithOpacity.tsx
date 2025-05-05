
import React, { useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * Helper functions for color & alpha
 */
function extractAlpha(color: string): number {
  if (!color) return 1;
  if (color.startsWith('#') && color.length === 9) {
    const alphaHex = color.slice(7, 9);
    return Math.round((parseInt(alphaHex, 16) / 255) * 100) / 100;
  }
  if (color.startsWith('rgba(')) {
    const alpha = color.split(',')[3];
    if (alpha) return parseFloat(alpha.replace(')', '').trim());
  }
  return 1;
}

function applyAlphaToHex(hex: string, alpha: number) {
  if (!hex.startsWith('#')) return hex;
  if (hex.length === 7) {
    const alphaVal = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${hex}${alphaVal}`;
  }
  if (hex.length === 9) {
    const alphaVal = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${hex.slice(0,7)}${alphaVal}`;
  }
  return hex;
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex || !hex.startsWith('#')) return hex;
  let r = 0, g = 0, b = 0;
  if(hex.length === 7 || hex.length === 9) {
    r = parseInt(hex.slice(1,3), 16);
    g = parseInt(hex.slice(3,5), 16);
    b = parseInt(hex.slice(5,7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Color palette from your system
const COLOR_OPTIONS = [
  "#8E9196", "#9b87f5", "#7E69AB", "#F2FCE2", "#FEF7CD", "#FEC6A1",
  "#E5DEFF", "#FFDEE2", "#FDE1D3", "#D3E4FD", "#8B5CF6", "#D946EF",
  "#F97316", "#0EA5E9", "#33C3F0"
];

interface ColorPickerWithOpacityProps {
  color: string;
  opacity: number;
  onChange: (color: string, opacity: number) => void;
  className?: string;
}

export function ColorPickerWithOpacity({
  color,
  opacity,
  onChange,
  className
}: ColorPickerWithOpacityProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handlePresetClick = (hex: string) => {
    const colorWithAlpha = opacity === 1 ? hex : applyAlphaToHex(hex, opacity);
    onChange(colorWithAlpha, opacity);
  };

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const baseHex = e.target.value;
    const colorWithAlpha = opacity === 1 ? baseHex : applyAlphaToHex(baseHex, opacity);
    onChange(colorWithAlpha, opacity);
  };

  const handleAlphaChange = (value: number[]) => {
    const nextAlpha = value[0];
    let baseColor = color;
    if (baseColor.startsWith('#') && baseColor.length === 9) {
      baseColor = baseColor.slice(0, 7);
    }
    const colorWithAlpha = nextAlpha === 1 ? baseColor : applyAlphaToHex(baseColor, nextAlpha);
    onChange(colorWithAlpha, nextAlpha);
  };

  return (
    <div className={cn("w-full", className)}>
      <label className="block mb-2 text-sm font-medium">Node Color</label>
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            aria-label={`Pick color ${c}`}
            onClick={() => handlePresetClick(c)}
            style={{ background: opacity === 1 ? c : hexToRgba(c, opacity) }}
            className={cn(
              "w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer",
              color.startsWith(c) ? "border-amber-400 ring-2 ring-amber-400" : "border-gray-700"
            )}
          >
            {color.startsWith(c) && (
              <span className="w-3 h-3 rounded-full bg-white/80 block"></span>
            )}
          </button>
        ))}
        <input
          ref={colorInputRef}
          type="color"
          value={
            color.startsWith('#')
              ? color.length === 7
                ? color
                : color.slice(0,7)
              : "#8E9196"
          }
          onChange={handleColorInput}
          title="Pick custom color"
          aria-label="Pick custom color"
          className="w-7 h-7 rounded-full border-2 cursor-pointer border-gray-700 bg-transparent p-0"
          style={{
            padding: 0,
            border: color && !COLOR_OPTIONS.includes(color) ? "2px solid #f59e42" : "2px solid #64748b"
          }}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Transparency</label>
        <Slider
          value={[opacity]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={handleAlphaChange}
          className="w-full py-2"
        />
        <div className="text-xs text-gray-400">
          <span>Alpha: {(opacity * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Choose from preset colors or use the wheel. Use the slider to adjust node opacity.
      </div>
    </div>
  );
}
