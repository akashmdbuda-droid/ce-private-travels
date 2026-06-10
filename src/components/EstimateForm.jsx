import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

function computeHaversineDistanceKM(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 1.25;
}

export default function EstimateForm({ locations = [], lang = 'en', initialPickup = '', initialDestination = '' }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rangeDisplay, setRangeDisplay] = useState({ min: 0, max: 0 });
  
  const [fields, setFields] = useState({
    pickup: initialPickup, destination: initialDestination, fleet: 'Sedan', pax: '1', name: '', phone: '', datetime: ''
  });

  const uiText = {
    en: { title1: "1. Calculate Pricing Range", title2: "2. Confirm via WhatsApp", labelPick: "Pickup City", labelDest: "Destination City", labelFleet: "Vehicle Class", labelPax: "Passengers", btnCalc: "Calculate Fare Estimate", btnSubmit: "Lock Price via WhatsApp", subText: "Average response: 12 minutes. No upfront automated credit card charges." },
    de: { title1: "1. Preisspanne Berechnen", title2: "2. Per WhatsApp Bestätigen", labelPick: "Abholort", labelDest: "Zielort", labelFleet: "Fahrzeugklasse", labelPax: "Fahrgäste", btnCalc: "Fahrpreis Schätzen", btnSubmit: "Preis via WhatsApp Sichern", subText: "Durchschnittliche Antwortzeit: 12 Min. Keine automatischen Vorauszahlungen." },
    hu: { title1: "1. Árkalkuláció", title2: "2. Megerősítés WhatsApp-on", labelPick: "Indulási Város", labelDest: "Érkezési Város", labelFleet: "Gépjármű Kategória", labelPax: "Utasok Száma", btnCalc: "Becsült Ár Kiszámítása", btnSubmit: "Ár rögzítése WhatsApp-on", subText: "Átlagos válaszidő: 12 perc. Nincs automatikus bankkártya levonás." }
  }[lang];

  const rates = { Sedan: 0.55, Van: 0.78, Minibus: 0.98 };

  const handleCalculate = (e) => {
    e.preventDefault();
    const p1 = locations.find(l => l.city === fields.pickup);
    const p2 = locations.find(l => l.city === fields.destination);

    if (p1 && p2 && p1.city !== p2.city) {
      const distance = computeHaversineDistanceKM(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const baseline = 40 + (distance * rates[fields.fleet]);
      setRangeDisplay({
        min: Math.round((baseline * 0.9) / 5) * 5,
        max: Math.round((baseline * 1.1) / 5) * 5
      });
      setStep(2);
    } else {
      alert(lang === 'hu' ? "Kérjük válasszon két különböző várost!" : "Please select two separate target locations.");
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const slug = `${fields.pickup.toLowerCase()}-to-${fields.destination.toLowerCase()}`;

    const { error } = await supabase.from('leads').insert([{
      pickup_location: fields.pickup,
      destination_location: fields.destination,
      pax_count: parseInt(fields.pax),
      travel_datetime: new Date(fields.datetime).toISOString(),
      customer_name: fields.name,
      whatsapp_number: fields.phone,
      route_slug: slug,
      vehicle_preference: fields.fleet === 'Sedan' ? 'Premium Sedan' : fields.fleet === 'Van' ? 'Luxury Van' : 'Executive Minibus',
      lead_source: 'Google Organic'
    }]);

    if (!error) {
      const msg = `Hi EuroDrive! I requested an estimate (€${rangeDisplay.min} - €${rangeDisplay.max}) from ${fields.pickup} to ${fields.destination} on ${fields.datetime}. Name: ${fields.name}. Send me your best offer!`;
      window.location.href = `https://wa.me/36308285603?text=${encodeURIComponent(msg)}`;
    } else {
      alert("Database serialization error. Connection dropped.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-xl p-6 md:p-8 text-left max-w-xl mx-auto transition-all">
      {step === 1 ? (
        <form onSubmit={handleCalculate} className="space-y-5">
          <h3 className="text-xl font-black text-indigo-950 tracking-tight">{uiText.title1}</h3>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelPick}</label>
            <select value={fields.pickup} onChange={e => setFields({...fields, pickup: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition">
              <option value="">Select departure...</option>
              {locations.map(l => <option key={`p-${l.id}`} value={l.city}>{l.city} ({l.country_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelDest}</label>
            <select value={fields.destination} onChange={e => setFields({...fields, destination: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition">
              <option value="">Select destination...</option>
              {locations.map(l => <option key={`d-${l.id}`} value={l.city}>{l.city} ({l.country_code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelFleet}</label>
              <select value={fields.fleet} onChange={e => setFields({...fields, fleet: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition">
                <option value="Sedan">Premium Sedan</option>
                <option value="Van">Luxury Van</option>
                <option value="Minibus">Executive Minibus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelPax}</label>
              <select value={fields.pax} onChange={e => setFields({...fields, pax: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition">
                {[1,2,3,4,5,6,7,8,9,10,12,14,16].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/20 transition transform active:scale-95 text-center block text-sm tracking-tight mt-2">
            {uiText.btnCalc}
          </button>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-2xl p-6 text-center text-white shadow-inner">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Guaranteed Estimated Range</p>
            <p className="text-4xl font-black tracking-tight mt-1">€{rangeDisplay.min} — €{rangeDisplay.max}</p>
            <p className="text-[11px] text-blue-100/70 mt-2">Includes border dynamic highway vignettes, direct fueling, and luggage configurations.</p>
          </div>
          <h3 className="text-xl font-black text-indigo-950 tracking-tight">{uiText.title2}</h3>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
            <input type="text" required value={fields.name} onChange={e => setFields({...fields, name: e.target.value})} placeholder="Alex Smith" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Number</label>
            <input type="tel" required value={fields.phone} onChange={e => setFields({...fields, phone: e.target.value})} placeholder="+43 660 123 4567" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pickup Date & Time</label>
            <input type="datetime-local" required value={fields.datetime} onChange={e => setFields({...fields, datetime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
          </div>
          <button type="submit" disabled={isSubmitting} className={`w-full text-white font-black py-4 px-6 rounded-2xl shadow-lg transition tracking-tight text-sm ${isSubmitting ? 'bg-slate-300 cursor-wait' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}>
            {isSubmitting ? 'Syncing Flight Infrastructure...' : uiText.btnSubmit}
          </button>
          <p className="text-[11px] text-slate-400 text-center font-medium tracking-tight">{uiText.subText}</p>
        </form>
      )}
    </div>
  );
}
