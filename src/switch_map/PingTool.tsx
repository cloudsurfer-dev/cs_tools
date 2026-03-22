import { useState } from "react";
import { Modal } from "../components/Modal.tsx";
import { Toast } from "../components/Toast.tsx";
import { InfoPopOver } from "../components/InfoPopOver.tsx";

const parseNetwork = (input: string): string | null => {
    const match = input.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
    return match ? match[1] : null;
};

const buildRunCommand = (networks: string[]): string => {
    const subnets = networks.map((n) => `"${n}.0"`).join(",");
    return `.\\PingSweep.ps1 -Subnets ${subnets}`;
};

const downloadScript = async () => {
    const response = await fetch("PingSweep.ps1");
    const blob     = await response.blob();
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement("a");
    a.href         = url;
    a.download     = "PingSweep.ps1";
    a.click();
    URL.revokeObjectURL(url);
};

export const PingTool = () => {
    const [input,      setInput]      = useState("");
    const [runCommand, setRunCommand] = useState("");
    const [error,      setError]      = useState("");
    const [showModal,  setShowModal]  = useState(false);
    const [showToast,  setShowToast]  = useState(false);

    const generate = () => {
        setError("");
        const entries  = input.split(",").map((s) => s.trim()).filter(Boolean);
        const networks: string[] = [];

        for (const entry of entries) {
            const network = parseNetwork(entry);
            if (!network) {
                setError(`Invalid address: "${entry}" — expected format like 192.168.1.0`);
                return;
            }
            networks.push(network);
        }

        if (networks.length === 0) return;
        setRunCommand(buildRunCommand(networks));
        setShowModal(true);
    };

    const copyCommand = () => {
        navigator.clipboard.writeText(runCommand);
        setShowToast(true);
    };

    return (
        <>
            <div className="flex items-end gap-2">
                <div className="space-y-1 flex-1">
                    <label className="font-semibold text-sm flex items-center">
                        <span className="mr-2">Ping sweep</span>
                        <InfoPopOver>Enter subnets to be pinged separated by comma's.</InfoPopOver>
                    </label>
                    <input
                        type="text"
                        className="border w-full p-2 font-mono text-sm"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && generate()}
                        placeholder="192.168.1.0, 192.168.2.0"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <button
                    onClick={generate}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded"
                >
                    Generate
                </button>
            </div>

            {showModal && (
                <Modal
                    title="Ping sweep"
                    onClose={() => setShowModal(false)}
                    footer={
                        <>
                            <button
                                onClick={downloadScript}
                                className="px-4 py-2 bg-gray-200 text-black font-semibold rounded"
                            >
                                Download PingSweep.ps1
                            </button>
                            <button
                                onClick={copyCommand}
                                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded"
                            >
                                Copy command
                            </button>
                        </>
                    }
                >
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-600">
                            Download the script once, then run this command in PowerShell:
                        </p>
                        <textarea
                            readOnly
                            rows={2}
                            className="border w-full p-2 font-mono text-sm bg-gray-50 cursor-pointer resize-none"
                            value={runCommand}
                            onClick={copyCommand}
                            title="Click to copy"
                        />
                        <p className="text-sm text-gray-600">
                            The script sweeps all hosts in parallel and shows a summary when done.
                            <br/>
                            Run <span className="font-mono text-gray-800">Get-Help .\PingSweep.ps1</span> for all options.
                        </p>
                    </div>
                </Modal>
            )}

            {showToast && (
                <Toast message="Copied!" onDone={() => setShowToast(false)} />
            )}
        </>
    );
};
