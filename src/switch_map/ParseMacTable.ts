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

/**
 * Parses "show mac-address-table" output and returns a flat map of
 * MAC address -> port name for all entries.
 * Filtering for known devices is handled downstream via Infoblox.
 */
export const parseMacTable = (raw: string): Map<string, string> => {
    const macToPort = new Map<string, string>();

    for (const line of raw.split("\n")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 4) continue;

        const [vlan, mac, , port] = parts;

        // Vlan column in "show mac-address-table" is always numeric — unlike "show interfaces status"
        // which shows "trunk" / "routed". MAC table entries always show the actual VLAN number,
        // even for MACs learned on trunk ports. Non-numeric lines are headers or dividers.
        if (!/^\d+$/.test(vlan)) continue;

        // Port must look like a switch interface
        if (!/^(Gi|Fa|Te|Eth|Po)\d/i.test(port)) continue;

        macToPort.set(normaliseMac(mac), port);
    }

    return macToPort;
};