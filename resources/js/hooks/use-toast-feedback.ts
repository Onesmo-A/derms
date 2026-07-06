import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type ToastFeedbackOptions = {
    error?: string;
    success?: string;
    clearError?: () => void;
    clearSuccess?: () => void;
};

export function useToastFeedback({ error, success, clearError, clearSuccess }: ToastFeedbackOptions): void {
    const lastError = useRef('');
    const lastSuccess = useRef('');

    useEffect(() => {
        if (!error || error === lastError.current) {
            return;
        }

        lastError.current = error;
        toast.error(error);
        clearError?.();
    }, [error, clearError]);

    useEffect(() => {
        if (!success || success === lastSuccess.current) {
            return;
        }

        lastSuccess.current = success;
        toast.success(success);
        clearSuccess?.();
    }, [success, clearSuccess]);
}
