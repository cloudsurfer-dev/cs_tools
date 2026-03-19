import { normaliseMac } from "./ParseMacTable.ts";

export interface InfobloxEntry {
    ip: string;
    mac: string;
    hostname: string;
}

export const parseInfoblox = (raw: string): Map<string, InfobloxEntry> => {
    const lines = raw.trim().split("\n");

    // Find header line to locate column indices — don't assume order
    const headerLine = lines.find((l) => l.toLowerCase().includes("mac"));
    if (!headerLine) return new Map();

    const headers = headerLine.toLowerCase().split(",").map((h) => h.trim());
    const ipIdx       = headers.indexOf("ip_address");
    const macIdx      = headers.indexOf("mac_address");
    const hostnameIdx = headers.indexOf("hostname");

    if (ipIdx === -1 || macIdx === -1 || hostnameIdx === -1) return new Map();

    const map = new Map<string, InfobloxEntry>();

    for (const line of lines.slice(lines.indexOf(headerLine) + 1)) {
        const cols = line.split(",").map((c) => c.trim());
        if (cols.length < 3) continue;

        const mac = normaliseMac(cols[macIdx]);
        if (!mac) continue;

        map.set(mac, {
            ip:       cols[ipIdx],
            mac,
            hostname: cols[hostnameIdx],
        });
    }

    return map;
};