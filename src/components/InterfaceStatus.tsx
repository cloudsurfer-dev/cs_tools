import { useState } from "react";

const STATUS_OPTIONS = ["connected", "notconnect", "disabled", "err-disabled"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const COLOR_PALETTE = [
    "bg-blue-400",
    "bg-green-400",
    "bg-yellow-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-orange-400",
    "bg-cyan-400",
    "bg-teal-400",
];
const DEFAULT_COLOR = "bg-gray-400";

interface Port {
    port: string;
    name: string;
    status: Status | "unknown";
    vlan: string;
}

export const InterfaceStatus = () => {
    const [dump, setDump] = useState("");
    const [ports, setPorts] = useState<Port[]>([]);

    const parseLine = (line: string): Port | null => {
        const portMatch = line.match(/Gi\d+\/\d+\/\d+/);
        if (!portMatch) return null;
        const portStr = portMatch[0];

        const rest = line.slice(line.indexOf(portStr) + portStr.length).trim().split(/\s+/);

        const statusIndex = rest.findIndex((token) => STATUS_OPTIONS.includes(token as Status));
        if (statusIndex === -1) return null;

        const nameTokens = rest.slice(0, statusIndex);
        const name = nameTokens.join(" ");

        const status = rest[statusIndex] as Status;
        const vlan = rest[statusIndex + 1] ?? "unknown";

        return { port: portStr, name, status, vlan };
    };

    const parse = () => {
        const lines = dump.split("\n");
        const parsed = lines
            .map(parseLine)
            .filter((p): p is Port => p !== null);
        setPorts(parsed);
    };

    const vlanToColorMap = (() => {
        const map = new Map<string, string>();
        let colorIndex = 0;
        for (const p of ports) {
            if (!map.has(p.vlan)) {
                map.set(p.vlan, COLOR_PALETTE[colorIndex] || DEFAULT_COLOR);
                colorIndex++;
            }
        }
        return map;
    })();

    const getColor = (vlan: string) => {
        return vlanToColorMap.get(vlan) || DEFAULT_COLOR;
    };

    const portNumbers = Array.from({ length: 48 }, (_, i) => i + 1);
    const getPortData = (portNumber: number): Port | undefined =>
        ports.find((p) => {
            const match = p.port.match(/(\d+)$/);
            return match ? Number(match[1]) === portNumber : false;
        });

    const odd = portNumbers.filter((p) => p % 2 !== 0);
    const even = portNumbers.filter((p) => p % 2 === 0);

    const getCellText = (status?: Status | "unknown") => (status === "connected" ? "up" : "down");

    return (
        <div className="p-4 space-y-4">
            <textarea
                className="border w-full h-40 p-2"
                value={dump}
                onChange={(e) => setDump(e.target.value)}
                placeholder="Paste 'show interface status' output here"
            />
            <button className="px-4 py-2 bg-blue-500 text-white" onClick={parse}>
                Parse
            </button>
            <div className="flex justify-center">
                <div className="flex flex-col gap-1 mt-4">
                    <div className="flex gap-2">
                        {odd.map((num) => (
                            <div key={num} className="w-16 text-center font-bold">
                                {num}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {odd.map((num) => {
                            const data = getPortData(num);
                            const cellText = getCellText(data?.status);
                            return (
                                <div
                                    key={num}
                                    className={`w-16 h-12 flex items-center justify-center  font-semibold text-black ${getColor(
                                        data?.vlan ?? "unknown"
                                    )}`}
                                    title={`Port: ${data?.port ?? num}\nName: ${data?.name || "-"}\nStatus: ${cellText}\nVLAN: ${data?.vlan ?? "-"}`}
                                >
                                    {cellText}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-2 mt-4">
                        {even.map((num) => {
                            const data = getPortData(num);
                            const cellText = getCellText(data?.status);
                            return (
                                <div
                                    key={num}
                                    className={`w-16 h-12 flex items-center justify-center  font-semibold text-black ${getColor(
                                        data?.vlan ?? "unknown"
                                    )}`}
                                    title={`Port: ${data?.port ?? num}\nName: ${data?.name || "-"}\nStatus: ${cellText}\nVLAN: ${data?.vlan ?? "-"}`}
                                >
                                    {cellText}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-2">
                        {even.map((num) => (
                            <div key={num} className="w-16 text-center font-bold">
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-center mt-4">
                <div className="flex flex-wrap gap-2">
                    {Array.from(vlanToColorMap.entries()).map(([vlan, color]) => (
                        <div
                            key={vlan}
                            className={`flex items-center justify-center text-center w-16 gap-1 px-2 py-1 ${color} text-black font-semibold rounded`}
                        >
                            {vlan}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};