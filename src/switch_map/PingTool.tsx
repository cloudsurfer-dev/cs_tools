import { useState } from "react";
import { Modal } from "../components/Modal";
import { InfoPopOver } from "../components/InfoPopOver";

interface PingToolProps {
    detectedSubnets?: string[];
    onToast?: (msg: string) => void;
}

const parseNetwork = (input: string): string | null => {
    const trimmed = input.trim();
    const match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})(?:\.\d{1,3}(?:\/\d{1,2})?)?$/);
    return match ? match[1] : null;
};

const buildRunCommand = (networks: string[]): string => {
    const subnets = networks.map((n) => `"${n}.0"`).join(",");
    return `.\\PingSweep.ps1 -Subnets ${subnets}`;
};

const downloadScript = async (onToast?: (msg: string) => void) => {
    try {
        const response = await fetch("PingSweep.ps1");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PingSweep.ps1";
        a.click();
        URL.revokeObjectURL(url);
        if (onToast) onToast("Downloaded PingSweep.ps1");
    } catch {
        if (onToast) onToast("Failed to download script.");
    }
};

export const PingTool = ({ detectedSubnets = [], onToast }: PingToolProps) => {
    const [input, setInput] = useState("");
    const [runCommand, setRunCommand] = useState("");
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    const generate = () => {
        setError("");
        const entries = input.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
        const networks: string[] = [];

        for (const entry of entries) {
            const network = parseNetwork(entry);
            if (!network) {
                setError(`Invalid address: "${entry}" — expected format like 192.168.1.0 or 10.0.1.0`);
                return;
            }
            if (!networks.includes(network)) {
                networks.push(network);
            }
        }

        if (networks.length === 0) {
            setError("Please enter at least one subnet or IP address.");
            return;
        }

        setRunCommand(buildRunCommand(networks));
        setShowModal(true);
    };

    const copyCommand = () => {
        navigator.clipboard.writeText(runCommand);
        if (onToast) {
            onToast("Copied PingSweep PowerShell command!");
        }
    };

    const handleAutoFill = () => {
        if (detectedSubnets.length > 0) {
            setInput(detectedSubnets.join(", "));
            if (onToast) {
                onToast(`Loaded ${detectedSubnets.length} subnet${detectedSubnets.length === 1 ? "" : "s"} from mapped IPs!`);
            }
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                            <span>Ping Sweep Subnet Scanner</span>
                            <InfoPopOver>
                                Generates an optimized parallel PowerShell ping sweep command to discover active devices and populate ARP/MAC caches across your subnets.
                            </InfoPopOver>
                        </label>
                        {detectedSubnets.length > 0 && (
                            <button
                                type="button"
                                onClick={handleAutoFill}
                                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Auto-fill from Mapped IPs ({detectedSubnets.length})
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            className="w-full px-3.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                if (error) setError("");
                            }}
                            onKeyDown={(e) => e.key === "Enter" && generate()}
                            placeholder="Enter subnets to sweep, e.g. 192.168.1.0, 10.0.10.0, 172.16.20.0"
                        />
                    </div>
                    {error && <p className="text-rose-400 text-xs font-medium">{error}</p>}
                </div>

                <button
                    type="button"
                    onClick={generate}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Sweep Command
                </button>
            </div>

            {showModal && (
                <Modal
                    title="Ping Sweep PowerShell Command"
                    onClose={() => setShowModal(false)}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => downloadScript(onToast)}
                                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700"
                            >
                                Download PingSweep.ps1
                            </button>
                            <button
                                type="button"
                                onClick={copyCommand}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                            >
                                Copy Command
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4 text-xs">
                        <p className="text-zinc-300 leading-relaxed">
                            Download <code>PingSweep.ps1</code> and run this command in your PowerShell terminal to sweep your targets in parallel:
                        </p>
                        <div className="relative group">
                            <textarea
                                readOnly
                                rows={2}
                                className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400 select-all cursor-pointer resize-none focus:outline-none"
                                value={runCommand}
                                onClick={copyCommand}
                                title="Click to copy"
                            />
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-zinc-400 space-y-1">
                            <div className="font-semibold text-zinc-300">How it works:</div>
                            <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                                <li>Sweeps all hosts across designated subnets concurrently using background runspaces.</li>
                                <li>Fills the switch ARP / MAC address table with active devices.</li>
                                <li>Run <span className="font-mono text-zinc-200">Get-Help .\PingSweep.ps1</span> in PowerShell to see all parameters.</li>
                            </ul>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
