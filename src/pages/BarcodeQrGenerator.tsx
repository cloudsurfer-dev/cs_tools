import { useState } from "react";
import { type GeneratorTab } from "../barcode_qr/types";
import { BarcodeView } from "../barcode_qr/BarcodeView";
import { QrCodeView } from "../barcode_qr/QrCodeView";
import { BatchGeneratorView } from "../barcode_qr/BatchGeneratorView";
import { Toast } from "../components/Toast";

export const BarcodeQrGenerator = () => {
    const [activeTab, setActiveTab] = useState<GeneratorTab>("barcode");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleShowToast = (msg: string) => {
        setToastMessage(msg);
    };

    return (
        <div className="space-y-8">
            {toastMessage && (
                <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-zinc-800 no-print">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Barcode & QR Code Generator
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("barcode")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === "barcode"
                                ? "bg-indigo-600 text-white shadow"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Barcode
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("qrcode")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === "qrcode"
                                ? "bg-indigo-600 text-white shadow"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        QR Code
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("batch")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === "batch"
                                ? "bg-indigo-600 text-white shadow"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Batch / Bulk
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "barcode" && <BarcodeView onToast={handleShowToast} />}
                {activeTab === "qrcode" && <QrCodeView onToast={handleShowToast} />}
                {activeTab === "batch" && <BatchGeneratorView onToast={handleShowToast} />}
            </div>
        </div>
    );
};
