import { useState } from "react";
import { type Port } from "../switch_map/Types.ts";
import { SwitchVisual, type DisplayMode, DISPLAY_MODES } from "../switch_map/SwitchVisual.tsx";
import { parseIntStatus } from "../switch_map/Parsers/ParseIntStatus.ts";
import { buildDeviceMapFromRaw, type DeviceMap } from "../switch_map/BuildDeviceMap.ts";
import { buildVlanColorMap } from "../switch_map/VlanColors.ts";
import { PingTool } from "../switch_map/PingTool.tsx";
import { InfoPopOver } from "../components/InfoPopOver.tsx";
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
        const key   = match?.[1] ?? "1";
        grouped.set(key, [...(grouped.get(key) ?? []), port]);
    }
    return Array.from(grouped.entries())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([num, ports]) => ({ label: `Switch ${num}`, switchNumber: num, ports }));
};

export const SwitchMap = () => {
    const [intStatusDump, setIntStatusDump] = useState("");
    const [macTableDump,  setMacTableDump]  = useState("");
    const [infobloxDump,  setInfobloxDump]  = useState("");
    const [displayMode,   setDisplayMode]   = useState<DisplayMode>("status");

    const { ports } = parseIntStatus(intStatusDump);

    const switchGroups = groupBySwitchNumber(ports);
    const vlanColorMap = buildVlanColorMap(ports);
    const deviceMap: DeviceMap = buildDeviceMapFromRaw(macTableDump, infobloxDump);
    const hasDeviceData = deviceMap.size > 0;

    console.log("hi");

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <label className="flex justify-between items-center">
                    <div className="font-semibold text-sm flex items-center">
                        <span className="mr-2">show interfaces status</span>
                        <InfoPopOver>Paste the output from "sh int status"</InfoPopOver>
                    </div>
                    <button
                        onClick={() => exportXlsx(ports, deviceMap)}
                        className="px-4 py-2 font-semibold rounded bg-green-600 text-black"
                    >
                        Export to Excel
                    </button>
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
                                Paste a CSV export from Infoblox that has IP, Hostname and MAC columns.
                                Additional fields are ignored.
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
