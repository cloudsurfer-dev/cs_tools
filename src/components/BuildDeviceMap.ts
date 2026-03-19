import type {MacEntry} from "./ParseMacTable.ts";
import type {InfobloxEntry} from "./ParseInfoBlox.ts";

export interface DeviceInfo {
    mac: string;
    ip?: string;
    hostname?: string;
}

// Map from port name (e.g. "Gi0/1") to DeviceInfo
export type DeviceMap = Map<string, DeviceInfo>;

/**
 * Joins single-MAC entries with Infoblox data and returns a DeviceMap keyed by port name.
 * Infoblox data is optional — if not provided, DeviceInfo will only contain the MAC.
 * Ports not present in macEntries are omitted from the map.
 */
export const buildDeviceMap = (
    macEntries: MacEntry[],
    infobloxMap: Map<string, InfobloxEntry>
): DeviceMap => {
    const deviceMap: DeviceMap = new Map();

    for (const entry of macEntries) {
        const infoblox = infobloxMap.get(entry.mac);
        deviceMap.set(entry.port, {
            mac:      entry.mac,
            ip:       infoblox?.ip,
            hostname: infoblox?.hostname,
        });
    }

    return deviceMap;
};