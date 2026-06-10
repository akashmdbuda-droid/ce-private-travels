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
  const [isCalculating, setIsCalculating] = useState(false);
  const [rangeDisplay, setRangeDisplay] = useState({ min: 0, max: 0 });
  
  const [fields, setFields] = useState({
    pickup: initialPickup, destination: initialDestination, fleet: 'Sedan', pax: '1', name: '', phone: '', datetime: '', budget: '', requests: '', quoteFile: null
  });

  const uiText = {
    en: { title1: "1. Calculate Pricing Range", title2: "2. Confirm via WhatsApp", labelPick: "Pickup Address/City", labelDest: "Destination Address/City", labelFleet: "Vehicle Class", labelPax: "Passengers", labelBudget: "Target Budget (Optional)", labelReq: "Special Requests (Optional)", labelFile: "Upload Competitor Quote (Optional)", btnCalc: "Calculate Fare Estimate", btnSubmit: "Lock Price via WhatsApp", subText: "Average response: 12 minutes. No upfront automated credit card charges.", customTitle: "Custom Route Detected", customDesc: "We provide private transfers between ANY city in Europe. Your route requires manual pricing by an operator." },
    de: { title1: "1. Preisspanne Berechnen", title2: "2. Per WhatsApp Bestätigen", labelPick: "Abholadresse/Stadt", labelDest: "Zieladresse/Stadt", labelFleet: "Fahrzeugklasse", labelPax: "Fahrgäste", labelBudget: "Zielbudget (Optional)", labelReq: "Sonderwünsche (Optional)", labelFile: "Mitbewerberangebot hochladen", btnCalc: "Fahrpreis Schätzen", btnSubmit: "Preis via WhatsApp Sichern", subText: "Durchschnittliche Antwortzeit: 12 Min. Keine automatischen Vorauszahlungen.", customTitle: "Individuelle Route", customDesc: "Wir bieten Transfers zwischen ALLEN europäischen Städten an. Diese Route wird manuell kalkuliert." },
    hu: { title1: "1. Árkalkuláció", title2: "2. Megerősítés WhatsApp-on", labelPick: "Indulási Cím/Város", labelDest: "Érkezési Cím/Város", labelFleet: "Gépjármű Kategória", labelPax: "Utasok Száma", labelBudget: "Tervezett Költségkeret (Opcionális)", labelReq: "Különleges Kérések (Opcionális)", labelFile: "Konkurens Árajánlat Feltöltése", btnCalc: "Becsült Ár Kiszámítása", btnSubmit: "Ár rögzítése WhatsApp-on", subText: "Átlagos válaszidő: 12 perc. Nincs automatikus bankkártya levonás.", customTitle: "Egyedi Útvonal", customDesc: "Bármely európai város között biztosítunk transzfert. Ezt az útvonalat manuálisan árazzuk be." }
  }[lang];

  const rates = { Sedan: 0.55, Van: 0.78, Minibus: 0.98 };

  const fetchCoordinates = async (query) => {
    const known = locations.find(l => l.city.toLowerCase() === query.trim().toLowerCase());
    if (known) return { lat: known.latitude, lon: known.longitude };
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!fields.pickup.trim() || !fields.destination.trim() || fields.pickup === fields.destination) {
      alert(lang === 'hu' ? "Kérjük válasszon két különböző helyszínt!" : "Please select two separate target locations.");
      return;
    }

    setIsCalculating(true);
    const p1 = await fetchCoordinates(fields.pickup);
    const p2 = await fetchCoordinates(fields.destination);

    if (p1 && p2) {
      const distance = computeHaversineDistanceKM(p1.lat, p1.lon, p2.lat, p2.lon);
      const baseline = 40 + (distance * rates[fields.fleet]);
      setRangeDisplay({
        min: Math.round((baseline * 0.9) / 5) * 5,
        max: Math.round((baseline * 1.1) / 5) * 5
      });
    } else {
      // Custom route fallback - coordinates not found
      setRangeDisplay({ min: null, max: null });
    }
    setIsCalculating(false);
    setStep(2);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be under 10MB");
        return;
      }
      setFields({ ...fields, quoteFile: file });
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let quoteUrl = null;
    if (fields.quoteFile) {
      const fileExt = fields.quoteFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { data: fileData, error: uploadError } = await supabase.storage.from('quotes').upload(fileName, fields.quoteFile);
      if (!uploadError && fileData) {
        const { data: publicUrlData } = supabase.storage.from('quotes').getPublicUrl(fileName);
        quoteUrl = publicUrlData.publicUrl;
      }
    }

    const slug = `${fields.pickup.toLowerCase().replace(/[^a-z0-9]/g, '-')}-to-${fields.destination.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const { error } = await supabase.from('leads').insert([{
      pickup_location: fields.pickup,
      destination_location: fields.destination,
      pax_count: parseInt(fields.pax),
      travel_datetime: new Date(fields.datetime).toISOString(),
      customer_name: fields.name,
      whatsapp_number: fields.phone,
      route_slug: slug,
      vehicle_preference: fields.fleet === 'Sedan' ? 'Premium Sedan' : fields.fleet === 'Van' ? 'Luxury Van' : 'Executive Minibus',
      lead_source: 'Google Organic',
      suggested_budget: fields.budget ? parseFloat(fields.budget) : null,
      special_requests: fields.requests || null,
      competitor_quote_url: quoteUrl
    }]);

    if (!error) {
      const priceText = rangeDisplay.min ? `an estimate (€${rangeDisplay.min} - €${rangeDisplay.max})` : `a custom quote`;
      let msg = `Hi EuroDrive! I requested ${priceText} from ${fields.pickup} to ${fields.destination} on ${fields.datetime}. Name: ${fields.name}. Pax: ${fields.pax}.`;
      if (fields.budget) msg += ` Budget: €${fields.budget}.`;
      if (fields.requests) msg += ` Requests: ${fields.requests}.`;
      if (quoteUrl) msg += ` Competitor Quote attached.`;
      msg += ` Send me your best offer!`;

      window.location.href = `https://wa.me/36308285603?text=${encodeURIComponent(msg)}`;
    } else {
      alert("Database serialization error. Connection dropped.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-xl p-6 md:p-8 text-left max-w-xl mx-auto transition-all relative">
      {isCalculating && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl font-bold text-indigo-900">Calculating Topography...</div>}
      {step === 1 ? (
        <form onSubmit={handleCalculate} className="space-y-5">
          <h3 className="text-xl font-black text-indigo-950 tracking-tight">{uiText.title1}</h3>
          
          <datalist id="locationsList">
            {locations.map(l => <option key={l.id} value={l.city} />)}
          </datalist>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelPick}</label>
            <input type="text" list="locationsList" value={fields.pickup} onChange={e => setFields({...fields, pickup: e.target.value})} placeholder="e.g. Vienna Airport, Hilton Budapest" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelDest}</label>
            <input type="text" list="locationsList" value={fields.destination} onChange={e => setFields({...fields, destination: e.target.value})} placeholder="e.g. Salzburg, Prague" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
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
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {rangeDisplay.min ? (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-2xl p-6 text-center text-white shadow-inner mb-6">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Guaranteed Estimated Range</p>
              <p className="text-4xl font-black tracking-tight mt-1">€{rangeDisplay.min} — €{rangeDisplay.max}</p>
              <p className="text-[11px] text-blue-100/70 mt-2">Includes border dynamic highway vignettes, direct fueling, and luggage configurations.</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-500 to-orange-700 rounded-2xl p-6 text-center text-white shadow-inner mb-6">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-200">{uiText.customTitle}</p>
              <p className="text-sm font-semibold tracking-tight mt-2 leading-relaxed">{uiText.customDesc}</p>
            </div>
          )}
          <h3 className="text-xl font-black text-indigo-950 tracking-tight">{uiText.title2}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
              <input type="text" required value={fields.name} onChange={e => setFields({...fields, name: e.target.value})} placeholder="Alex Smith" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Number</label>
              <input type="tel" required value={fields.phone} onChange={e => setFields({...fields, phone: e.target.value})} placeholder="+43 660..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pickup Date & Time</label>
            <input type="datetime-local" required value={fields.datetime} onChange={e => setFields({...fields, datetime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelBudget}</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-bold">€</span>
                <input type="number" min="0" value={fields.budget} onChange={e => setFields({...fields, budget: e.target.value})} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 line-clamp-1" title={uiText.labelFile}>{uiText.labelFile}</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 transition file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelReq}</label>
            <textarea value={fields.requests} onChange={e => setFields({...fields, requests: e.target.value})} placeholder="Child seat, wheelchair access, extra luggage..." rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full text-white font-black py-4 px-6 rounded-2xl shadow-lg transition tracking-tight text-sm mt-2 ${isSubmitting ? 'bg-slate-300 cursor-wait' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}>
            {isSubmitting ? 'Syncing Infrastructure...' : uiText.btnSubmit}
          </button>
          <p className="text-[11px] text-slate-400 text-center font-medium tracking-tight mt-3">{uiText.subText}</p>
        </form>
      )}
    </div>
  );
}
