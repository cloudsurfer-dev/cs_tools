import {useState} from "react";
import * as React from "react";

export const MacFixer = () => {
    const [input] = useState<string>()
    const [output, setOutput] = useState<string[]>()

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value === '') {
            setOutput([])
            return
        }

        const output = e.target.value
            .trim()
            .split('\n')
            .filter((mac: string) => mac.length === 12)
            .map((mac: string) => mac.toUpperCase().replace(/(.{2})(?=.)/g, '$1:'))

        setOutput(output);
    }

    const copyToClipboard = () => {
        if (!output) return
        navigator.clipboard.writeText(output.join('\n'))
    }
    return (
    <>
        <div className="flex justify-center">
            <div className="mb-2">
                <textarea onChange={handlePaste} value={input} rows={10} className="border"/>
                <textarea value={output?.join('\n')} rows={10} className="border ml-2" readOnly/>
            </div>
        </div>
        <div className="flex justify-center">
            <button onClick={copyToClipboard}>Copy</button>
        </div>
    </>
  )
}

