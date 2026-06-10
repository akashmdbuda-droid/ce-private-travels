import React, { useEffect, useState } from 'react';

export default function FleetView({ supabase }) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchFleet() {
    setLoading(true);
    const { data: dData } = await supabase.from('drivers').select('*');
    const { data: vData } = await supabase.from('vehicles').select('*');
    if (dData) setDrivers(dData);
    if (vData) setVehicles(vData);
    setLoading(false);
  }

  useEffect(() => {
    fetchFleet();
  }, [supabase]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Driver & Asset Allocation</h2>
        <button onClick={fetchFleet} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-sm shadow-sm transition">Refresh Data</button>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-indigo-900">Active Drivers</h3>
            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition">+ Add Driver</button>
          </div>
          {loading ? (
             <p className="text-sm text-slate-500 font-medium text-center py-8">Syncing...</p>
          ) : drivers.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium text-center py-8">No drivers synced.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {drivers.map(d => (
                <li key={d.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{d.full_name}</p>
                    <p className="text-xs text-slate-500">{d.phone_number}</p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${d.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {d.active ? 'Active' : 'Offline'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-indigo-900">Fleet Inventory</h3>
            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition">+ Add Vehicle</button>
          </div>
          {loading ? (
             <p className="text-sm text-slate-500 font-medium text-center py-8">Syncing...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium text-center py-8">No vehicles registered.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {vehicles.map(v => (
                <li key={v.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{v.vehicle_name}</p>
                    <p className="text-xs text-slate-500">{v.vehicle_type} • {v.registration_number}</p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${v.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {v.active ? 'Active' : 'Maintenance'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
