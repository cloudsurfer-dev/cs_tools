// Manually assigned VLAN colours — these take priority over auto-assigned ones.
// Any VLAN not listed here will be assigned a colour from COLOR_PALETTE automatically.
// Use Tailwind bg-* classes e.g. "bg-red-400"
export const VLAN_COLORS: Record<string, string> = {
    "1":     "bg-gray-400",
    "200":   "bg-blue-400",
    "240":   "bg-purple-500",
    "trunk": "bg-green-400",
};