import { useState, useMemo } from "react";
import { type Port } from "../switch_map/Types.ts";
import { SwitchVisual } from "../switch_map/SwitchVisual.tsx";
import { type DisplayMode, DISPLAY_MODES } from "../switch_map/DisplayModes.ts";
import { parseIntStatus, type Vendor } from "../switch_map/Parsers/ParseIntStatus.ts";
import { buildDeviceMapFromRaw, type DeviceMap, normalizePortKey } from "../switch_map/BuildDeviceMap.ts";
import { buildVlanColorMap } from "../switch_map/VlanColors.ts";
import { PingTool } from "../switch_map/PingTool.tsx";
import { InfoPopOver } from "../components/InfoPopOver.tsx";
import { Toast } from "../components/Toast.tsx";
import { exportXlsx } from "../switch_map/ExportXlsx.ts";

interface SwitchGroup {
    label: string;
    switchNumber: string;
    ports: Port[];
}

const groupBySwitchNumber = (ports: Port[]): SwitchGroup[] => {
    const grouped = new Map<string, Port[]>();
    for (const port of ports) {
        // Cisco: Gi1/0/1 -> key "1", Aruba: 1/1 -> key "1"
        const match = port.port.match(/^(?:[A-Za-z]+)?(\d+)/);
        const key = match?.[1] ?? "1";
        grouped.set(key, [...(grouped.get(key) ?? []), port]);
    }
    return Array.from(grouped.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([num, pList]) => ({ label: `Switch Unit #${num}`, switchNumber: num, ports: pList }));
};

// --- Sample Datasets for 1-Click Demos ---

const SAMPLE_CISCO_INT_STATUS = `Port      Name               Status       Vlan       Duplex  Speed Type
Gi1/0/1   CEO_Workstation    connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/2   Finance_PC_01      connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/3   Finance_PC_02      notconnect   10           auto   auto 10/100/1000BaseTX
Gi1/0/4   Marketing_Mac_01   connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/5   VoIP_Desk_101      connected    20         a-full  a-100 10/100/1000BaseTX
Gi1/0/6   VoIP_Desk_102      connected    20         a-full  a-100 10/100/1000BaseTX
Gi1/0/7   Conf_Room_Polycom  connected    20         a-full  a-100 10/100/1000BaseTX
Gi1/0/8   Visitor_Kiosk      connected    50         a-full  a-100 10/100/1000BaseTX
Gi1/0/9   HR_Printer_HP      connected    40         a-full  a-100 10/100/1000BaseTX
Gi1/0/10  Color_Plotter_Eng  connected    40         a-full a-1000 10/100/1000BaseTX
Gi1/0/11  WAP_Floor1_East    connected    30         a-full a-1000 10/100/1000BaseTX
Gi1/0/12  WAP_Floor1_West    connected    30         a-full a-1000 10/100/1000BaseTX
Gi1/0/13  Door_Access_Ctrl   connected    60         a-full   a-10 10/100/1000BaseTX
Gi1/0/14  HVAC_Controller    connected    60         a-full   a-10 10/100/1000BaseTX
Gi1/0/15  CCTV_Cam_Lobby     connected    70         a-full  a-100 10/100/1000BaseTX
Gi1/0/16  CCTV_Cam_Rear      connected    70         a-full  a-100 10/100/1000BaseTX
Gi1/0/17  NAS_Storage_Backup connected    100        a-full a-1000 10/100/1000BaseTX
Gi1/0/18  DB_App_Server_01   connected    100        a-full a-1000 10/100/1000BaseTX
Gi1/0/19  Web_Proxy_01       connected    100        a-full a-1000 10/100/1000BaseTX
Gi1/0/20  R&D_Test_Station   err-disabled 10           auto   auto 10/100/1000BaseTX
Gi1/0/21  Patch_Desk_21      disabled     10           auto   auto 10/100/1000BaseTX
Gi1/0/22  Patch_Desk_22      notconnect   10           auto   auto 10/100/1000BaseTX
Gi1/0/23  Patch_Desk_23      notconnect   10           auto   auto 10/100/1000BaseTX
Gi1/0/24  Patch_Desk_24      notconnect   10           auto   auto 10/100/1000BaseTX
Gi1/0/25  Dev_Workstation_01 connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/26  Dev_Workstation_02 connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/27  Dev_Workstation_03 notconnect   10           auto   auto 10/100/1000BaseTX
Gi1/0/28  Dev_Workstation_04 connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/29  VoIP_Desk_103      connected    20         a-full  a-100 10/100/1000BaseTX
Gi1/0/30  VoIP_Desk_104      connected    20         a-full  a-100 10/100/1000BaseTX
Gi1/0/31  Security_Station   connected    10         a-full a-1000 10/100/1000BaseTX
Gi1/0/32  Building_Mgmt_Sys  connected    60         a-full  a-100 10/100/1000BaseTX
Gi1/0/33                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/34                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/35                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/36                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/37                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/38                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/39                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/40                     notconnect   1            auto   auto 10/100/1000BaseTX
Gi1/0/41  Lab_Server_A       connected    100        a-full a-1000 10/100/1000BaseTX
Gi1/0/42  Lab_Server_B       connected    100        a-full a-1000 10/100/1000BaseTX
Gi1/0/43  Spare_Uplink       notconnect   trunk        auto   auto 10/100/1000BaseTX
Gi1/0/44  Spare_Uplink       notconnect   trunk        auto   auto 10/100/1000BaseTX
Gi1/0/45  Core_Trunk_Lag_1   connected    trunk      a-full a-1000 10/100/1000BaseTX
Gi1/0/46  Core_Trunk_Lag_2   connected    trunk      a-full a-1000 10/100/1000BaseTX
Gi1/0/47  Uplink_Core_A      connected    trunk      a-full a-1000 10/100/1000BaseTX
Gi1/0/48  Uplink_Core_B      connected    trunk      a-full a-1000 10/100/1000BaseTX`;

const SAMPLE_CISCO_MAC_TABLE = `Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
 10     001a.2b3c.4d01    DYNAMIC     Gi1/0/1
 10     001a.2b3c.4d02    DYNAMIC     Gi1/0/2
 10     001a.2b3c.4d04    DYNAMIC     Gi1/0/4
 20     0050.56a1.b205    DYNAMIC     Gi1/0/5
 20     0050.56a1.b206    DYNAMIC     Gi1/0/6
 20     0050.56a1.b207    DYNAMIC     Gi1/0/7
 50     aabb.cc00.1108    DYNAMIC     Gi1/0/8
 40     0011.2233.4409    DYNAMIC     Gi1/0/9
 40     0011.2233.4410    DYNAMIC     Gi1/0/10
 30     7069.7901.0011    DYNAMIC     Gi1/0/11
 30     7069.7901.0012    DYNAMIC     Gi1/0/12
 60     c025.e901.0013    DYNAMIC     Gi1/0/13
 60     c025.e901.0014    DYNAMIC     Gi1/0/14
 70     b4fb.e401.0015    DYNAMIC     Gi1/0/15
 70     b4fb.e401.0016    DYNAMIC     Gi1/0/16
 100    000c.29a1.b217    DYNAMIC     Gi1/0/17
 100    000c.29a1.b218    DYNAMIC     Gi1/0/18
 100    000c.29a1.b219    DYNAMIC     Gi1/0/19
 10     001a.2b3c.4d25    DYNAMIC     Gi1/0/25
 10     001a.2b3c.4d26    DYNAMIC     Gi1/0/26
 10     001a.2b3c.4d28    DYNAMIC     Gi1/0/28
 20     0050.56a1.b229    DYNAMIC     Gi1/0/29
 20     0050.56a1.b230    DYNAMIC     Gi1/0/30
 10     001a.2b3c.4d31    DYNAMIC     Gi1/0/31
 60     c025.e901.0032    DYNAMIC     Gi1/0/32
 100    000c.29a1.b241    DYNAMIC     Gi1/0/41
 100    000c.29a1.b242    DYNAMIC     Gi1/0/42
Total Mac Addresses for this criterion: 27`;

const SAMPLE_CISCO_INFOBLOX = `"IP Address","MAC Address","Hostname"
"10.10.10.21","00:1A:2B:3C:4D:01","ceo-laptop.corp.local"
"10.10.10.22","00:1A:2B:3C:4D:02","fin-pc-01.corp.local"
"10.10.10.24","00:1A:2B:3C:4D:04","mkt-mac-01.corp.local"
"10.10.20.101","00:50:56:A1:B2:05","phone-desk-101.voip.local"
"10.10.20.102","00:50:56:A1:B2:06","phone-desk-102.voip.local"
"10.10.20.107","00:50:56:A1:B2:07","conf-polycom.voip.local"
"10.10.50.15","AA:BB:CC:00:11:08","kiosk-lobby.guest.local"
"10.10.40.50","00:11:22:33:44:09","printer-hr-hp.corp.local"
"10.10.40.51","00:11:22:33:44:10","plotter-eng.corp.local"
"10.10.30.11","70:69:79:01:00:11","wap-fl1-east.wifi.local"
"10.10.30.12","70:69:79:01:00:12","wap-fl1-west.wifi.local"
"10.10.60.13","C0:25:E9:01:00:13","door-controller-main.iot.local"
"10.10.60.14","C0:25:E9:01:00:14","hvac-bms-unit.iot.local"
"10.10.70.15","B4:FB:E4:01:00:15","cctv-lobby-cam.sec.local"
"10.10.70.16","B4:FB:E4:01:00:16","cctv-rear-cam.sec.local"
"10.10.100.17","00:0C:29:A1:B2:17","synology-nas-01.srv.local"
"10.10.100.18","00:0C:29:A1:B2:18","db-app-primary.srv.local"
"10.10.100.19","00:0C:29:A1:B2:19","squid-proxy-01.srv.local"
"10.10.10.125","00:1A:2B:3C:4D:25","dev-ws-01.corp.local"
"10.10.10.126","00:1A:2B:3C:4D:26","dev-ws-02.corp.local"
"10.10.10.128","00:1A:2B:3C:4D:28","dev-ws-04.corp.local"
"10.10.20.103","00:50:56:A1:B2:29","phone-desk-103.voip.local"
"10.10.20.104","00:50:56:A1:B2:30","phone-desk-104.voip.local"
"10.10.10.131","00:1A:2B:3C:4D:31","guard-desk-pc.corp.local"
"10.10.60.32","C0:25:E9:01:00:32","fire-alarm-panel.iot.local"
"10.10.100.41","00:0C:29:A1:B2:41","lab-hypervisor-01.srv.local"
"10.10.100.42","00:0C:29:A1:B2:42","lab-hypervisor-02.srv.local"`;

const SAMPLE_ARUBA_INT_STATUS = `Port   Name               Status Mode     Speed    Vlan
------ ------------------ ------ -------- -------- ----
1/1    Core-Uplink-Trk1   Up     1000FDx  1000FDx  Trk1
1/2    Core-Uplink-Trk2   Up     1000FDx  1000FDx  Trk1
1/3    Admin-Workstation  Up     1000FDx  1000FDx  10
1/4    Sales-Laptop       Up     1000FDx  1000FDx  10
1/5    Support-PC         Down   Auto     Auto     10
1/6    VoIP-Phone-01      Up     100FDx   100FDx   20
1/7    VoIP-Phone-02      Up     100FDx   100FDx   20
1/8    AP-Aruba-505       Up     1000FDx  1000FDx  30
1/9    AP-Aruba-515       Up     1000FDx  1000FDx  30
1/10   Network-Printer    Up     100FDx   100FDx   40
1/11   Badge-Reader       Up     10FDx    10FDx    60
1/12   Security-Camera    Up     100FDx   100FDx   70
1/13                      Down   Auto     Auto     1
1/14                      Down   Auto     Auto     1
1/15                      Down   Auto     Auto     1
1/16                      Down   Auto     Auto     1
1/17   Backup-Server      Up     1000FDx  1000FDx  100
1/18   Storage-Array      Up     1000FDx  1000FDx  100
1/19                      Down   Auto     Auto     1
1/20                      Down   Auto     Auto     1
1/21                      Down   Auto     Auto     1
1/22                      Down   Auto     Auto     1
1/23   SFP-Fiber-Uplink   Up     10G-SR   10000FDx trunk
1/24   SFP-Fiber-Redund   Up     10G-SR   10000FDx trunk`;

export const SwitchMap = () => {
    const [intStatusDump, setIntStatusDump] = useState("");
    const [macTableDump, setMacTableDump] = useState("");
    const [infobloxDump, setInfobloxDump] = useState("");
    const [displayMode, setDisplayMode] = useState<DisplayMode>("status");
    const [viewLayout, setViewLayout] = useState<"visual" | "table">("visual");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVlanFilter, setSelectedVlanFilter] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
    };

    // Parsers & Data
    const { ports, vendor } = useMemo(() => {
        return parseIntStatus(intStatusDump);
    }, [intStatusDump]);

    const switchGroups = useMemo(() => {
        return groupBySwitchNumber(ports);
    }, [ports]);

    const vlanColorMap = useMemo(() => {
        return buildVlanColorMap(ports);
    }, [ports]);

    const deviceMap: DeviceMap = useMemo(() => {
        return buildDeviceMapFromRaw(macTableDump, infobloxDump);
    }, [macTableDump, infobloxDump]);

    const hasDeviceData = deviceMap.size > 0;

    // Detect unique subnets from device IPs for PingSweep auto-fill
    const detectedSubnets = useMemo(() => {
        const subnets = new Set<string>();
        for (const info of deviceMap.values()) {
            if (info.ip) {
                const match = info.ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
                if (match) {
                    subnets.add(match[1]);
                }
            }
        }
        return Array.from(subnets);
    }, [deviceMap]);

    // Summary Statistics
    const stats = useMemo(() => {
        const total = ports.length;
        const connected = ports.filter((p) => p.status === "connected").length;
        const notconnect = ports.filter((p) => p.status === "notconnect").length;
        const errDisabled = ports.filter((p) => p.status === "err-disabled").length;
        const disabled = ports.filter((p) => p.status === "disabled").length;
        const vlans = new Set(ports.map((p) => p.vlan).filter(Boolean)).size;
        const mappedDevices = Array.from(deviceMap.keys()).filter((k) => !k.startsWith("gi") && !k.startsWith("fa")).length || deviceMap.size / 2;
        const activePct = total > 0 ? Math.round((connected / total) * 100) : 0;

        return { total, connected, notconnect, errDisabled, disabled, vlans, mappedDevices, activePct };
    }, [ports, deviceMap]);

    // Filtered ports for Table view
    const filteredPorts = useMemo(() => {
        return ports.filter((p) => {
            const device = deviceMap.get(p.port) || deviceMap.get(normalizePortKey(p.port));
            if (selectedVlanFilter && p.vlan.toLowerCase() !== selectedVlanFilter.toLowerCase()) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const match =
                    p.port.toLowerCase().includes(q) ||
                    p.name.toLowerCase().includes(q) ||
                    p.vlan.toLowerCase().includes(q) ||
                    p.status.toLowerCase().includes(q) ||
                    (device?.mac && device.mac.toLowerCase().includes(q)) ||
                    (device?.ip && device.ip.toLowerCase().includes(q)) ||
                    (device?.hostname && device.hostname.toLowerCase().includes(q));
                return !!match;
            }
            return true;
        });
    }, [ports, deviceMap, selectedVlanFilter, searchQuery]);

    const handleLoadCiscoDemo = () => {
        setIntStatusDump(SAMPLE_CISCO_INT_STATUS);
        setMacTableDump(SAMPLE_CISCO_MAC_TABLE);
        setInfobloxDump(SAMPLE_CISCO_INFOBLOX);
        showToast("Loaded Cisco Catalyst 48-port switch demo!");
    };

    const handleLoadArubaDemo = () => {
        setIntStatusDump(SAMPLE_ARUBA_INT_STATUS);
        setMacTableDump("");
        setInfobloxDump("");
        showToast("Loaded Aruba 2930F 24-port switch demo!");
    };

    const handleClearAll = () => {
        setIntStatusDump("");
        setMacTableDump("");
        setInfobloxDump("");
        setSelectedVlanFilter(null);
        setSearchQuery("");
        showToast("Cleared all inputs and visual mappings.");
    };

    const handleExportExcel = () => {
        if (ports.length === 0) {
            showToast("No switch ports available to export.");
            return;
        }
        exportXlsx(ports, deviceMap);
        showToast("Exported switch map to Excel (.xlsx)!");
    };

    const handleCopySummary = async () => {
        if (ports.length === 0) return;
        const summaryText = [
            `Switch Port Map Summary (${vendor.toUpperCase()})`,
            `Total Ports: ${stats.total}`,
            `Connected: ${stats.connected} (${stats.activePct}%)`,
            `Disconnected: ${stats.notconnect}`,
            `Error-Disabled: ${stats.errDisabled}`,
            `Admin Disabled: ${stats.disabled}`,
            `VLANs: ${stats.vlans}`,
            `Mapped Devices: ${stats.mappedDevices}`,
        ].join("\n");

        try {
            await navigator.clipboard.writeText(summaryText);
            showToast("Copied switch summary to clipboard!");
        } catch {
            showToast("Failed to copy summary.");
        }
    };

    const getVendorBadge = (v: Vendor) => {
        switch (v) {
            case "cisco":
                return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/40">Cisco IOS / Catalyst</span>;
            case "aruba2930":
                return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-950/80 text-orange-300 border border-orange-500/40">Aruba 2930F / AOS</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">Auto-Detect</span>;
        }
    };

    return (
        <div className="space-y-8 pb-12 w-full">
            {toastMessage && (
                <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
            )}

            {/* Contained Top Section: Header, Presets, Inputs & Ping Sweep */}
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        </span>
                        Switch Port Mapper
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        Parse Cisco & Aruba switch dumps into interactive rack visuals, enriched with MAC tables and Infoblox IP data.
                    </p>
                </div>

                {/* Quick Presets & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleLoadCiscoDemo}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700 flex items-center gap-1.5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Load Cisco 48P Demo
                    </button>
                    <button
                        type="button"
                        onClick={handleLoadArubaDemo}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700 flex items-center gap-1.5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        Load Aruba Demo
                    </button>
                    {ports.length > 0 && (
                        <>
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export Excel
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors border border-zinc-700"
                            >
                                Clear
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Input / Data Ingestion Section */}
            <div className="space-y-4">
                {/* Primary Input: show interfaces status */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-white flex items-center gap-1.5">
                                <span>1. Switch Interfaces Status</span>
                                <span className="text-rose-400 text-xs">*Required</span>
                            </label>
                            <InfoPopOver>
                                Paste output from Cisco <code>show interfaces status</code> or Aruba <code>show interfaces brief / status</code>. Headers and prompt banners are handled automatically.
                            </InfoPopOver>
                        </div>
                        <div className="flex items-center gap-2">
                            {getVendorBadge(vendor)}
                            {ports.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                    {ports.length} Ports Parsed
                                </span>
                            )}
                        </div>
                    </div>

                    <textarea
                        className="w-full p-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 font-mono text-xs sm:text-sm leading-relaxed h-32 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
                        value={intStatusDump}
                        onChange={(e) => setIntStatusDump(e.target.value)}
                        placeholder="Paste 'show interfaces status' (Cisco) or 'show interfaces brief' (Aruba) output here...&#10;&#10;Example:&#10;Port      Name               Status       Vlan       Duplex  Speed Type&#10;Gi1/0/1   Printer_HR         connected    10         a-full a-1000 10/100/1000BaseTX&#10;Gi1/0/2                      notconnect   10           auto   auto 10/100/1000BaseTX"
                    />
                </div>

                {/* Optional Enrichment Inputs (MAC Table & Infoblox CSV) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* MAC Address Table Input */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="text-xs sm:text-sm font-semibold text-zinc-200">
                                    2. MAC Address Table (Optional)
                                </label>
                                <InfoPopOver>
                                    Paste output from Cisco <code>show mac address-table</code> or Aruba <code>show mac-address</code> to map learned MAC addresses directly onto switch ports.
                                </InfoPopOver>
                            </div>
                            <span className="text-xs text-zinc-400 font-mono">
                                {macTableDump.trim() ? "Active" : "Optional"}
                            </span>
                        </div>
                        <textarea
                            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 font-mono text-xs leading-relaxed h-28 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
                            value={macTableDump}
                            onChange={(e) => setMacTableDump(e.target.value)}
                            placeholder="Paste 'show mac address-table' output here...&#10;&#10;Example:&#10; 10    001a.2b3c.4d01    DYNAMIC     Gi1/0/1&#10; 20    0050.56a1.b205    DYNAMIC     Gi1/0/5"
                        />
                    </div>

                    {/* Infoblox CSV Input */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="text-xs sm:text-sm font-semibold text-zinc-200">
                                    3. Infoblox / IPAM CSV (Optional)
                                </label>
                                <InfoPopOver>
                                    Paste a CSV export containing IP, MAC, and Hostname columns (in any column order) to enrich mapped MACs with IP addresses and hostnames.
                                </InfoPopOver>
                            </div>
                            <span className="text-xs text-zinc-400 font-mono">
                                {infobloxDump.trim() ? "Active" : "Optional"}
                            </span>
                        </div>
                        <textarea
                            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 font-mono text-xs leading-relaxed h-28 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
                            value={infobloxDump}
                            onChange={(e) => setInfobloxDump(e.target.value)}
                            placeholder="Paste Infoblox / IPAM CSV export here...&#10;&#10;Example:&#10;&quot;IP Address&quot;,&quot;MAC Address&quot;,&quot;Hostname&quot;&#10;&quot;10.10.10.21&quot;,&quot;00:1A:2B:3C:4D:01&quot;,&quot;ceo-laptop.corp.local&quot;"
                        />
                    </div>
                </div>
            </div>

            {/* Ping Sweep Automation Utility */}
            <PingTool detectedSubnets={detectedSubnets} onToast={showToast} />
            </div>

            {/* Switch Map Results View (Full Width) */}
            {ports.length > 0 && (
                <div className="w-full max-w-[1920px] mx-auto space-y-6 pt-2">
                    {/* Metrics / Statistics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-zinc-400 font-medium block">Total Ports</span>
                            <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-zinc-400 font-medium block">Connected (Up)</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold font-mono text-emerald-400">{stats.connected}</span>
                                <span className="text-xs font-mono text-zinc-500">({stats.activePct}%)</span>
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-zinc-400 font-medium block">Disconnected</span>
                            <span className="text-xl font-bold font-mono text-zinc-400">{stats.notconnect}</span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-zinc-400 font-medium block">Err / Disabled</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold font-mono text-rose-400">{stats.errDisabled}</span>
                                {stats.disabled > 0 && (
                                    <span className="text-xs font-mono text-amber-400">/ {stats.disabled} dis</span>
                                )}
                            </div>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-zinc-400 font-medium block">Active VLANs</span>
                            <span className="text-xl font-bold font-mono text-blue-400">{stats.vlans}</span>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-zinc-400 font-medium block">Device Mappings</span>
                            <span className="text-xl font-bold font-mono text-indigo-400">
                                {hasDeviceData ? stats.mappedDevices : 0}
                            </span>
                        </div>
                    </div>

                    {/* Controls & Toolbar */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Display Mode Pills */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                                    Display Mode:
                                </label>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {DISPLAY_MODES.map(({ value, label, requiresDevice, description }) => {
                                        const disabled = requiresDevice && !hasDeviceData;
                                        const active = displayMode === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setDisplayMode(value)}
                                                disabled={disabled}
                                                title={disabled ? "Requires MAC table or Infoblox CSV" : description}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                    active
                                                        ? "bg-blue-600 text-white font-bold shadow-sm"
                                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                                } disabled:opacity-35 disabled:cursor-not-allowed border border-transparent ${
                                                    active ? "border-blue-400/50" : "border-zinc-700/60"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* View Layout Mode (Visual vs Table) & Summary Copy */}
                            <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
                                <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setViewLayout("visual")}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            viewLayout === "visual"
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        Visual Rack
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewLayout("table")}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            viewLayout === "table"
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        Port Table ({filteredPorts.length})
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCopySummary}
                                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors border border-zinc-700"
                                    title="Copy summary statistics"
                                >
                                    Copy Stats
                                </button>
                            </div>
                        </div>

                        {/* Search and Interactive VLAN Legend */}
                        <div className="pt-3 border-t border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            {/* VLAN Filter Chips */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-zinc-400 font-semibold mr-1 uppercase tracking-wider">VLAN Legend:</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedVlanFilter(null)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                                        selectedVlanFilter === null
                                            ? "bg-white text-zinc-950 shadow-sm"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                    }`}
                                >
                                    All
                                </button>
                                {Array.from(vlanColorMap.entries()).map(([vlan, style]) => {
                                    const active = selectedVlanFilter === vlan;
                                    const count = ports.filter((p) => p.vlan === vlan).length;
                                    return (
                                        <button
                                            key={vlan}
                                            type="button"
                                            onClick={() => setSelectedVlanFilter(active ? null : vlan)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-sm ${
                                                style.solid
                                            } ${
                                                active
                                                    ? "ring-2 ring-white scale-105 shadow-md"
                                                    : "opacity-85 hover:opacity-100 hover:scale-105"
                                            }`}
                                            title={`Filter ports with VLAN ${vlan} (${count} ports)`}
                                        >
                                            <span>{vlan.toLowerCase() === "trunk" ? "trunk" : vlan}</span>
                                            <span className="opacity-75 text-[10px] font-normal">({count})</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search bar */}
                            <div className="relative w-full lg:w-64 flex-shrink-0">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search port, host, IP..."
                                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
                                />
                                <svg
                                    className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2 pointer-events-none"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1.5 text-zinc-500 hover:text-white text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* View: Visual Switch Racks */}
                    {viewLayout === "visual" && (
                        <div className="space-y-6">
                            {switchGroups.map(({ label, switchNumber, ports: switchPorts }) => (
                                <SwitchVisual
                                    key={switchNumber}
                                    ports={switchPorts}
                                    displayMode={displayMode}
                                    deviceMap={deviceMap}
                                    vlanColorMap={vlanColorMap}
                                    searchQuery={searchQuery}
                                    selectedVlan={selectedVlanFilter}
                                    switchTitle={`${vendor === "cisco" ? "Cisco Catalyst" : vendor === "aruba2930" ? "Aruba 2930F" : "Switch"} — ${label}`}
                                    onToast={showToast}
                                />
                            ))}
                        </div>
                    )}

                    {/* View: Searchable Port Data Table */}
                    {viewLayout === "table" && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold text-white text-sm">
                                    Switch Port Records ({filteredPorts.length} of {ports.length} ports)
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                                >
                                    Download XLSX
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                                        <tr>
                                            <th className="py-3 px-4">Port</th>
                                            <th className="py-3 px-4">Description</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">VLAN</th>
                                            <th className="py-3 px-4">Speed / Duplex</th>
                                            <th className="py-3 px-4">MAC Address</th>
                                            <th className="py-3 px-4">IP Address</th>
                                            <th className="py-3 px-4">Hostname</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                                        {filteredPorts.map((p) => {
                                            const dev = deviceMap.get(p.port) || deviceMap.get(normalizePortKey(p.port));
                                            const vlanStyle = vlanColorMap.get(p.vlan);
                                            return (
                                                <tr key={p.port} className="hover:bg-zinc-800/40 transition-colors">
                                                    <td className="py-2.5 px-4 font-bold text-white">{p.port}</td>
                                                    <td className="py-2.5 px-4 text-zinc-300 font-sans">{p.name || "-"}</td>
                                                    <td className="py-2.5 px-4">
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                p.status === "connected"
                                                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                                                                    : p.status === "err-disabled"
                                                                    ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                                                                    : p.status === "disabled"
                                                                    ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                                                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                                            }`}
                                                        >
                                                            {p.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        {vlanStyle ? (
                                                            <span className={`px-2 py-0.5 rounded border text-[11px] ${vlanStyle.badge}`}>
                                                                {p.vlan}
                                                            </span>
                                                        ) : (
                                                            p.vlan
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-zinc-400">
                                                        {[p.speed, p.duplex].filter(Boolean).join(" ") || "-"}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-emerald-400 font-semibold">
                                                        {dev?.mac ?? "-"}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-blue-400 font-semibold">
                                                        {dev?.ip ?? "-"}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-indigo-300">
                                                        {dev?.hostname ?? "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredPorts.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-zinc-500 font-sans">
                                                    No switch ports matched your search criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
