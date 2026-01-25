import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/api';

const useProfileRefresher = () => {
    const { user, updateUser } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        const refreshProfile = async () => {
            try {
                // Fetch fresh data
                const response = await getUserProfile(user.id);
                const freshData = response.data;

                // Simple check to see if we need to update to avoid infinite loops if we were using this as a dependency
                // But since we only run on mount (or user.id change), it's safe.
                // We'll update if key fields are missing or different.
                // For now, just force update to ensure sync on every full page load/mount of layout.

                if (freshData) {
                    // console.log("[useProfileRefresher] Refreshed user profile:", freshData);
                    updateUser(freshData);
                }
            } catch (err) {
                console.error("[useProfileRefresher] Failed to refresh profile:", err);
            }
        };

        refreshProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);
};

export default useProfileRefresher;
