
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Hook to listen for Supabase Realtime changes.
 * @param {string} table - The table to listen to (e.g., 'jobs', 'notifications').
 * @param {Function} callback - Function called when an event occurs. Receives parsed payload.
 * @param {string} event - The event type: 'INSERT', 'UPDATE', 'DELETE', or '*' for all. Default '*'.
 * @param {string} filter - Optional filter string (e.g., 'id=eq.1').
 */
const useSupabaseRealtime = (table, callback, event = '*', filter = null) => {
    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes',
                {
                    event: event,
                    schema: 'public',
                    table: table,
                    filter: filter
                },
                (payload) => {
                    // callback(payload.new || payload.old);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log(`🟢 Subscribed to ${table} changes`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, event, filter]); // Callback removed to prevent re-subscription loops if callback isn't memoized
};

export default useSupabaseRealtime;
