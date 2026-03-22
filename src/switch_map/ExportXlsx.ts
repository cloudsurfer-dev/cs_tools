import * as XLSX from "xlsx";
import { type Port } from "./Types.ts";
import { type DeviceMap } from "./BuildDeviceMap.ts";

const buildFilename = (): string => {
    const now     = new Date();
    const date    = now.toISOString().slice(0, 10);
    const hours   = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `switch-export-${date}-${hours}${minutes}.xlsx`;
};

export const exportXlsx = (ports: Port[], deviceMap: DeviceMap): void => {
    const rows = ports.map((port) => {
        const device = deviceMap.get(port.port);
        return {
            "Port":         port.port,
            "Name":         port.name,
            "Status":       port.status,
            "VLAN":         port.vlan,
            "MAC":          device?.mac      ?? "",
            "IP":           device?.ip       ?? "",
            "Hostname":     device?.hostname ?? "",
            "Patch Panel":  "",
        };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws["!cols"] = [
        { wch: 12 }, // Port
        { wch: 30 }, // Name
        { wch: 14 }, // Status
        { wch: 8  }, // VLAN
        { wch: 20 }, // MAC
        { wch: 16 }, // IP
        { wch: 30 }, // Hostname
        { wch: 16 }, // Patch Panel
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Switch Export");
    XLSX.writeFile(wb, buildFilename());
};