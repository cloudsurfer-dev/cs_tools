import { type Port } from "./Types.ts";

export const COLOR_PALETTE = [
    "bg-yellow-400",
    "bg-purple-400",
    "bg-orange-400",
    "bg-cyan-200",
    "bg-teal-700",
    "bg-red-400",
    "bg-indigo-500",
    "bg-lime-400",
    "bg-amber-400",
    "bg-violet-300",
    "bg-emerald-400",
];

// Manually assigned VLAN colours — these take priority over auto-assigned ones.
// Any VLAN not listed here will be assigned a colour from COLOR_PALETTE automatically.
export const VLAN_COLORS: Record<string, string> = {
    "100":     "bg-blue-400",
    "300":     "bg-pink-300",
    "trunk": "bg-gray-600",
};

export const buildVlanColorMap = (ports: Port[]): Map<string, string> => {
    const vlans = [...new Set(ports.map((p) => p.vlan))];

    const claimedColors    = new Set(Object.values(VLAN_COLORS));
    const availablePalette = COLOR_PALETTE.filter((c) => !claimedColors.has(c));

    const map = new Map<string, string>();
    let paletteIndex = 0;

    for (const vlan of vlans) {
        if (VLAN_COLORS[vlan]) {
            map.set(vlan, VLAN_COLORS[vlan]);
        } else {
            map.set(vlan, availablePalette[paletteIndex % availablePalette.length]);
            paletteIndex++;
        }
    }

    return map;
};
