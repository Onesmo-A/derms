import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { browserStorage } from '@/lib/browser-storage';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    school_id?: string;
    district_id?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: browserStorage.getItem('user') ? JSON.parse(browserStorage.getItem('user')!) : null,
    token: browserStorage.getItem('token'),
    isAuthenticated: !!browserStorage.getItem('token') || !!browserStorage.getItem('user'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string | null }>
        ) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;

            browserStorage.setItem('user', JSON.stringify(user));
            if (token) {
                browserStorage.setItem('token', token);
            }
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;

            browserStorage.removeItem('user');
            browserStorage.removeItem('token');
        },
    },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
