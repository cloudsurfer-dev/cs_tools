export type DisplayMode = "status" | "vlan" | "ip" | "hostname" | "name" | "mac";

export interface DisplayModeOption {
    value: DisplayMode;
    label: string;
    requiresDevice: boolean;
    description: string;
}

export const DISPLAY_MODES: DisplayModeOption[] = [
    { value: "status",   label: "Up / Down",      requiresDevice: false, description: "Show connection state (up / down / err)" },
    { value: "vlan",     label: "VLAN",           requiresDevice: false, description: "Show assigned VLAN number or Trunk" },
    { value: "ip",       label: "IP Address",     requiresDevice: true,  description: "Show device IP address (last 2 octets)" },
    { value: "hostname", label: "Hostname",       requiresDevice: true,  description: "Show device hostname from Infoblox" },
    { value: "name",     label: "Description",    requiresDevice: false, description: "Show port description/name" },
    { value: "mac",      label: "MAC Address",    requiresDevice: true,  description: "Show learned MAC address" },
];

export const formatIpLastTwoOctets = (ip?: string): string => {
    if (!ip) return "-";
    const parts = ip.trim().split(".");
    if (parts.length >= 2) {
        return parts.slice(-2).join(".");
    }
    return ip;
};
