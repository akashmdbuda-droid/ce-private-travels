import React, { useEffect, useState } from 'react';

export default function DashboardView({ supabase }) {
  const [stats, setStats] = useState({
    revenueThisMonth: 0,
    newLeads: 0,
    avgBookingValue: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    async function fetchStats() {
      // 1. Fetch leads from current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startOfMonth.toISOString());

      if (leads) {
        let revenue = 0;
        let newL = 0;
        let totalBookingValue = 0;
        let bookedCount = 0;
        let totalResponseMinutes = 0;
        let responseCount = 0;

        leads.forEach(lead => {
          if (lead.current_status === 'New') newL++;
          
          if (lead.final_price) {
            revenue += Number(lead.final_price);
            totalBookingValue += Number(lead.final_price);
            bookedCount++;
          }

          if (lead.first_contacted_at) {
            const created = new Date(lead.created_at);
            const contacted = new Date(lead.first_contacted_at);
            const diffMins = (contacted - created) / 60000;
            if (diffMins > 0) {
              totalResponseMinutes += diffMins;
              responseCount++;
            }
          }
        });

        setStats({
          revenueThisMonth: revenue,
          newLeads: newL,
          avgBookingValue: bookedCount > 0 ? (totalBookingValue / bookedCount) : 0,
          avgResponseTime: responseCount > 0 ? (totalResponseMinutes / responseCount) : 0
        });
      }
    }

    fetchStats();
  }, [supabase]);

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Business Intelligence</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue This Month</p>
          <p className="text-3xl font-black text-indigo-900 mt-1">€{stats.revenueThisMonth.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Leads (Pending)</p>
          <p className="text-3xl font-black text-indigo-900 mt-1">{stats.newLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Booking Value</p>
          <p className="text-3xl font-black text-indigo-900 mt-1">€{stats.avgBookingValue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</p>
          <p className="text-3xl font-black text-indigo-900 mt-1">{Math.round(stats.avgResponseTime)}m</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-indigo-900 mb-4">Lead Funnel Conversion</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>Contacted Rate</span>
                <span>(Feature Pending DB Sync)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
