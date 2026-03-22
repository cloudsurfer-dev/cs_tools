import { type InfobloxEntry } from "./ParseInfoBlox.ts";

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