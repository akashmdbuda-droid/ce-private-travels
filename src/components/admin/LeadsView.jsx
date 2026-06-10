import React, { useEffect, useState } from 'react';

export default function LeadsView({ supabase }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setLeads(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchLeads();
  }, [supabase]);

  const updateLeadStatus = async (id, newStatus) => {
    const updateData = { current_status: newStatus };
    if (newStatus === 'Contacted') updateData.first_contacted_at = new Date().toISOString();
    if (newStatus === 'Booked') updateData.booked_at = new Date().toISOString();
    if (newStatus === 'Completed') updateData.completed_at = new Date().toISOString();

    await supabase.from('leads').update(updateData).eq('id', id);
    fetchLeads();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lead Processing Queue</h2>
        <button onClick={fetchLeads} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-sm shadow-sm transition">Refresh Data</button>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Syncing database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">Route</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Travel Date</th>
                  <th className="p-4 font-bold">Source</th>
                  <th className="p-4 font-bold">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-900">
                      {lead.pickup_location} → {lead.destination_location}
                      <span className="block text-xs font-normal text-slate-500">{lead.vehicle_preference || 'Not Specified'}</span>
                    </td>
                    <td className="p-4">
                      {lead.customer_name}
                      <span className="block text-xs font-mono text-indigo-600 mt-1">{lead.whatsapp_number}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {new Date(lead.travel_datetime).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-400">
                      {lead.lead_source}
                    </td>
                    <td className="p-4">
                      <select 
                        value={lead.current_status} 
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none transition ${lead.current_status === 'New' ? 'bg-red-50 text-red-700 border-red-200' : lead.current_status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Negotiating">Negotiating</option>
                        <option value="Booked">Booked</option>
                        <option value="Completed">Completed</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && <div className="p-8 text-center text-slate-500">No leads found in the system.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
