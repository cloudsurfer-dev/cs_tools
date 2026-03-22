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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-[640px] max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-bold text-lg">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black text-xl font-bold leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>

                {footer && (
                    <div className="p-4 border-t flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
