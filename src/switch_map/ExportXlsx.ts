import * as XLSX from "xlsx";
import { type Port } from "./Types.ts";
import { type DeviceMap, normalizePortKey } from "./BuildDeviceMap.ts";

const buildFilename = (): string => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `switch-map-export-${date}-${hours}${minutes}.xlsx`;
};

export const exportXlsx = (ports: Port[], deviceMap: DeviceMap): void => {
    const rows = ports.map((port) => {
        const device = deviceMap.get(port.port) || deviceMap.get(normalizePortKey(port.port));
        return {
            "Port": port.port,
            "Description": port.name || "",
            "Status": port.status,
            "VLAN": port.vlan,
            "Speed/Duplex": [port.speed, port.duplex].filter(Boolean).join(" "),
            "MAC Address": device?.mac ?? "",
            "IP Address": device?.ip ?? "",
            "Hostname": device?.hostname ?? "",
            "Patch Panel / Jack": "",
        };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws["!cols"] = [
        { wch: 14 }, // Port
        { wch: 28 }, // Description
        { wch: 14 }, // Status
        { wch: 10 }, // VLAN
        { wch: 16 }, // Speed/Duplex
        { wch: 20 }, // MAC Address
        { wch: 18 }, // IP Address
        { wch: 30 }, // Hostname
        { wch: 20 }, // Patch Panel / Jack
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Switch Ports");
    XLSX.writeFile(wb, buildFilename());
};