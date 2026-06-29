import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppRoutes from '@/routes';

initializeTheme();

if (typeof document !== 'undefined') {
    const container = document.getElementById('app');
    if (container) {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <Provider store={store}>
                    <TooltipProvider delayDuration={0}>
                        <BrowserRouter>
                            <AppRoutes />
                            <Toaster />
                        </BrowserRouter>
                    </TooltipProvider>
                </Provider>
            </React.StrictMode>
        );
    }
}
