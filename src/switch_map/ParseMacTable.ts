/**
 * Normalises a MAC address to uppercase colon-separated format (XX:XX:XX:XX:XX:XX).
 * Handles Cisco dot notation (aabb.cc01.0101), colon, dash, space, and raw hex notation.
 */
export const normaliseMac = (raw: string): string => {
    const hex = raw.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
    if (hex.length !== 12) return raw.trim().toUpperCase();
    return (hex.match(/.{2}/g) || []).join(":");
};

/**
 * Parses "show mac address-table" / "show mac-address-table" output across Cisco,
 * Aruba, HP, and standard switches, returning a map of normalised MAC -> port name.
 */
export const parseMacTable = (raw: string): Map<string, string> => {
    const macToPort = new Map<string, string>();
    if (!raw.trim()) return macToPort;

    // Regex to match a MAC address anywhere in a line
    const macRegex = /\b(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}\b|\b[0-9a-fA-F]{4}[.-][0-9a-fA-F]{4}[.-][0-9a-fA-F]{4}\b|\b[0-9a-fA-F]{6}-[0-9a-fA-F]{6}\b|\b[0-9a-fA-F]{12}\b/i;

    // Regex to match switch port interfaces (e.g., Gi1/0/1, GigabitEthernet1/0/1, Te1/0/1, Eth1/1, Po1, 1/1, A1)
    const portRegex = /\b(?:(?:Gi|Fa|Te|Eth|Po|Twe|Fo|Hu|GigabitEthernet|TenGigabitEthernet|FastEthernet)[A-Za-z0-9/.]+|\d+\/\d+|[A-Z]\d+)\b/i;

    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip obvious header or separator lines
        if (/^[-=+\s]+$/.test(trimmed)) continue;
        if (/^(vlan|mac address|total mac|destination|legend)/i.test(trimmed)) continue;

        const macMatch = trimmed.match(macRegex);
        if (!macMatch) continue;

        const normMac = normaliseMac(macMatch[0]);

        // Find the port in the line (excluding the MAC portion)
        const lineWithoutMac = trimmed.replace(macMatch[0], " ");
        const tokens = lineWithoutMac.split(/\s+/).filter(Boolean);

        // Check tokens from right to left as port is usually towards the end
        let matchedPort: string | null = null;
        for (let i = tokens.length - 1; i >= 0; i--) {
            const tok = tokens[i];
            if (portRegex.test(tok) && !/^\d+$/.test(tok) && !/^(dynamic|static|learn|secure|self|drop|system|other)$/i.test(tok)) {
                matchedPort = tok;
                break;
            }
        }

        if (matchedPort) {
            macToPort.set(normMac, matchedPort);
        }
    }

    return macToPort;
};