import { type Port } from "./Types";
import { type DeviceMap } from "./BuildDeviceMap";

export type DisplayMode = "status" | "vlan" | "ip" | "hostname";

export interface DisplayModeOption {
    value: DisplayMode;
    label: string;
    requiresDevice: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const DISPLAY_MODES: DisplayModeOption[] = [
    { value: "status",   label: "Up / Down", requiresDevice: false },
    { value: "vlan",     label: "VLAN",      requiresDevice: false },
    { value: "ip",       label: "IP",        requiresDevice: true  },
    { value: "hostname", label: "Hostname",  requiresDevice: true  },
];

interface SwitchVisualProps {
    ports: Port[];
    displayMode: DisplayMode;
    deviceMap: DeviceMap;
    vlanColorMap: Map<string, string>;
}

const getPortData = (ports: Port[], portNumber: number): Port | undefined =>
    ports.find((p) => {
        const match = p.port.match(/(\d+)$/);
        return match ? Number(match[1]) === portNumber : false;
    });

const getCellText = (port: Port | undefined, mode: DisplayMode, deviceMap: DeviceMap): string => {
    if (!port) return "-";
    const device = deviceMap.get(port.port);
    switch (mode) {
        case "status":   return port.status === "connected" ? "up" : "down";
        case "vlan":     return port.vlan;
        case "ip":       return device?.ip?.split(".").slice(-2).join(".") ?? "-";
        case "hostname": return device?.hostname ?? "-";
    }
};

const buildTooltip = (port: Port | undefined, portNumber: number, deviceMap: DeviceMap): string => {
    if (!port) return `Port: ${portNumber}\nNo data`;
    const device = deviceMap.get(port.port);
    return [
        `Port:     ${port.port}`,
        `Name:     ${port.name || "-"}`,
        `Status:   ${port.status}`,
        `VLAN:     ${port.vlan}`,
        `MAC:      ${device?.mac      ?? "-"}`,
        `IP:       ${device?.ip       ?? "-"}`,
        `Hostname: ${device?.hostname ?? "-"}`,
    ].join("\n");
};

export const SwitchVisual = ({ ports, displayMode, deviceMap, vlanColorMap }: SwitchVisualProps) => {
    const maxPort    = Math.max(0, ...ports.map((p) => Number(p.port.match(/(\d+)$/)?.[1] ?? 0)));
    const portCount  = maxPort >= 48 ? 48 : 24;
    const portNumbers = Array.from({ length: portCount }, (_, i) => i + 1);
    const odd  = portNumbers.filter((n) => n % 2 !== 0);
    const even = portNumbers.filter((n) => n % 2 === 0);

    const renderPort = (num: number) => {
        const data  = getPortData(ports, num);
        const color = vlanColorMap.get(data?.vlan ?? "") ?? "bg-gray-200";
        return (
            <div
                key={num}
                className={`w-16 h-12 flex items-center justify-center font-semibold text-black text-xs ${color}`}
                title={buildTooltip(data, num, deviceMap)}
            >
                {getCellText(data, displayMode, deviceMap)}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                    {odd.map((num) => (
                        <div key={num} className="w-16 text-center font-bold">{num}</div>
                    ))}
                </div>
                <div className="flex gap-2">
                    {odd.map(renderPort)}
                </div>
                <div className="flex gap-2 mt-4">
                    {even.map(renderPort)}
                </div>
                <div className="flex gap-2">
                    {even.map((num) => (
                        <div key={num} className="w-16 text-center font-bold">{num}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};
