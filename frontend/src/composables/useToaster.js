/**
 * Toasters are useful to show the outcome of certain actions/events to the user.
 * The script allows any component to use the toasts by simply importing it
 */

import { useToast } from 'primevue/usetoast';

export function useToaster() {
    const toast = useToast();

    function showSuccess(message, detail) {
        toast.add({
        severity: 'success',
        summary: message,
        detail: detail,
        life: 5000
        });
    }

    function showError(message, detail) {
        toast.add({
        severity: 'error',
        summary: message,
        detail: detail,
        life: 5000
        });
    }

    return {
        showSuccess,
        showError
    };
}