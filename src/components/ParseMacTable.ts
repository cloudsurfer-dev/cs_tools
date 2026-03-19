export interface MacEntry {
    vlan: string;
    mac: string;
    type: string;
    port: string;
}

/**
 * Normalises a MAC address to uppercase colon-separated format.
 * Handles Cisco dot notation (aabb.cc01.0101) and colon/dash notation.
 */
export const normaliseMac = (raw: string): string => {
    const hex = raw.replace(/[.\-:]/g, "");
    if (hex.length !== 12) return raw.toUpperCase();
    return hex
        .match(/.{2}/g)!
        .join(":")
        .toUpperCase();
};

const parseMacLine = (line: string): MacEntry | null => {
    // Expected format: <vlan>  <mac>  <type>  <port>
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) return null;

    const [vlan, mac, type, port] = parts;

    // Vlan column in "show mac-address-table" is always numeric — unlike "show interfaces status"
    // which shows "trunk" / "routed". MAC table entries always show the actual VLAN number,
    // even for MACs learned on trunk ports. Non-numeric lines are headers or dividers.
    if (!/^\d+$/.test(vlan)) return null;

    // Port must look like a switch interface
    if (!/^(Gi|Fa|Te|Eth|Po)\d/i.test(port)) return null;

    return {
        vlan,
        mac: normaliseMac(mac),
        type,
        port,
    };
};

/**
 * Parses "show mac-address-table" output and returns only ports
 * with exactly one MAC entry (single device ports).
 */
export const parseMacTable = (raw: string): MacEntry[] => {
    const entries = raw
        .split("\n")
        .map(parseMacLine)
        .filter((e): e is MacEntry => e !== null);

    // Group by port
    const byPort = new Map<string, MacEntry[]>();
    for (const entry of entries) {
        const existing = byPort.get(entry.port) ?? [];
        byPort.set(entry.port, [...existing, entry]);
    }

    // Keep only ports with exactly one MAC
    return Array.from(byPort.values())
        .filter((group) => group.length === 1)
        .map((group) => group[0]);
};