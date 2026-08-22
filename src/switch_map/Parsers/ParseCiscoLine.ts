import { type Port, type Status } from "../Types.ts";

const KNOWN_STATUSES = [
    "connected",
    "notconnect",
    "notconnected",
    "disabled",
    "err-disabled",
    "err-disable",
    "inactive",
    "monitoring",
    "sfpAbsent",
    "faulty",
    "down",
    "up",
] as const;

const normalizeStatus = (raw: string): Status => {
    const s = raw.toLowerCase();
    if (s === "connected" || s === "up") return "connected";
    if (s === "disabled" || s === "inactive") return "disabled";
    if (s.includes("err-disable") || s === "faulty") return "err-disabled";
    if (s.includes("notconnect") || s === "down" || s === "sfpabsent") return "notconnect";
    return "unknown";
};

export const parseCiscoLine = (line: string): Port | null => {
    // Matches Cisco interface patterns (e.g., Gi1/0/1, GigabitEthernet1/0/1, Fa0/1, Te1/0/1, Eth1/1, Po1, Twe1/0/1)
    const portMatch = line.match(/^\s*([A-Za-z]+[\d/]+(?:\.\d+)?)/i);
    if (!portMatch) return null;
    const portStr = portMatch[1];

    const rest = line.slice(line.indexOf(portStr) + portStr.length).trim();

    // Find the first status match
    let foundStatus: string | null = null;
    let foundIndex = -1;

    for (const st of KNOWN_STATUSES) {
        const idx = rest.toLowerCase().search(new RegExp(`\\b${st}\\b`, "i"));
        if (idx !== -1 && (foundIndex === -1 || idx < foundIndex)) {
            foundIndex = idx;
            foundStatus = st;
        }
    }

    // Fallback if boundary match fails
    if (foundIndex === -1) {
        for (const st of KNOWN_STATUSES) {
            const idx = rest.toLowerCase().indexOf(st);
            if (idx !== -1 && (foundIndex === -1 || idx < foundIndex)) {
                foundIndex = idx;
                foundStatus = st;
            }
        }
    }

    if (foundIndex === -1 || !foundStatus) return null;

    const name = rest.slice(0, foundIndex).trim();
    const after = rest.slice(foundIndex).trim().split(/\s+/);

    const rawStatus = after[0] ?? "";
    const vlan = after[1] ?? "unknown";
    const duplex = after[2];
    const speed = after[3];
    const portType = after.slice(4).join(" ") || undefined;

    return {
        port: portStr,
        name,
        status: normalizeStatus(rawStatus),
        vlan,
        duplex,
        speed,
        portType,
    };
};

export const parseCisco = (raw: string): Port[] =>
    raw
        .split("\n")
        .map(parseCiscoLine)
        .filter((p): p is Port => p !== null);
