import { normaliseMac } from "./ParseMacTable.ts";

export interface InfobloxEntry {
    ip: string;
    mac: string;
    hostname: string;
}

// Strips surrounding quotes and whitespace from a CSV cell value
const unquote = (value: string): string => value.trim().replace(/^"|"$/g, "");

export const parseInfoblox = (raw: string): Map<string, InfobloxEntry> => {
    const lines = raw.trim().split("\n");

    // Find header line to locate column indices — don't assume order
    const headerLine = lines.find((l) => l.toLowerCase().includes("mac"));
    if (!headerLine) return new Map();

    const headers = headerLine.split(",").map(unquote).map((h) => h.toLowerCase());

    // Support variations of column names from different Infoblox export formats
    const ipIdx       = headers.findIndex((h) => h === "ip" || h === "ip_address" || h === "ip address");
    const macIdx      = headers.findIndex((h) => h === "mac" || h === "mac_address" || h === "mac address");
    const hostnameIdx = headers.findIndex((h) => h === "hostname" || h === "name");

    if (ipIdx === -1 || macIdx === -1 || hostnameIdx === -1) return new Map();

    const map = new Map<string, InfobloxEntry>();

    for (const line of lines.slice(lines.indexOf(headerLine) + 1)) {
        const cols = line.split(",").map(unquote);
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