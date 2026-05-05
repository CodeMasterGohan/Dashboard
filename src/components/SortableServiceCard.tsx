import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';

export function SortableServiceCard({ service, handleDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: service.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`bg-[#111111] border border-white/10 p-4 rounded-lg relative group transition-all hover:bg-white/5 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500 scale-105' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 bg-white/5 rounded border border-white/10 flex items-center justify-center font-serif text-lg overflow-hidden shrink-0">
          {service.icon ? (
            <img src={service.icon} alt={service.name} className="w-full h-full object-contain p-1 pointer-events-none" />
          ) : (
            <span className="text-gray-500 pointer-events-none">{service.name.substring(0, 2)}</span>
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
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(service.id); }}
              className="ml-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
              title="Remove Service"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
      
      <a href={service.url} target="_blank" rel="noreferrer" className="block outline-none" onPointerDown={(e) => e.stopPropagation()}>
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
  );
}
