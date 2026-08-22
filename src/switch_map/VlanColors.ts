import { type Port } from "./Types.ts";

export interface VlanStyle {
    bg: string;
    cellText: string;
    border: string;
    text: string;
    badge: string;
    solid: string;
}

export const TRUNK_STYLE: VlanStyle = {
    bg: "bg-slate-600",
    cellText: "text-white font-bold",
    border: "border-slate-500",
    text: "text-slate-300",
    badge: "bg-slate-700 text-slate-200 border-slate-500",
    solid: "bg-slate-600 text-white",
};

export const DEFAULT_VLAN_STYLE: VlanStyle = {
    bg: "bg-zinc-700",
    cellText: "text-zinc-100 font-bold",
    border: "border-zinc-600",
    text: "text-zinc-300",
    badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
    solid: "bg-zinc-700 text-white",
};

export const VLAN_PALETTES: VlanStyle[] = [
    { bg: "bg-amber-400",   cellText: "text-zinc-950 font-bold", border: "border-amber-500",   text: "text-amber-300",   badge: "bg-amber-400 text-zinc-950 border-amber-300",   solid: "bg-amber-400 text-zinc-950" },
    { bg: "bg-purple-400",  cellText: "text-zinc-950 font-bold", border: "border-purple-500",  text: "text-purple-300",  badge: "bg-purple-400 text-zinc-950 border-purple-300",  solid: "bg-purple-400 text-zinc-950" },
    { bg: "bg-orange-400",  cellText: "text-zinc-950 font-bold", border: "border-orange-500",  text: "text-orange-300",  badge: "bg-orange-400 text-zinc-950 border-orange-300",  solid: "bg-orange-400 text-zinc-950" },
    { bg: "bg-sky-300",     cellText: "text-zinc-950 font-bold", border: "border-sky-400",     text: "text-sky-300",     badge: "bg-sky-300 text-zinc-950 border-sky-200",     solid: "bg-sky-300 text-zinc-950" },
    { bg: "bg-teal-600",    cellText: "text-white font-bold",    border: "border-teal-700",    text: "text-teal-300",    badge: "bg-teal-600 text-white border-teal-500",        solid: "bg-teal-600 text-white" },
    { bg: "bg-rose-400",    cellText: "text-zinc-950 font-bold", border: "border-rose-500",    text: "text-rose-300",    badge: "bg-rose-400 text-zinc-950 border-rose-300",    solid: "bg-rose-400 text-zinc-950" },
    { bg: "bg-indigo-500",  cellText: "text-white font-bold",    border: "border-indigo-600",  text: "text-indigo-300",  badge: "bg-indigo-500 text-white border-indigo-400",    solid: "bg-indigo-500 text-white" },
    { bg: "bg-blue-400",    cellText: "text-zinc-950 font-bold", border: "border-blue-500",    text: "text-blue-300",    badge: "bg-blue-400 text-zinc-950 border-blue-300",    solid: "bg-blue-400 text-zinc-950" },
    { bg: "bg-pink-400",    cellText: "text-zinc-950 font-bold", border: "border-pink-500",    text: "text-pink-300",    badge: "bg-pink-400 text-zinc-950 border-pink-300",    solid: "bg-pink-400 text-zinc-950" },
    { bg: "bg-lime-400",    cellText: "text-zinc-950 font-bold", border: "border-lime-500",    text: "text-lime-300",    badge: "bg-lime-400 text-zinc-950 border-lime-300",    solid: "bg-lime-400 text-zinc-950" },
    { bg: "bg-amber-500",   cellText: "text-zinc-950 font-bold", border: "border-amber-600",   text: "text-amber-400",   badge: "bg-amber-500 text-zinc-950 border-amber-400",   solid: "bg-amber-500 text-zinc-950" },
    { bg: "bg-violet-300",  cellText: "text-zinc-950 font-bold", border: "border-violet-400",  text: "text-violet-300",  badge: "bg-violet-300 text-zinc-950 border-violet-200",  solid: "bg-violet-300 text-zinc-950" },
    { bg: "bg-emerald-400", cellText: "text-zinc-950 font-bold", border: "border-emerald-500", text: "text-emerald-300", badge: "bg-emerald-400 text-zinc-950 border-emerald-300", solid: "bg-emerald-400 text-zinc-950" },
    { bg: "bg-yellow-500",  cellText: "text-zinc-950 font-bold", border: "border-yellow-600",  text: "text-yellow-400",  badge: "bg-yellow-500 text-zinc-950 border-yellow-400",  solid: "bg-yellow-500 text-zinc-950" },
    { bg: "bg-fuchsia-400", cellText: "text-zinc-950 font-bold", border: "border-fuchsia-500", text: "text-fuchsia-300", badge: "bg-fuchsia-400 text-zinc-950 border-fuchsia-300", solid: "bg-fuchsia-400 text-zinc-950" },
    { bg: "bg-cyan-400",    cellText: "text-zinc-950 font-bold", border: "border-cyan-500",    text: "text-cyan-300",    badge: "bg-cyan-400 text-zinc-950 border-cyan-300",    solid: "bg-cyan-400 text-zinc-950" },
];

export const buildVlanColorMap = (ports: Port[]): Map<string, VlanStyle> => {
    const vlans = [...new Set(ports.map((p) => p.vlan).filter(Boolean))].sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });

    const map = new Map<string, VlanStyle>();
    let paletteIndex = 0;

    for (const vlan of vlans) {
        if (vlan.toLowerCase() === "trunk") {
            map.set(vlan, TRUNK_STYLE);
        } else {
            map.set(vlan, VLAN_PALETTES[paletteIndex % VLAN_PALETTES.length]);
            paletteIndex++;
        }
    }

    return map;
};
