import { useEffect, useState } from "react";

interface ToastProps {
    message: string;
    onDone: () => void;
    duration?: number;
}

export const Toast = ({ message, onDone, duration = 2000 }: ToastProps) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onDone]);

    return (
        <div
            className={`fixed top-4 right-4 z-50 px-4 py-2 bg-green-500 text-black text-sm font-semibold rounded shadow-lg transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
        >
            {message}
        </div>
    );
};
