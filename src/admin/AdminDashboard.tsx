import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminDashboard() {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("user_analytics")
                .select("*")
                .order("created_at", { ascending: false });

            setEvents(data || []);
        };

        load();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <table className="min-w-full border border-white/20 rounded-lg">
                <thead className="bg-white/10">
                    <tr>
                        <th className="p-3">Event Type</th>
                        <th className="p-3">Page</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Details</th>
                        <th className="p-3">Time</th>
                    </tr>
                </thead>

                <tbody>
                    {events.map((ev) => (
                        <tr key={ev.id} className="hover:bg-white/5">
                            <td className="p-3">{ev.event_type}</td>
                            <td className="p-3">{ev.page_visited}</td>
                            <td className="p-3">{ev.user_id}</td>
                            <td className="p-3">{ev.event_detail}</td>
                            <td className="p-3">{new Date(ev.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
