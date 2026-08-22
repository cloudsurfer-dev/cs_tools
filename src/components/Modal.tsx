import { useEffect } from "react";

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal = ({ title, onClose, children, footer }: ModalProps) => {
    // Close on Escape key
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <h2 className="font-bold text-lg text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-lg"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 text-zinc-300">
                    {children}
                </div>

                {footer && (
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex justify-end gap-2.5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
