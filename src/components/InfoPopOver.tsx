import { useEffect, useRef, useState } from "react";

interface InfoPopoverProps {
    children: React.ReactNode;
}

export const InfoPopOver = ({ children }: InfoPopoverProps) => {
    const [open,      setOpen]      = useState(false);
    const [openLeft,  setOpenLeft]  = useState(false);
    const iconRef    = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const toggle = () => {
        if (!open && iconRef.current) {
            const rect     = iconRef.current.getBoundingClientRect();
            const midpoint = window.innerWidth / 2;
            setOpenLeft(rect.left > midpoint);
        }
        setOpen((prev) => !prev);
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e: MouseEvent) => {
            if (
                iconRef.current?.contains(e.target as Node) ||
                popoverRef.current?.contains(e.target as Node)
            ) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
        <div className="relative inline-block">
            {/* Info icon button */}
            <button
                ref={iconRef}
                onClick={toggle}
                className="w-2 h-2 rounded-full border-2 border-current flex items-center justify-center bg-gray-300 text-black hover:text-gray-600 font-bold text-xs leading-none"
                aria-label="Info"
            >
                i
            </button>

            {/* Popover */}
            {open && (
                <div
                    ref={popoverRef}
                    className={`absolute top-6 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-700 ${
                        openLeft ? "right-0" : "left-0"
                    }`}
                >
                    {children}
                </div>
            )}
        </div>
    );
};
