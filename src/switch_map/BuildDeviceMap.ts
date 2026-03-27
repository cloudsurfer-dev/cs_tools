import { type InfobloxEntry } from "./ParseInfoBlox.ts";
import { parseMacTable } from "./ParseMacTable.ts";
import { parseInfoblox } from "./ParseInfoBlox.ts";

export interface DeviceInfo {
    mac: string;
    ip?: string;
    hostname?: string;
}

// Map from port name (e.g. "Gi1/0/3") to DeviceInfo
export type DeviceMap = Map<string, DeviceInfo>;

/**
 * Builds a DeviceMap by iterating Infoblox entries as the source of truth
 * and looking up each MAC in the MAC table to find its port.
 * Devices not present in the MAC table are silently skipped —
 * they're either idle or on a different switch.
 */
export const buildDeviceMap = (
    macToPort: Map<string, string>,
    infobloxMap: Map<string, InfobloxEntry>
): DeviceMap => {
    const deviceMap: DeviceMap = new Map();

    for (const [mac, entry] of infobloxMap) {
        const port = macToPort.get(mac);
        if (!port) continue;

        deviceMap.set(port, {
            mac,
            ip:       entry.ip,
            hostname: entry.hostname,
        });
    }

    return deviceMap;
};

/**
 * Convenience function that parses raw MAC table and Infoblox CSV strings
 * and returns a DeviceMap. Returns an empty map if either input is empty.
 */
export const buildDeviceMapFromRaw = (
    macTableRaw: string,
    infobloxRaw: string
): DeviceMap => {
    if (!macTableRaw.trim() || !infobloxRaw.trim()) return new Map();
    const macToPort   = parseMacTable(macTableRaw);
    const infobloxMap = parseInfoblox(infobloxRaw);
    return buildDeviceMap(macToPort, infobloxMap);
};
