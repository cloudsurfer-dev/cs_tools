import { useState } from "react";
import { STATUS_OPTIONS, type Port } from "../switch_map/Types.ts";
import { SwitchVisual, type DisplayMode, DISPLAY_MODES } from "../switch_map/SwitchVisual.tsx";
import { parseMacTable } from "../switch_map/ParseMacTable.ts";
import { parseInfoblox } from "../switch_map/ParseInfoBlox.ts";
import { buildDeviceMap, type DeviceMap } from "../switch_map/BuildDeviceMap.ts";
import { VLAN_COLORS } from "../switch_map/VlanColors.ts";
import { PingTool } from "../switch_map/PingTool.tsx";
import {InfoPopOver} from "../components/InfoPopOver.tsx";

const COLOR_PALETTE = [
    "bg-yellow-400",
    "bg-pink-400",
    "bg-orange-400",
    "bg-cyan-200",
    "bg-teal-700",
    "bg-red-400",
    "bg-indigo-500",
    "bg-lime-400",
    "bg-amber-400",
    "bg-violet-300",
    "bg-emerald-400",
];

interface SwitchGroup {
    label: string;
    switchNumber: string;
    ports: Port[];
}

const parseLine = (line: string): Port | null => {
    const portMatch = line.match(/^(Gi|Fa|Te|Eth|Po)\d+(?:\/\d+)+/i);
    if (!portMatch) return null;
    const portStr = portMatch[0];

    const rest = line.slice(line.indexOf(portStr) + portStr.length).trim();

    const statusIndex = STATUS_OPTIONS.map((s) => rest.indexOf(s)).find((i) => i !== -1);
    if (statusIndex === undefined) return null;

    const name   = rest.slice(0, statusIndex).trim();
    const after  = rest.slice(statusIndex).trim().split(/\s+/);
    const status = after[0] as Port["status"];
    const vlan   = after[1] ?? "unknown";

    return { port: portStr, name, status, vlan };
};

const groupBySwitchNumber = (ports: Port[]): SwitchGroup[] => {
    const grouped = new Map<string, Port[]>();
    for (const port of ports) {
        const match = port.port.match(/^(?:Gi|Fa|Te|Eth|Po)(\d+)/i);
        const key   = match?.[1] ?? "1";
        grouped.set(key, [...(grouped.get(key) ?? []), port]);
    }
    return Array.from(grouped.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([num, ports]) => ({ label: `Switch ${num}`, switchNumber: num, ports }));
};

const buildVlanColorMap = (ports: Port[]): Map<string, string> => {
    // Collect all unique VLANs across all ports in order of first appearance
    const vlans = [...new Set(ports.map((p) => p.vlan))];

    // Palette colours not already claimed by VLAN_COLORS
    const claimedColors  = new Set(Object.values(VLAN_COLORS));
    const availablePalette = COLOR_PALETTE.filter((c) => !claimedColors.has(c));

    const map = new Map<string, string>();
    let paletteIndex = 0;

    for (const vlan of vlans) {
        if (VLAN_COLORS[vlan]) {
            map.set(vlan, VLAN_COLORS[vlan]);
        } else {
            map.set(vlan, availablePalette[paletteIndex % availablePalette.length]);
            paletteIndex++;
        }
    }

    return map;
};

export const SwitchMap = () => {
    const [intStatusDump, setIntStatusDump] = useState("");
    const [macTableDump,  setMacTableDump]  = useState("");
    const [infobloxDump,  setInfobloxDump]  = useState("");
    const [displayMode,   setDisplayMode]   = useState<DisplayMode>("status");

    const ports: Port[] = intStatusDump
        .split("\n")
        .map(parseLine)
        .filter((p): p is Port => p !== null);

    const switchGroups  = groupBySwitchNumber(ports);
    const vlanColorMap  = buildVlanColorMap(ports);

    const deviceMap: DeviceMap = (() => {
        if (!macTableDump.trim() || !infobloxDump.trim()) return new Map();
        const macToPort   = parseMacTable(macTableDump);
        const infobloxMap = parseInfoblox(infobloxDump);
        return buildDeviceMap(macToPort, infobloxMap);
    })();

    const hasDeviceData = deviceMap.size > 0;

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <label className="font-semibold text-sm flex items-center">
                    <span className="mr-2">show interfaces status</span>
                    <InfoPopOver>Paste the output from "sh int status"</InfoPopOver>
                </label>
                <textarea
                    className="border w-full h-32 p-2 font-mono text-sm"
                    value={intStatusDump}
                    onChange={(e) => setIntStatusDump(e.target.value)}
                    placeholder="Paste 'show interfaces status' output here"
                />
            </div>

            <PingTool />

            {ports.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-semibold text-sm flex items-center">
                            <span className="mr-2">show mac address-table</span>
                            <InfoPopOver>Paste the output from "sh mac address-table"</InfoPopOver>
                        </label>
                        <textarea
                            className="border w-full h-32 p-2 font-mono text-sm"
                            value={macTableDump}
                            onChange={(e) => setMacTableDump(e.target.value)}
                            placeholder="Paste 'show mac-address-table' output here"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="font-semibold text-sm flex items-center">
                            <span className="mr-2">Infoblox CSV</span>
                            <InfoPopOver>
                                Paste a CSV export from infoblox that has (in order): IP, Hostname, MAC.
                                <br/>
                                Any additional fields aren't an issue.
                            </InfoPopOver>
                        </label>
                        <textarea
                            className="border w-full h-32 p-2 font-mono text-sm"
                            value={infobloxDump}
                            onChange={(e) => setInfobloxDump(e.target.value)}
                            placeholder="Paste Infoblox CSV export here"
                        />
                    </div>
                </div>
            )}

            {ports.length > 0 && (
                <>
                    <div className="flex gap-2">
                        {DISPLAY_MODES.map(({ value, label, requiresDevice }) => (
                            <button
                                key={value}
                                onClick={() => setDisplayMode(value)}
                                disabled={requiresDevice && !hasDeviceData}
                                className={`px-4 py-2 font-semibold rounded ${
                                    displayMode === value
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-200 text-black"
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Shared VLAN legend */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {Array.from(vlanColorMap.entries()).map(([vlan, color]) => (
                            <div
                                key={vlan}
                                className={`w-16 flex items-center justify-center px-2 py-1 ${color} text-black font-semibold rounded text-center`}
                            >
                                {vlan}
                            </div>
                        ))}
                    </div>

                    {/* One SwitchVisual per switch in the stack */}
                    {switchGroups.map(({ label, switchNumber, ports }) => (
                        <div key={switchNumber} className="space-y-2">
                            <h2 className="font-bold text-lg">{label}</h2>
                            <SwitchVisual
                                ports={ports}
                                displayMode={displayMode}
                                deviceMap={deviceMap}
                                vlanColorMap={vlanColorMap}
                            />
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};