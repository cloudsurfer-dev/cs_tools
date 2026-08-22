import { useMemo, useRef, useEffect, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { type BarcodeFormat } from "./types";

interface BatchItem {
    id: string;
    value: string;
    label?: string;
}

interface BatchGeneratorViewProps {
    onToast: (msg: string) => void;
}

const BatchBarcodeItem = ({ value, format }: { value: string; format: BarcodeFormat }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, value, {
                    format,
                    width: 1.5,
                    height: 50,
                    displayValue: true,
                    fontSize: 12,
                    margin: 6,
                });
            } catch {
                if (svgRef.current) svgRef.current.innerHTML = "";
            }
        }
    }, [value, format]);

    return <svg ref={svgRef} className="max-w-full" />;
};

const BatchQrItem = ({ value }: { value: string }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            QRCode.toCanvas(canvasRef.current, value, {
                width: 120,
                margin: 1,
                errorCorrectionLevel: "M",
            }).catch(() => {
                const ctx = canvasRef.current?.getContext("2d");
                if (ctx && canvasRef.current) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            });
        }
    }, [value]);

    return (
        <div className="flex flex-col items-center">
            <canvas ref={canvasRef} className="max-w-full" />
            <span className="text-xs font-mono font-semibold text-black mt-2 text-center break-all">{value}</span>
        </div>
    );
};

export const BatchGeneratorView = ({ onToast }: BatchGeneratorViewProps) => {
    const [mode, setMode] = useState<"barcode" | "qrcode">("barcode");
    const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>("CODE128");
    const [rawInput, setRawInput] = useState<string>(
        "SW-01-PORT-01\nSW-01-PORT-02\nSW-01-PORT-03\nSW-01-PORT-04\nSW-01-PORT-05\nSW-01-PORT-06"
    );

    // Sequence Generator state
    const [seqPrefix, setSeqPrefix] = useState<string>("ASSET-");
    const [seqStart, setSeqStart] = useState<number>(1001);
    const [seqCount, setSeqCount] = useState<number>(10);
    const [seqPad, setSeqPad] = useState<number>(4);

    const [columns, setColumns] = useState<number>(3);

    // Parse input lines into items with useMemo
    const items: BatchItem[] = useMemo(() => {
        const lines = rawInput
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        return lines.map((val, idx) => ({
            id: `item-${idx}-${val}`,
            value: val,
            label: val,
        }));
    }, [rawInput]);

    const handleGenerateSequence = () => {
        const generated: string[] = [];
        for (let i = 0; i < seqCount; i++) {
            const num = (seqStart + i).toString().padStart(seqPad, "0");
            generated.push(`${seqPrefix}${num}`);
        }
        setRawInput(generated.join("\n"));
        onToast(`Generated ${seqCount} sequential values!`);
    };

    const handlePrintSheet = () => {
        window.print();
    };

    const handleExportCsv = () => {
        if (!items.length) return;
        const csvContent = "data:text/csv;charset=utf-8," + ["Value", ...items.map((i) => `"${i.value}"`)].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `batch-codes-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onToast("Exported CSV list!");
    };

    return (
        <div className="space-y-6">
            {/* Top configuration box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 no-print">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Batch & Bulk Generator</h3>
                        <p className="text-xs text-zinc-400">Generate, display and print multiple barcode or QR code labels at once.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 p-0.5">
                            <button
                                type="button"
                                onClick={() => setMode("barcode")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    mode === "barcode" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                Barcode Batch
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("qrcode")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    mode === "qrcode" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                QR Code Batch
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Manual List Input */}
                    <div className="lg:col-span-7 space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-zinc-200">List of Values (One per line)</label>
                            <span className="text-xs text-zinc-400">{items.length} items</span>
                        </div>
                        <textarea
                            rows={6}
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            placeholder="SWITCH-01-PORT-01&#10;SWITCH-01-PORT-02&#10;..."
                            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />

                        {mode === "barcode" && (
                            <div className="flex items-center gap-2 pt-1">
                                <label className="text-xs text-zinc-400">Symbology:</label>
                                <select
                                    value={barcodeFormat}
                                    onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
                                    className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-white"
                                >
                                    <option value="CODE128">Code 128 (Standard)</option>
                                    <option value="CODE39">Code 39</option>
                                    <option value="EAN13">EAN-13 (13 digits)</option>
                                    <option value="UPC">UPC-A (12 digits)</option>
                                    <option value="ITF14">ITF-14</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Sequential Generator Tool */}
                    <div className="lg:col-span-5 bg-zinc-950/60 p-4 rounded-lg border border-zinc-800 space-y-3">
                        <div className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
                            Auto Sequence Generator
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[11px] text-zinc-400 block mb-0.5">Prefix</label>
                                <input
                                    type="text"
                                    value={seqPrefix}
                                    onChange={(e) => setSeqPrefix(e.target.value)}
                                    className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-zinc-400 block mb-0.5">Start Number</label>
                                <input
                                    type="number"
                                    value={seqStart}
                                    onChange={(e) => setSeqStart(Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-zinc-400 block mb-0.5">Count</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={200}
                                    value={seqCount}
                                    onChange={(e) => setSeqCount(Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-zinc-400 block mb-0.5">Zero Padding</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={8}
                                    value={seqPad}
                                    onChange={(e) => setSeqPad(Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerateSequence}
                            className="w-full py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-indigo-300 hover:text-white transition-colors"
                        >
                            Generate Sequence
                        </button>
                    </div>
                </div>

                {/* Grid controls & actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-5 mt-5 border-t border-zinc-800">
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-zinc-400">Grid Columns:</label>
                        <div className="flex border border-zinc-700 rounded-lg overflow-hidden">
                            {[1, 2, 3, 4].map((col) => (
                                <button
                                    key={col}
                                    type="button"
                                    onClick={() => setColumns(col)}
                                    className={`px-3 py-1 text-xs ${
                                        columns === col ? "bg-indigo-600 text-white font-medium" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    }`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={!items.length}
                            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
                        >
                            Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={handlePrintSheet}
                            disabled={!items.length}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Label Sheet
                        </button>
                    </div>
                </div>
            </div>

            {/* Generated Items Grid */}
            <div
                className={`grid gap-4 ${
                    columns === 1
                        ? "grid-cols-1"
                        : columns === 2
                        ? "grid-cols-1 md:grid-cols-2"
                        : columns === 3
                        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                }`}
            >
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white text-black p-4 rounded-lg shadow-sm border border-zinc-200 flex flex-col items-center justify-center break-inside-avoid print:shadow-none print:border-zinc-300"
                    >
                        {mode === "barcode" ? (
                            <BatchBarcodeItem value={item.value} format={barcodeFormat} />
                        ) : (
                            <BatchQrItem value={item.value} />
                        )}
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center py-12 text-zinc-500 text-sm">
                    No items to display. Add some values above to generate batch labels.
                </div>
            )}
        </div>
    );
};
