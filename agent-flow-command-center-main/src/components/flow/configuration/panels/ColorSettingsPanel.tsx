
import { BasePanelProps } from '../types/configuration.types';
import { ColorPickerWithOpacity } from '../ColorPickerWithOpacity';
import { useEffect, useState } from 'react';

export function ColorSettingsPanel({ node, onNodeChange }: BasePanelProps) {
  const color = node.data?.color || "#8E9196";
  
  const [opacity, setOpacity] = useState<number>(() => {
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
  });

  useEffect(() => {
    if (!color) return;
    if (color.startsWith('#') && color.length === 9) {
      const alphaHex = color.slice(7, 9);
      setOpacity(Math.round((parseInt(alphaHex, 16) / 255) * 100) / 100);
      return;
    }
    if (color.startsWith('rgba(')) {
      const alpha = color.split(',')[3];
      if (alpha) {
        setOpacity(parseFloat(alpha.replace(')', '').trim()));
        return;
      }
    }
    setOpacity(1);
  }, [color]);

  return (
    <ColorPickerWithOpacity
      color={color}
      opacity={opacity}
      onChange={(nextColor, nextAlpha) => {
        setOpacity(nextAlpha);
        onNodeChange(prev => ({
          ...prev,
          data: {
            ...prev.data,
            color: nextColor,
          }
        }));
      }}
      className="mb-4"
    />
  );
}
