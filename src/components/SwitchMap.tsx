import { useState, useMemo } from "react";
import { STATUS_OPTIONS, type Port } from "./Types.ts";
import { SwitchVisual, type DisplayMode, DISPLAY_MODES } from "./SwitchVisual";
import { parseMacTable } from "./ParseMacTable.ts";
import { parseInfoblox } from "./ParseInfoBlox.ts";
import { buildDeviceMap, type DeviceMap } from "./BuildDeviceMap.ts";

const parseLine = (line: string): Port | null => {
    // Match Gi/Fa/Te with any number of slash-separated segments e.g. Gi0/1 or Gi1/0/14
    const portMatch = line.match(/^(Gi|Fa|Te|Eth|Po)\d+(?:\/\d+)+/i);
    if (!portMatch) return null;
    const portStr = portMatch[0];

    const rest = line.slice(line.indexOf(portStr) + portStr.length).trim();

    // Find the status token by scanning for a known value — handles long names with spaces
    const statusIndex = STATUS_OPTIONS.map((s) => rest.indexOf(s)).find((i) => i !== -1);
    if (statusIndex === undefined) return null;

    const name   = rest.slice(0, statusIndex).trim();
    const after  = rest.slice(statusIndex).trim().split(/\s+/);
    const status = after[0] as Port["status"];
    const vlan   = after[1] ?? "unknown";

    return { port: portStr, name, status, vlan };
};

export const SwitchMap = () => {
    const [intStatusDump, setIntStatusDump] = useState("");
    const [macTableDump,  setMacTableDump]  = useState("");
    const [infobloxDump,  setInfobloxDump]  = useState("");
    const [ports,         setPorts]         = useState<Port[]>([]);
    const [displayMode,   setDisplayMode]   = useState<DisplayMode>("status");

    const parse = () => {
        const parsed = intStatusDump
            .split("\n")
            .map(parseLine)
            .filter((p): p is Port => p !== null);
        setPorts(parsed);
    };

    const deviceMap: DeviceMap = useMemo(() => {
        if (!macTableDump.trim()) return new Map();
        const macEntries  = parseMacTable(macTableDump);
        const infobloxMap = infobloxDump.trim() ? parseInfoblox(infobloxDump) : new Map();
        return buildDeviceMap(macEntries, infobloxMap);
    }, [macTableDump, infobloxDump]);

    const hasDeviceData = deviceMap.size > 0;

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-1">
                <label className="font-semibold text-sm">show interfaces status</label>
                <textarea
                    className="border w-full h-32 p-2 font-mono text-sm"
                    value={intStatusDump}
                    onChange={(e) => setIntStatusDump(e.target.value)}
                    placeholder="Paste 'show interfaces status' output here"
                />
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white" onClick={parse}>
                Parse
            </button>

            {ports.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="font-semibold text-sm">show mac-address-table</label>
                        <textarea
                            className="border w-full h-32 p-2 font-mono text-sm"
                            value={macTableDump}
                            onChange={(e) => setMacTableDump(e.target.value)}
                            placeholder="Paste 'show mac-address-table' output here"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="font-semibold text-sm">Infoblox CSV</label>
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
            )}

            {ports.length > 0 && (
                <SwitchVisual
                    ports={ports}
                    displayMode={displayMode}
                    deviceMap={deviceMap}
                />
            )}
        </div>
    );
};
