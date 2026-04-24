import { useEffect } from 'react'
import { useLayoutStore } from '../stores/layoutStore'

const NUMPAD_KEYS: Record<string, string> = {
    'Numpad0': '0', 'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3',
    'Numpad4': '4', 'Numpad5': '5', 'Numpad6': '6', 'Numpad7': '7',
    'Numpad8': '8', 'Numpad9': '9',
}

interface useNumpadProps {
    onRead?: () => void
    onTake?: () => void
    onContinue?: () => void
    onTakeOut?: () => void
}

/**
 * Wires numpad keys to callup buffer + command dispatch.
 * NumPad 0-9     → build callup code (rolling 4 digits)
 * NumpadAdd (+)  → read/load item
 * NumpadSubtract (-) → take
 * NumpadDivide (/)   → continue
 * NumpadMultiply (*) → take out
 */
export function useNumpad({ onRead, onTake, onContinue, onTakeOut }: useNumpadProps = {}) {
    const appendCallup = useLayoutStore(state => state.appendCallup)
    const clearCallup = useLayoutStore(state => state.clearCallup)

    useEffect(() => {
        function handler(e: KeyboardEvent) {
            const target = e.target as HTMLElement
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

            // 1. Digits - Numpad always global, Top-row only if not in input
            const numpadDigit = NUMPAD_KEYS[e.code]
            if (numpadDigit !== undefined) {
                e.preventDefault()
                appendCallup(numpadDigit)
                return
            }

            // Top-row Digits (only if no input is focused)
            if (!isInput && e.code.startsWith('Digit')) {
                const digit = e.code.replace('Digit', '')
                if (/\d/.test(digit)) {
                    e.preventDefault()
                    appendCallup(digit)
                    return
                }
            }

            // 2. Operations - Numpad always global
            switch (e.code) {
                case 'NumpadAdd':
                    e.preventDefault()
                    onRead?.()
                    break
                case 'NumpadSubtract':
                    e.preventDefault()
                    onTake?.()
                    break
                case 'NumpadDivide':
                    e.preventDefault()
                    onContinue?.()
                    break
                case 'NumpadMultiply':
                    e.preventDefault()
                    onTakeOut?.()
                    break
                case 'NumpadDecimal':
                case 'Escape':
                    e.preventDefault()
                    clearCallup()
                    break
                default:
                    // Special case: Enter key (NumpadEnter is often Take as well)
                    // If no input focused, NumpadEnter acts as Take
                    if (e.code === 'NumpadEnter' && !isInput) {
                        e.preventDefault()
                        onTake?.()
                    }
                    break
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onRead, onTake, onContinue, onTakeOut, appendCallup, clearCallup])
}
