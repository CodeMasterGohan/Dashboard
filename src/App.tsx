import React, { useEffect, useState } from 'react';
import { Plus, Search, Server, Globe, Trash2, Cpu, Activity, RefreshCw, Bird } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  url?: string;
  group?: string;
  description?: string;
  icon?: string;
  status: 'online' | 'offline' | 'unknown';
  source: 'manual' | 'docker' | 'plugin';
  metadata?: any;
}

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // Poll every 10s for updates (metadata enrichment takes time)
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      setNewUrl('');
      setShowAdd(false);
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.description?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const groups = filtered.reduce((acc, service) => {
    const group = service.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="bg-[#0a0a0a] text-gray-300 h-screen w-full flex overflow-hidden font-sans select-none">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-[#0d0d0d] flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]">
               <Bird size={18} />
            </div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase italic">Dashboard</h1>
          </div>
          
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="FILTER SERVICES..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-[10px] tracking-wider focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          <nav className="space-y-6">
            <div>
              <p className="text-[10px] text-gray-500 tracking-widest font-bold mb-3">PLUGINS [ACTIVE]</p>
              <ul className="space-y-2">
                <li className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Core:Manager</span>
                  <span className="text-[9px] opacity-40">v1.0</span>
                </li>
                <li className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Metadata:Extract</span>
                  <span className="text-[9px] opacity-40">v1.0</span>
                </li>
                <li className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Docker:Discovery</span>
                  <span className="text-[9px] opacity-40">v1.0</span>
                </li>
                <li className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> AI:Enrichment</span>
                  <span className="text-[9px] opacity-40">v1.0</span>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 tracking-widest font-bold mb-3">SYSTEM METRICS</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] mb-1"><span>CPU</span><span>NOMINAL</span></div>
                  <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: '15%' }}></div></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] mb-1"><span>MEM</span><span>NOMINAL</span></div>
                  <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: '25%' }}></div></div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/50 flex-shrink-0">
          <div className="flex items-center gap-6">
            <span className="text-[10px] tracking-widest font-bold text-gray-500">HOMEPAGE DASHBOARD</span>
            <span className="flex items-center gap-2 text-[10px] tracking-widest font-bold text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> ALL SYSTEMS NOMINAL
            </span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold tracking-widest uppercase rounded hover:bg-indigo-500 transition-colors"
            >
              + Add Service
            </button>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-8">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-400">
              <RefreshCw className="animate-spin" size={24} />
            </div>
          ) : Object.keys(groups).length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <Globe className="mx-auto mb-4 opacity-30" size={48} />
              <h3 className="text-sm font-bold tracking-widest uppercase text-gray-400">No Services Found</h3>
              <p className="mt-2 text-xs text-gray-600">Awaiting Service Discovery Payload</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groups).map(([group, svcs]) => (
                <section key={group}>
                  <h2 className="text-[11px] font-bold tracking-[0.25em] text-indigo-400 uppercase mb-4 flex items-center gap-3">
                    <span>{group}</span>
                    <span className="h-px flex-1 bg-white/5"></span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {svcs.map(service => (
                      <div 
                        key={service.id}
                        className="bg-[#111111] border border-white/10 p-4 rounded-lg relative group transition-all hover:bg-white/5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 bg-white/5 rounded border border-white/10 flex items-center justify-center font-serif text-lg overflow-hidden shrink-0">
                            {service.icon ? (
                              <img src={service.icon} alt={service.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="text-gray-500">{service.name.substring(0, 2)}</span>
                            )}
                          </div>
                          <div className="flex gap-1 items-center flex-wrap justify-end">
                            {service.metadata?.aiEnriched && (
                              <span className="text-[8px] bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded tracking-tighter uppercase font-bold border border-purple-500/30">
                                AI-Enriched
                              </span>
                            )}
                            <span className={`text-[8px] px-2 py-0.5 rounded tracking-tighter uppercase font-bold border ${
                              service.source === 'docker' ? 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30' : 'bg-gray-800 text-gray-400 border-white/10'
                            }`}>
                              {service.source}
                            </span>
                            {service.source === 'manual' && (
                              <button 
                                onClick={(e) => { e.preventDefault(); handleDelete(service.id); }}
                                className="ml-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove Service"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <a href={service.url} target="_blank" rel="noreferrer" className="block outline-none">
                          <h3 className="text-white text-sm font-bold group-hover:text-indigo-400 transition-colors">{service.name}</h3>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                            {service.description || 'Awaiting telemetry...'}
                          </p>
                        </a>
                        
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                          <span className={`text-[9px] uppercase font-bold ${
                            service.status === 'online' ? 'text-emerald-500' :
                            service.status === 'offline' ? 'text-red-500' : 'text-gray-500'
                          }`}>
                            {service.status === 'online' ? 'Healthy' : service.status === 'offline' ? 'Offline' : 'Unknown'}
                          </span>
                          {service.url && (
                             <span className="text-[9px] text-gray-600 max-w-[120px] truncate">
                               {service.url.replace(/^https?:\/\//, '')}
                             </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add New Placeholder per group */}
                    <button 
                      onClick={() => setShowAdd(true)}
                      className="bg-[#111111] border border-white/10 p-4 rounded-lg border-dashed border-white/20 flex flex-col items-center justify-center text-center py-8 group hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <span className="text-lg text-gray-500">+</span>
                      </div>
                      <p className="text-[10px] tracking-widest font-bold text-gray-500 uppercase">Define Entry</p>
                    </button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* EVENT FOOTER */}
        <footer className="h-10 bg-[#080808] border-t border-white/5 flex items-center px-6 gap-6 flex-shrink-0">
          <span className="text-[9px] font-bold tracking-wider text-indigo-500 uppercase">Live Feed</span>
          <div className="flex-1 overflow-hidden h-full flex items-center">
            <p className="text-[10px] text-gray-600 flex items-center gap-4 animate-pulse">
              <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-white/20 rounded-full"></span> AWAITING EVENTS...</span>
            </p>
          </div>
          <div className="text-[9px] text-gray-500 font-mono">
            BUILD: V1.0.0-STABLE
          </div>
        </footer>
      </main>

      {/* Add Service Modal (styled to match theme) */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 rounded w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-[11px] font-bold tracking-[0.25em] text-indigo-400 uppercase mb-6 flex items-center gap-3">
              <span>Register Service</span>
              <span className="h-px flex-1 bg-white/5"></span>
            </h2>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold tracking-widest text-gray-500 mb-2 uppercase">Endpoint URL</label>
                <input 
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-gray-300 transition-colors placeholder:text-gray-700 font-mono"
                />
                <p className="text-[10px] text-gray-600 mt-3 leading-relaxed">
                  The metadata pipeline will automatically fetch title and icon. If allowed, AI heuristics will compute an optimized description.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-[10px] tracking-widest uppercase font-bold text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Terminate
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded text-[10px] tracking-widest uppercase font-bold transition-colors"
                >
                  Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
