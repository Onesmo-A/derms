import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className = '', alt = 'IDEMS logo', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/logo.png"
            alt={alt}
            className={`block object-contain ${className}`.trim()}
            draggable={false}
        />
    );
}
