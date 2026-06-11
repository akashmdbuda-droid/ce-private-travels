import React, { useState, useEffect } from 'react';
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
  const [pickupFocus, setPickupFocus] = useState(false);
  const [destFocus, setDestFocus] = useState(false);
  
  const [customPickup, setCustomPickup] = useState([]);
  const [customDest, setCustomDest] = useState([]);
  
  const [fields, setFields] = useState({
    pickup: initialPickup, pickupCoords: null,
    destination: initialDestination, destCoords: null,
    fleet: 'Sedan', pax: '1', name: '', phone: '', datetime: '', budget: '', requests: '', quoteFile: null
  });

  useEffect(() => {
    if (fields.pickup.length < 3) { setCustomPickup([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(fields.pickup)}&limit=5`);
        const data = await res.json();
        if (data.features) {
          const filtered = data.features.filter(f => ['AT', 'DE', 'HU'].includes(f.properties.countrycode));
          setCustomPickup(filtered.map(f => ({ name: f.properties.name, city: f.properties.city || f.properties.state, country: f.properties.country, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], id: f.properties.osm_id })));
        }
      } catch (e) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [fields.pickup]);

  useEffect(() => {
    if (fields.destination.length < 3) { setCustomDest([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(fields.destination)}&limit=5`);
        const data = await res.json();
        if (data.features) {
          const filtered = data.features.filter(f => ['AT', 'DE', 'HU'].includes(f.properties.countrycode));
          setCustomDest(filtered.map(f => ({ name: f.properties.name, city: f.properties.city || f.properties.state, country: f.properties.country, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], id: f.properties.osm_id })));
        }
      } catch (e) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [fields.destination]);

  const uiText = {
    en: { title1: "1. Calculate Pricing Range", title2: "2. Confirm via WhatsApp", labelPick: "Pickup Address/City", labelDest: "Destination Address/City", labelFleet: "Vehicle Class", labelPax: "Passengers", labelBudget: "Want the Best Price? (Optional)", budgetHelp: "Have a budget in mind or a quote from another company? Let us know. We review every request personally and will always try to provide our most competitive offer.", labelReq: "Special Requests (Optional)", labelFile: "Already Received Another Quote?", fileHelp: "Upload a screenshot, PDF or photo and we'll review it when preparing your offer.", btnCalc: "Calculate Fare Estimate", btnSubmit: "Confirm on WhatsApp", trust1: "No payment required today", trust2: "Free quote & price discussion", trust3: "Average response: 12 minutes", subText: "Guaranteed response with availability and pricing within 30 minutes during business hours.", priceMatch: "Have a quote from another company? Send it to us on WhatsApp and we'll personally review it to see if we can beat it.", customTitle: "Custom Route Detected", customDesc: "We provide private transfers between ANY city in Europe. Your route requires manual pricing by an operator." },
    de: { title1: "1. Preisspanne Berechnen", title2: "2. Per WhatsApp Bestätigen", labelPick: "Abholadresse/Stadt", labelDest: "Zieladresse/Stadt", labelFleet: "Fahrzeugklasse", labelPax: "Fahrgäste", labelBudget: "Möchten Sie den besten Preis? (Optional)", budgetHelp: "Haben Sie ein Budget im Kopf oder ein Angebot einer anderen Firma? Lassen Sie es uns wissen. Wir prüfen jede Anfrage persönlich und versuchen immer, unser wettbewerbsfähigstes Angebot zu unterbreiten.", labelReq: "Sonderwünsche (Optional)", labelFile: "Haben Sie bereits ein anderes Angebot erhalten?", fileHelp: "Laden Sie einen Screenshot, ein PDF oder ein Foto hoch, und wir berücksichtigen es bei der Erstellung Ihres Angebots.", btnCalc: "Fahrpreis Schätzen", btnSubmit: "Auf WhatsApp Bestätigen", trust1: "Heute keine Zahlung erforderlich", trust2: "Kostenloses Angebot & Preisdiskussion", trust3: "Durchschnittliche Antwortzeit: 12 Minuten", subText: "Garantierte Antwort mit Verfügbarkeit und Preis innerhalb von 30 Minuten während der Geschäftszeiten.", priceMatch: "Haben Sie ein Angebot einer anderen Firma? Senden Sie es uns auf WhatsApp und wir prüfen persönlich, ob wir es unterbieten können.", customTitle: "Individuelle Route", customDesc: "Wir bieten Transfers zwischen ALLEN europäischen Städten an. Diese Route wird manuell kalkuliert." },
    hu: { title1: "1. Árkalkuláció", title2: "2. Megerősítés WhatsApp-on", labelPick: "Indulási Cím/Város", labelDest: "Érkezési Cím/Város", labelFleet: "Gépjármű Kategória", labelPax: "Utasok Száma", labelBudget: "A legjobb árat szeretné? (Opcionális)", budgetHelp: "Van egy elképzelt kerete vagy kapott árajánlatot máshonnan? Tudassa velünk. Minden kérést személyesen megvizsgálunk, és mindig a legversenyképesebb ajánlatot próbáljuk adni.", labelReq: "Különleges Kérések (Opcionális)", labelFile: "Már kapott máshonnan árajánlatot?", fileHelp: "Töltsön fel egy képernyőfotót, PDF-et vagy képet, és mi figyelembe vesszük az ajánlat elkészítésekor.", btnCalc: "Becsült Ár Kiszámítása", btnSubmit: "Megerősítés WhatsApp-on", trust1: "Ma nem szükséges fizetni", trust2: "Ingyenes ajánlat és áregyeztetés", trust3: "Átlagos válaszidő: 12 perc", subText: "Garantált válasz elérhetőséggel és árral 30 percen belül (munkaidőben).", priceMatch: "Kapott már árajánlatot máshonnan? Küldje el nekünk WhatsApp-on, és személyesen megvizsgáljuk, hogy tudunk-e jobbat adni.", customTitle: "Egyedi Útvonal", customDesc: "Bármely európai város között biztosítunk transzfert. Ezt az útvonalat manuálisan árazzuk be." }
  }[lang];

  const rates = { Sedan: 0.55, Van: 0.78, Minibus: 0.98 };

  const fetchCoordinates = async (query) => {
    const known = locations.find(l => l.city.toLowerCase() === query.trim().toLowerCase());
    if (known) return { lat: known.latitude, lon: known.longitude };
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=at,de,hu&limit=1`);
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
    let p1 = fields.pickupCoords;
    if (!p1) p1 = await fetchCoordinates(fields.pickup);

    let p2 = fields.destCoords;
    if (!p2) p2 = await fetchCoordinates(fields.destination);

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
      const priceText = rangeDisplay.min ? `*(Quote Estimate: €${rangeDisplay.min} - €${rangeDisplay.max})*` : `*(Custom Quote Required)*`;
      let msg = `📋 *NEW TRANSFER INQUIRY*%0A%0A`;
      msg += `*Route:* ${fields.pickup} → ${fields.destination}%0A`;
      msg += `*Date:* ${fields.datetime.replace('T', ' ')}%0A`;
      msg += `*Vehicle:* ${fields.fleet === 'Sedan' ? 'Premium Sedan' : fields.fleet === 'Van' ? 'Luxury Van' : 'Executive Minibus'}%0A`;
      msg += `*Passengers:* ${fields.pax}%0A%0A`;
      msg += `*Client Details:*%0A`;
      msg += `*Name:* ${fields.name}%0A`;
      if (fields.budget) msg += `*Target Budget:* €${fields.budget}%0A`;
      if (fields.requests) msg += `%0A*Special Requests / Notes:*%0A${fields.requests}%0A`;
      if (quoteUrl) msg += `%0A*Competitor Quote:* Attached file%0A`;
      msg += `%0A${priceText}`;

      window.location.href = `https://wa.me/36308285603?text=${msg}`;
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

          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelPick}</label>
            <input type="text" value={fields.pickup} onChange={e => setFields({...fields, pickup: e.target.value, pickupCoords: null})} onFocus={() => setPickupFocus(true)} onBlur={() => setTimeout(() => setPickupFocus(false), 200)} placeholder="e.g. Vienna Airport, Hilton Budapest" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" autoComplete="off" />
            {pickupFocus && (
              <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                <li className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 uppercase tracking-widest">Major Cities</li>
                {locations.filter(l => l.city.toLowerCase().includes(fields.pickup.toLowerCase())).map(l => (
                  <li key={l.id} onMouseDown={() => setFields({...fields, pickup: l.city, pickupCoords: {lat: l.latitude, lon: l.longitude}})} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-slate-50">{l.city} <span className="text-slate-400 font-normal text-xs ml-1">{l.country_code}</span></li>
                ))}
                {customPickup.length > 0 && <li className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 uppercase tracking-widest border-t border-slate-100">Specific Addresses</li>}
                {customPickup.map(c => (
                  <li key={`p-${c.id}`} onMouseDown={() => setFields({...fields, pickup: `${c.name}, ${c.city}`, pickupCoords: {lat: c.lat, lon: c.lon}})} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-slate-50">{c.name} <span className="text-slate-400 font-normal text-xs ml-1">{c.city}, {c.country}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelDest}</label>
            <input type="text" value={fields.destination} onChange={e => setFields({...fields, destination: e.target.value, destCoords: null})} onFocus={() => setDestFocus(true)} onBlur={() => setTimeout(() => setDestFocus(false), 200)} placeholder="e.g. Salzburg, Prague" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" autoComplete="off" />
            {destFocus && (
              <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                <li className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 uppercase tracking-widest">Major Cities</li>
                {locations.filter(l => l.city.toLowerCase().includes(fields.destination.toLowerCase())).map(l => (
                  <li key={l.id} onMouseDown={() => setFields({...fields, destination: l.city, destCoords: {lat: l.latitude, lon: l.longitude}})} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-slate-50">{l.city} <span className="text-slate-400 font-normal text-xs ml-1">{l.country_code}</span></li>
                ))}
                {customDest.length > 0 && <li className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 uppercase tracking-widest border-t border-slate-100">Specific Addresses</li>}
                {customDest.map(c => (
                  <li key={`d-${c.id}`} onMouseDown={() => setFields({...fields, destination: `${c.name}, ${c.city}`, destCoords: {lat: c.lat, lon: c.lon}})} className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-slate-50">{c.name} <span className="text-slate-400 font-normal text-xs ml-1">{c.city}, {c.country}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelFleet}</label>
              <select value={fields.fleet} onChange={e => {
                const newFleet = e.target.value;
                const maxPax = newFleet === 'Sedan' ? 4 : newFleet === 'Van' ? 8 : 16;
                let currentPax = parseInt(fields.pax);
                if (currentPax > maxPax) currentPax = maxPax;
                setFields({...fields, fleet: newFleet, pax: currentPax.toString()});
              }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition">
                <option value="Sedan">Premium Sedan</option>
                <option value="Van">Luxury Van</option>
                <option value="Minibus">Executive Minibus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{uiText.labelPax}</label>
              <select value={fields.pax} onChange={e => setFields({...fields, pax: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 transition">
                {(fields.fleet === 'Sedan' ? [1,2,3,4] : fields.fleet === 'Van' ? [1,2,3,4,5,6,7,8] : [1,2,3,4,5,6,7,8,9,10,12,14,16]).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/20 transition transform active:scale-95 text-center block text-sm tracking-tight mt-2">
            {uiText.btnCalc}
          </button>
          <p className="text-center text-[11px] text-slate-400 font-medium px-4 mt-3">
            {lang === 'de' ? "Ihre genaue Adresse ist nicht aufgeführt? Wir fahren an JEDE Adresse, jedes Hotel und jeden Flughafen in unseren Einsatzländern." : lang === 'hu' ? "Nem találja a pontos címet? BÁRMILYEN címre, szállodába vagy repülőtérre vállalunk fuvart a működési területeinken." : "Don't see your specific address? We service ANY address, hotel, or airport across our operating countries."}
          </p>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {rangeDisplay.min ? (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-2xl p-6 text-center text-white shadow-inner mb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Guaranteed Estimated Range</p>
              <p className="text-4xl font-black tracking-tight mt-1">€{rangeDisplay.min} — €{rangeDisplay.max}</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-500 to-orange-700 rounded-2xl p-6 text-center text-white shadow-inner mb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-200">{uiText.customTitle}</p>
              <p className="text-sm font-semibold tracking-tight mt-2 leading-relaxed">{uiText.customDesc}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3 mb-6">
            <div className="flex items-center gap-1.5"><span className="text-green-500 text-sm">✓</span> Professional Driver</div>
            <div className="flex items-center gap-1.5"><span className="text-green-500 text-sm">✓</span> Highway Tolls</div>
            <div className="flex items-center gap-1.5 mt-1"><span className="text-green-500 text-sm">✓</span> Fuel Included</div>
            <div className="flex items-center gap-1.5 mt-1"><span className="text-green-500 text-sm">✓</span> Door-to-Door</div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-black text-indigo-950 tracking-tight">{uiText.title2}</h3>
            <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition">← Back</button>
          </div>
          
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-indigo-950 mb-1">{uiText.labelBudget}</label>
              <p className="text-xs text-slate-500 mb-2 leading-relaxed font-medium">{uiText.budgetHelp}</p>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-bold">€</span>
                <input type="number" min="0" value={fields.budget} onChange={e => setFields({...fields, budget: e.target.value})} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition" />
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <label className="block text-sm font-black text-indigo-950 mb-1">{uiText.labelFile}</label>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed font-medium">{uiText.fileHelp}</p>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="w-full text-xs font-semibold focus:outline-none focus:border-blue-500 transition file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">{uiText.labelReq}</label>
            <textarea value={fields.requests} onChange={e => setFields({...fields, requests: e.target.value})} placeholder="Child seat, wheelchair access, extra luggage..." rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition"></textarea>
          </div>

          <div className="pt-2">
            <div className="bg-green-50/70 border border-green-100 rounded-xl p-4 mb-3">
              <ul className="space-y-2 text-sm font-bold text-green-800">
                <li className="flex items-center gap-2"><span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> {uiText.trust1}</li>
                <li className="flex items-center gap-2"><span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> {uiText.trust2}</li>
                <li className="flex items-center gap-2"><span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> {uiText.trust3}</li>
              </ul>
            </div>
            
            <button type="submit" disabled={isSubmitting} className={`w-full text-white font-black py-4 px-6 rounded-2xl shadow-lg transition tracking-tight text-sm ${isSubmitting ? 'bg-slate-300 cursor-wait' : 'bg-[#25D366] hover:bg-[#1ebd5a] shadow-green-600/30'}`}>
              {isSubmitting ? 'Syncing Infrastructure...' : uiText.btnSubmit}
            </button>
            <p className="text-[11px] text-slate-400 text-center font-medium tracking-tight mt-3 mb-4 px-4 leading-relaxed">{uiText.subText}</p>
            
            <div className="text-center mt-6 border-t border-slate-100 pt-4">
              <a href="https://wa.me/36308285603" target="_blank" className="text-[11px] font-bold text-indigo-500 hover:text-indigo-700 underline decoration-indigo-200 underline-offset-4 transition">
                {uiText.priceMatch}
              </a>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
