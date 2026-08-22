import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { type BarcodeFormat, type BarcodeSettings } from "./types";
import { downloadSvgAsPng, downloadSvgElement, copySvgToClipboardAsPng } from "./utils";

interface BarcodeViewProps {
    onToast: (msg: string) => void;
}

const FORMAT_DESCRIPTIONS: Record<BarcodeFormat, string> = {
    CODE128: "Code 128 (Auto) - Supports all 128 ASCII characters. Great for general use, asset tags & serial numbers.",
    CODE128A: "Code 128 A - Uppercase letters, digits, control characters.",
    CODE128B: "Code 128 B - Uppercase & lowercase letters, digits, punctuation.",
    CODE128C: "Code 128 C - Optimized for even number of numeric digits (dense).",
    EAN13: "EAN-13 - International standard for retail products (12 or 13 digits).",
    EAN8: "EAN-8 - Compact retail barcode (7 or 8 digits).",
    UPC: "UPC-A - Standard North American retail barcode (11 or 12 digits).",
    CODE39: "Code 39 - Alphanumeric (A-Z, 0-9, space, - . $ / + %).",
    ITF14: "ITF-14 - Interleaved 2 of 5, 14 numeric digits (packaging/shipping).",
    MSI: "MSI / Plessey - Digits only (warehouse & inventory).",
    pharmacode: "Pharmacode - Numeric only (3 to 131070) for pharmaceutical packaging.",
    codabar: "Codabar - Digits and A, B, C, D start/stop characters (libraries, blood banks).",
};

export const BarcodeView = ({ onToast }: BarcodeViewProps) => {
    const [value, setValue] = useState<string>("SWITCH-01-PORT-24");
    const [settings, setSettings] = useState<BarcodeSettings>({
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 16,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 4,
        background: "#ffffff",
        lineColor: "#000000",
        margin: 12,
    });
    const [renderError, setRenderError] = useState<string | null>(null);

    const svgRef = useRef<SVGSVGElement | null>(null);

    const inputError = !value.trim() ? "Please enter a value to generate a barcode." : null;
    const error = inputError || renderError;

    useEffect(() => {
        if (!value.trim()) {
            if (svgRef.current) {
                svgRef.current.innerHTML = "";
            }
            return;
        }

        try {
            if (svgRef.current) {
                JsBarcode(svgRef.current, value, {
                    format: settings.format,
                    width: settings.width,
                    height: settings.height,
                    displayValue: settings.displayValue,
                    fontSize: settings.fontSize,
                    textAlign: settings.textAlign,
                    textPosition: settings.textPosition,
                    textMargin: settings.textMargin,
                    background: settings.background,
                    lineColor: settings.lineColor,
                    margin: settings.margin,
                    valid: (valid) => {
                        if (!valid) {
                            setRenderError(`Invalid data for ${settings.format}. Please check requirements.`);
                            if (svgRef.current) {
                                svgRef.current.innerHTML = "";
                            }
                        } else {
                            setRenderError(null);
                        }
                    },
                });
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            queueMicrotask(() => {
                setRenderError(message || `Invalid data for ${settings.format}`);
            });
            if (svgRef.current) {
                svgRef.current.innerHTML = "";
            }
        }
    }, [value, settings]);

    const handleCopy = async () => {
        if (!svgRef.current || error) return;
        const ok = await copySvgToClipboardAsPng(svgRef.current);
        if (ok) {
            onToast("Barcode copied to clipboard as PNG!");
        } else {
            onToast("Could not copy image directly. Try downloading PNG.");
        }
    };

    const handleDownloadPng = async () => {
        if (!svgRef.current || error) return;
        try {
            const safeName = (value || "barcode").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
            await downloadSvgAsPng(svgRef.current, `barcode-${safeName}.png`, 2);
            onToast("Barcode downloaded as PNG!");
        } catch {
            onToast("Error exporting PNG image.");
        }
    };

    const handleDownloadSvg = () => {
        if (!svgRef.current || error) return;
        const safeName = (value || "barcode").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
        downloadSvgElement(svgRef.current, `barcode-${safeName}.svg`);
        onToast("Barcode downloaded as SVG!");
    };

    const handlePrint = () => {
        if (!svgRef.current || error) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        const svgHtml = svgRef.current.outerHTML;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Barcode - ${value}</title>
                    <style>
                        body {
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            background: #fff;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${svgHtml}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const applySample = (sampleValue: string, format: BarcodeFormat = "CODE128") => {
        setValue(sampleValue);
        setSettings((prev) => ({ ...prev, format }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Barcode Configuration</h3>
                </div>

                {/* Input Value */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-200">Barcode Content / Value</label>
                        <span className="text-xs text-zinc-500">{value.length} characters</span>
                    </div>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Enter text, numbers, asset tag..."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
                    />

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs text-zinc-500 mr-1">Presets:</span>
                        <button
                            type="button"
                            onClick={() => applySample("SWITCH-01-PORT-24", "CODE128")}
                            className="text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        >
                            Switch Port
                        </button>
                        <button
                            type="button"
                            onClick={() => applySample("ASSET-2026-9041", "CODE128")}
                            className="text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        >
                            Asset Tag
                        </button>
                        <button
                            type="button"
                            onClick={() => applySample("1234567890128", "EAN13")}
                            className="text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        >
                            EAN-13
                        </button>
                        <button
                            type="button"
                            onClick={() => applySample("012345678905", "UPC")}
                            className="text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        >
                            UPC-A
                        </button>
                        <button
                            type="button"
                            onClick={() => applySample("SN-987654321", "CODE39")}
                            className="text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        >
                            Code 39
                        </button>
                    </div>
                </div>

                {/* Format selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Barcode Format / Symbology</label>
                    <select
                        value={settings.format}
                        onChange={(e) => setSettings({ ...settings, format: e.target.value as BarcodeFormat })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                    >
                        <option value="CODE128">Code 128 (Standard / Recommended)</option>
                        <option value="CODE128A">Code 128 A (Uppercase & Control)</option>
                        <option value="CODE128B">Code 128 B (Letters & Numbers)</option>
                        <option value="CODE128C">Code 128 C (Numeric only, dense)</option>
                        <option value="CODE39">Code 39 (Alphanumeric)</option>
                        <option value="EAN13">EAN-13 (13 digits retail)</option>
                        <option value="EAN8">EAN-8 (8 digits retail)</option>
                        <option value="UPC">UPC-A (12 digits retail)</option>
                        <option value="ITF14">ITF-14 (14 digits shipping)</option>
                        <option value="MSI">MSI / Plessey (Inventory numbers)</option>
                        <option value="pharmacode">Pharmacode (Pharmaceutical)</option>
                        <option value="codabar">Codabar</option>
                    </select>
                    <p className="text-xs text-zinc-400 mt-1">{FORMAT_DESCRIPTIONS[settings.format]}</p>
                </div>

                {/* Dimensions and layout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-zinc-300">Bar Width</label>
                            <span className="text-xs text-zinc-400 font-mono">{settings.width}px</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={4}
                            step={1}
                            value={settings.width}
                            onChange={(e) => setSettings({ ...settings, width: Number(e.target.value) })}
                            className="w-full accent-indigo-500"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-zinc-300">Height</label>
                            <span className="text-xs text-zinc-400 font-mono">{settings.height}px</span>
                        </div>
                        <input
                            type="range"
                            min={30}
                            max={200}
                            step={5}
                            value={settings.height}
                            onChange={(e) => setSettings({ ...settings, height: Number(e.target.value) })}
                            className="w-full accent-indigo-500"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-zinc-300">Margin / Quiet Zone</label>
                            <span className="text-xs text-zinc-400 font-mono">{settings.margin}px</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={40}
                            step={2}
                            value={settings.margin}
                            onChange={(e) => setSettings({ ...settings, margin: Number(e.target.value) })}
                            className="w-full accent-indigo-500"
                        />
                    </div>
                </div>

                {/* Text Options */}
                <div className="pt-2 border-t border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.displayValue}
                                onChange={(e) => setSettings({ ...settings, displayValue: e.target.checked })}
                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-zinc-200">Display Value Text</span>
                        </label>

                        {settings.displayValue && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-zinc-400">Position:</label>
                                <select
                                    value={settings.textPosition}
                                    onChange={(e) => setSettings({ ...settings, textPosition: e.target.value as "bottom" | "top" })}
                                    className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-white"
                                >
                                    <option value="bottom">Bottom</option>
                                    <option value="top">Top</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {settings.displayValue && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-zinc-400">Font Size</label>
                                    <span className="text-xs text-zinc-400 font-mono">{settings.fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={30}
                                    step={1}
                                    value={settings.fontSize}
                                    onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                                    className="w-full accent-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 block mb-1">Text Alignment</label>
                                <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                                    {(["left", "center", "right"] as const).map((align) => (
                                        <button
                                            key={align}
                                            type="button"
                                            onClick={() => setSettings({ ...settings, textAlign: align })}
                                            className={`flex-1 py-1 text-xs capitalize ${
                                                settings.textAlign === align
                                                    ? "bg-indigo-600 text-white font-medium"
                                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                            }`}
                                        >
                                            {align}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Colors */}
                <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-zinc-300 block mb-2">Bar / Line Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.lineColor}
                                onChange={(e) => setSettings({ ...settings, lineColor: e.target.value })}
                                className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                            />
                            <span className="text-xs font-mono text-zinc-300">{settings.lineColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-300 block mb-2">Background Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.background === "transparent" ? "#ffffff" : settings.background}
                                onChange={(e) => setSettings({ ...settings, background: e.target.value })}
                                className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                            />
                            <span className="text-xs font-mono text-zinc-300">{settings.background}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview & Action Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center">
                    <h3 className="text-base font-semibold text-white mb-4 self-start">Live Preview</h3>

                    <div className="w-full min-h-[220px] bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex items-center justify-center overflow-x-auto">
                        {error && (
                            <div className="text-center p-4">
                                <div className="text-red-400 font-medium text-sm mb-1">Rendering Error</div>
                                <div className="text-xs text-zinc-400">{error}</div>
                            </div>
                        )}
                        <div className={`p-3 bg-white rounded shadow-sm ${error ? "hidden" : "block"}`}>
                            <svg ref={svgRef} className="max-w-full" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full grid grid-cols-2 gap-2.5 mt-6">
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!!error || !value.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Image
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={!!error || !value.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPng}
                            disabled={!!error || !value.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PNG
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadSvg}
                            disabled={!!error || !value.trim()}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Download SVG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
