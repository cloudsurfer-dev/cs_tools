import { type InfobloxEntry } from "./ParseInfoBlox.ts";
import { parseMacTable } from "./ParseMacTable.ts";
import { parseInfoblox } from "./ParseInfoBlox.ts";

export interface DeviceInfo {
    mac: string;
    ip?: string;
    hostname?: string;
}

// Map from port name (e.g. "Gi1/0/3", "1/1") to DeviceInfo
export type DeviceMap = Map<string, DeviceInfo>;

/**
 * Normalises a port identifier for consistent lookup between MAC table and int status
 * (e.g. GigabitEthernet1/0/1 -> gi1/0/1, Gi1/0/1 -> gi1/0/1)
 */
export const normalizePortKey = (port: string): string => {
    return port
        .trim()
        .toLowerCase()
        .replace(/^gigabitethernet/i, "gi")
        .replace(/^fastethernet/i, "fa")
        .replace(/^tengigabitethernet/i, "te")
        .replace(/^twentyfivegige/i, "twe")
        .replace(/^fortygige/i, "fo")
        .replace(/^hundredgige/i, "hu")
        .replace(/^port-channel/i, "po");
};

/**
 * Builds a DeviceMap from MAC table and Infoblox mappings.
 * Works even if only MAC table is provided (maps MAC to port),
 * and enriches with IP/Hostname when Infoblox data is available.
 */
export const buildDeviceMap = (
    macToPort: Map<string, string>,
    infobloxMap: Map<string, InfobloxEntry>
): DeviceMap => {
    const deviceMap: DeviceMap = new Map();

    for (const [mac, port] of macToPort) {
        const infobloxEntry = infobloxMap.get(mac);
        const info: DeviceInfo = {
            mac,
            ip: infobloxEntry?.ip,
            hostname: infobloxEntry?.hostname,
        };

        deviceMap.set(port, info);
        deviceMap.set(normalizePortKey(port), info);
    }

    return deviceMap;
};

/**
 * Convenience function that parses raw MAC table and Infoblox CSV strings
 * and returns a DeviceMap.
 */
export const buildDeviceMapFromRaw = (
    macTableRaw: string,
    infobloxRaw: string
): DeviceMap => {
    if (!macTableRaw.trim() && !infobloxRaw.trim()) return new Map();
    const macToPort = parseMacTable(macTableRaw);
    const infobloxMap = parseInfoblox(infobloxRaw);
    return buildDeviceMap(macToPort, infobloxMap);
};
