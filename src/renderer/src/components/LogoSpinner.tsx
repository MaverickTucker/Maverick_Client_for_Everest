import React from 'react'
import logo from '../assets/logo.png'

interface LogoSpinnerProps {
    size?: number
    className?: string
    style?: React.CSSProperties
}

export function LogoSpinner({ size = 20, className = '', style = {} }: LogoSpinnerProps) {
    return (
        <img
            src={logo}
            alt="Loading..."
            style={{
                width: `${size}px`,
                height: `${size}px`,
                display: 'inline-block',
                ...style
            }}
            className={`animate-spin ${className}`}
        />
    )
}
