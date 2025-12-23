import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Leaf, Mountain, Package, Plus, Trash2, CheckCircle,
  Tent, Flame, Thermometer, Shirt, Zap, BriefcaseMedical,
  Scale, X, Map, Camera, Calendar,
  Coins, Wallet, type LucideProps
} from 'lucide-react';

/**
 * MOSS 3.1 (野苔 - 性能优化版 - TSX)
 * Converted to TypeScript based on MOSS 3.1 logic.
 */

// --- 1. Types & Interfaces ---

interface Category {
  id: string;
  name: string;
  icon: React.ReactElement<LucideProps>;
  color: string;
  bg: string;
  lightBg: string;
  text: string;
}

interface GearItem {
  id: number;
  name: string;
  category: string;
  weight: number;
  price: number;
  date: string;
  source: string;
  image: string | null;
}

interface CategoryStat {
  id: string;
  value: number;
  catConfig: Category;
  percent: number;
}

// --- 2. Constants & Colors ---

const CATEGORIES: Category[] = [
  { id: 'shelter', name: '庇护所', icon: <Tent size={24} />, color: '#57534e', bg: 'bg-stone-600', lightBg: 'bg-stone-100', text: 'text-stone-800' },
  { id: 'sleep', name: '睡眠系统', icon: <Thermometer size={24} />, color: '#c2410c', bg: 'bg-orange-700', lightBg: 'bg-orange-50', text: 'text-orange-900' },
  { id: 'kitchen', name: '炊具饮食', icon: <Flame size={24} />, color: '#7f1d1d', bg: 'bg-red-900', lightBg: 'bg-red-50', text: 'text-red-900' },
  { id: 'clothing', name: '衣物鞋帽', icon: <Shirt size={24} />, color: '#1e3a8a', bg: 'bg-blue-900', lightBg: 'bg-blue-50', text: 'text-blue-900' },
  { id: 'electronics', name: '电子设备', icon: <Zap size={24} />, color: '#ca8a04', bg: 'bg-yellow-600', lightBg: 'bg-yellow-50', text: 'text-yellow-900' },
  { id: 'hygiene', name: '洗漱急救', icon: <BriefcaseMedical size={24} />, color: '#047857', bg: 'bg-emerald-700', lightBg: 'bg-emerald-50', text: 'text-emerald-900' },
  { id: 'misc', name: '其他杂项', icon: <Package size={24} />, color: '#4b5563', bg: 'bg-gray-600', lightBg: 'bg-gray-100', text: 'text-gray-800' },
];

const MOCK_GEAR: GearItem[] = [
  { id: 1, name: 'BigAgnes 飞溪 UL2', category: 'shelter', weight: 1100, price: 2800, date: '2023-10-01', source: '淘宝', image: null },
  { id: 2, name: '黑冰 B700 睡袋', category: 'sleep', weight: 740, price: 1200, date: '2023-10-05', source: '京东', image: null },
  { id: 3, name: '雪峰 钛杯 450ml', category: 'kitchen', weight: 70, price: 350, date: '2024-01-12', source: '实体店', image: null },
  { id: 4, name: 'Soto 310 炉头', category: 'kitchen', weight: 350, price: 420, date: '2024-02-20', source: '亚马逊', image: null },
  { id: 5, name: 'Arc\'teryx Beta LT', category: 'clothing', weight: 395, price: 4500, date: '2024-03-01', source: '专柜', image: null },
];

// --- 3. Helper Components (Extracted) ---

interface StrataChartProps {
  data: CategoryStat[];
}

const StrataChart: React.FC<StrataChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  let currentY = 0;
  
  const layers = data.map((item) => {
    if (item.percent <= 0) return null;
    const height = item.percent;
    const startY = currentY;
    const endY = currentY + height;
    currentY += height;

    return { ...item, startY, endY, color: item.catConfig.color };
  }).filter((layer): layer is NonNullable<typeof layer> => layer !== null);

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-stone-100 shadow-inner">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {layers.map((layer, i) => {
            const waveHeight = 3;
            const yBottom = layer.endY;
            const cp1 = yBottom - waveHeight + ((i * 17) % (waveHeight * 2));
            const cp2 = yBottom + waveHeight - ((i * 23) % (waveHeight * 2));
            
            // Generate path string
            let d = "";
            if (i === 0) {
                d += `M 0 0 L 100 0`;
            } else {
                const prevY = layers[i-1].endY;
                const prevCp1 = prevY - waveHeight + (((i-1) * 17) % (waveHeight * 2));
                const prevCp2 = prevY + waveHeight - (((i-1) * 23) % (waveHeight * 2));
                d += `M 0 ${prevY} C 30 ${prevCp1}, 70 ${prevCp2}, 100 ${prevY}`;
            }
            d += ` L 100 ${yBottom}`;
            if (i === layers.length - 1) {
                d += ` L 0 100`;
            } else {
                d += ` C 70 ${cp2}, 30 ${cp1}, 0 ${yBottom}`;
            }
            d += ` Z`;

            return (
                <g key={layer.id}>
                    <path d={d} fill={layer.color} stroke="none" />
                    {layer.percent > 10 && (
                        <text x="50" y={layer.startY + (layer.percent/2)} dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold" className="opacity-90" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
                            {layer.catConfig.name} {layer.percent.toFixed(0)}%
                        </text>
                    )}
                </g>
            );
        })}
      </svg>
    </div>
  );
};

// --- Extracted Views to prevent re-renders ---

interface DashboardViewProps {
  gearList: GearItem[];
  totalWeight: number;
  totalPrice: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ gearList, totalWeight, totalPrice }) => {
  const categoryStats = useMemo<CategoryStat[]>(() => {
    const stats: Record<string, number> = {};
    CATEGORIES.forEach(c => stats[c.id] = 0);
    gearList.forEach(item => {
      if (stats[item.category] !== undefined) stats[item.category] += item.weight;
    });
    return CATEGORIES.map(cat => ({
      id: cat.id,
      value: stats[cat.id] || 0,
      catConfig: cat,
      percent: totalWeight > 0 ? ((stats[cat.id] || 0) / totalWeight) * 100 : 0
    })).filter(s => s.value > 0);
  }, [gearList, totalWeight]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-stone-800"><Leaf size={64} /></div>
          <span className="text-stone-500 font-medium flex items-center gap-2"><Leaf size={18} /> 总重量</span>
          <div>
            <span className="text-5xl font-light text-stone-800 tracking-tighter">{(totalWeight / 1000).toFixed(2)}</span>
            <span className="text-stone-400 ml-2 text-lg">kg</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-800"><Coins size={64} /></div>
          <span className="text-stone-500 font-medium flex items-center gap-2"><Wallet size={18} /> 总资产</span>
          <div>
            <span className="text-2xl text-stone-400 mr-1">¥</span>
            <span className="text-5xl font-light text-stone-800 tracking-tighter">{totalPrice.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-stone-800 text-stone-100 p-6 rounded-3xl shadow-lg flex flex-col justify-between h-40 relative overflow-hidden">
           <div className="absolute -right-6 -top-6 opacity-10 transform rotate-12"><Mountain size={150} /></div>
          <span className="opacity-60 font-medium z-10 flex items-center gap-2"><Package size={18} /> 装备数量</span>
          <span className="text-5xl font-light z-10">{gearList.length}</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        <h3 className="text-lg font-medium text-stone-700 mb-6 flex items-center gap-2"><Map size={20} /> 装备构成地层图 (Geological Layers)</h3>
        <div className="mb-8">
          {totalWeight > 0 ? <StrataChart data={categoryStats} /> : <div className="h-32 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300">暂无地质数据</div>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryStats.map((stat) => (
              <div key={stat.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.catConfig.color }}></div>
                  <div>
                      <div className="text-sm font-medium text-stone-700">{stat.catConfig.name}</div>
                      <div className="text-xs text-stone-400">{stat.value}g ({stat.percent.toFixed(1)}%)</div>
                  </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface GearViewProps {
  gearList: GearItem[];
  setIsAddModalOpen: (isOpen: boolean) => void;
  handleDeleteGear: (id: number) => void;
}

const GearView: React.FC<GearViewProps> = ({ gearList, setIsAddModalOpen, handleDeleteGear }) => (
  <div className="space-y-6 animate-fade-in pb-24">
     <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
      <div>
         <h2 className="text-3xl font-light text-stone-800">装备库</h2>
         <p className="text-stone-500 text-sm mt-1">记录每一次徒步的伙伴</p>
      </div>
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <Plus size={18} /> 新增装备
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {gearList.map((item) => {
          const category = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[6];
          return (
            <div key={item.id} className="bg-white hover:shadow-md transition-all p-0 rounded-2xl border border-stone-200 overflow-hidden group flex flex-col sm:flex-row h-auto sm:h-36">
              <div className="w-full sm:w-36 h-36 flex-shrink-0 relative overflow-hidden">
                 {item.image ? (
                   <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className={`w-full h-full flex items-center justify-center ${category.lightBg} ${category.text}`}>
                      <div className="transform group-hover:scale-110 transition-transform duration-300">
                           {React.cloneElement(category.icon, { size: 56, strokeWidth: 1.5 })}
                      </div>
                   </div>
                 )}
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between relative">
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden">
                    <h3 className="font-medium text-stone-800 text-lg truncate">{item.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${category.lightBg} ${category.text} font-medium`}>{category.name}</span>
                      <span className="text-xs text-stone-400 flex items-center gap-1"><Calendar size={10} /> {item.date}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteGear(item.id)} className="text-stone-300 hover:text-red-400 transition-colors p-1"><Trash2 size={16} /></button>
                </div>
                <div className="flex justify-between items-end mt-2">
                   <div className="flex items-end gap-1">
                      {item.source && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md mb-0.5 mr-2">{item.source}</span>}
                      <span className="font-mono text-stone-800 font-medium text-lg">{item.weight}<span className="text-xs text-stone-400 font-normal ml-0.5">g</span></span>
                   </div>
                   {item.price > 0 && <span className="text-sm font-medium text-stone-400">¥{item.price}</span>}
                </div>
              </div>
            </div>
          );
      })}
    </div>
  </div>
);

interface PackerViewProps {
  gearList: GearItem[];
  packList: number[];
  packedStatus: Record<number, boolean>;
  toggleToPack: (id: number) => void;
  togglePhysicalPack: (id: number) => void;
  packTotalWeight: number;
}

const PackerView: React.FC<PackerViewProps> = ({ gearList, packList, packedStatus, toggleToPack, togglePhysicalPack, packTotalWeight }) => {
  const allItems = gearList;
  const packedItemsList = gearList.filter(g => packList.includes(g.id));
  const sortedPackedItems = [...packedItemsList].sort((a,b) => (packedStatus[a.id] === packedStatus[b.id] ? 0 : packedStatus[a.id] ? 1 : -1));

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in">
      <div className="flex-none h-1/3 bg-white rounded-3xl border border-stone-200 p-4 flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-3 px-2">
          <h3 className="font-medium text-stone-500 flex items-center gap-2"><Leaf size={16} /> 装备墙 (点击加入打包)</h3>
          <span className="text-xs text-stone-400">{gearList.length} items</span>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 flex gap-3 snap-x">
           {allItems.map(item => {
             const isSelected = packList.includes(item.id);
             const category = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[6];
             return (
               <button
                 key={item.id}
                 onClick={() => toggleToPack(item.id)}
                 className={`
                   flex-none w-32 h-full rounded-xl border flex flex-col overflow-hidden relative transition-all duration-300 snap-center
                   ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-100 opacity-60 grayscale' : 'bg-white border-stone-100 hover:border-emerald-300 hover:shadow-lg'}
                 `}
               >
                 <div className="h-2/3 relative bg-stone-50">
                   {item.image ? (
                     <img src={item.image} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className={`w-full h-full flex items-center justify-center ${category.text} opacity-50`}>{category.icon}</div>
                   )}
                   {isSelected && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><CheckCircle className="text-emerald-600" size={32} /></div>}
                 </div>
                 <div className="h-1/3 p-2 flex flex-col justify-center bg-white border-t border-stone-50">
                    <p className="text-xs font-medium truncate text-left text-stone-700">{item.name}</p>
                    <p className="text-[10px] text-stone-400 text-left">{item.weight}g</p>
                 </div>
               </button>
             )
           })}
        </div>
      </div>

      <div className="flex-1 bg-stone-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative transition-colors duration-500">
        <div className="p-4 bg-black/20 backdrop-blur-md flex justify-between items-center z-20 text-white">
           <div className="flex items-baseline gap-2">
             <span className="text-xs opacity-60 uppercase tracking-widest">PACK WEIGHT</span>
             <span className="text-3xl font-mono text-emerald-400">{(packTotalWeight / 1000).toFixed(2)}</span>
             <span className="text-sm opacity-60">kg</span>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs opacity-60">CHECK PROGRESS</div>
                <div className="text-sm font-bold text-emerald-400">{Object.values(packedStatus).filter(Boolean).length} / {packList.length}</div>
              </div>
              <div className="relative w-10 h-10">
                 <svg className="w-full h-full transform -rotate-90">
                   <circle cx="20" cy="20" r="16" fill="transparent" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
                   <circle cx="20" cy="20" r="16" fill="transparent" stroke="currentColor" className="text-emerald-500 transition-all duration-500" strokeWidth="4" strokeDasharray={100} strokeDashoffset={100 - (packList.length > 0 ? (Object.values(packedStatus).filter(Boolean).length / packList.length) * 100 : 0)} />
                 </svg>
              </div>
           </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto z-10">
           {packList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/10 rounded-2xl">
                 <Scale size={48} className="mb-4" />
                 <p>点击上方装备墙，开始您的 "Flat Lay" 整理</p>
              </div>
           ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
                 {sortedPackedItems.map(item => {
                   const isPacked = packedStatus[item.id];
                   const category = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[6];
                   return (
                     <button
                       key={item.id}
                       onClick={() => togglePhysicalPack(item.id)}
                       className={`
                          relative aspect-square rounded-2xl border transition-all duration-500 group overflow-hidden
                          ${isPacked ? 'bg-black/40 border-transparent opacity-40 scale-95 grayscale' : 'bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 shadow-xl'}
                       `}
                     >
                        {item.image ? (
                           <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                           <div className={`absolute inset-0 flex items-center justify-center ${isPacked ? 'text-white/30' : 'text-white/60 group-hover:text-white'}`}>
                              {React.cloneElement(category.icon, { size: 48, strokeWidth: 1 })}
                           </div>
                        )}
                        <div className={`absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end text-left transition-opacity ${isPacked ? 'opacity-0' : 'opacity-100'}`}>
                           <span className="text-white text-xs font-medium truncate">{item.name}</span>
                           <span className="text-white/60 text-[10px] font-mono">{item.weight}g</span>
                        </div>
                        {isPacked && <div className="absolute inset-0 flex items-center justify-center text-emerald-500"><CheckCircle size={32} /></div>}
                     </button>
                   )
                 })}
              </div>
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900 opacity-100 z-0"></div>
        <div className="absolute inset-0 opacity-5 z-0" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")'}}></div>
      </div>
    </div>
  );
};

// --- 3. Main Application Component ---

export default function MossApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [gearList, setGearList] = useState<GearItem[]>(() => {
    const saved = localStorage.getItem('moss_gear_v3');
    return saved ? JSON.parse(saved) : MOCK_GEAR;
  });
  
  const [packList, setPackList] = useState<number[]>([]); 
  const [packedStatus, setPackedStatus] = useState<Record<number, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  
  // New Item Form State
  const [newItem, setNewItem] = useState<{
    name: string;
    weight: string;
    price: string;
    category: string;
    date: string;
    source: string;
    image: string | null;
  }>({ 
    name: '', weight: '', price: '', category: 'misc', 
    date: new Date().toISOString().split('T')[0], source: '', image: null 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('moss_gear_v3', JSON.stringify(gearList));
  }, [gearList]);

  const totalWeight = useMemo(() => gearList.reduce((sum, item) => sum + item.weight, 0), [gearList]);
  const totalPrice = useMemo(() => gearList.reduce((sum, item) => sum + (Number(item.price) || 0), 0), [gearList]);
  
  const packTotalWeight = useMemo(() => {
    return gearList
      .filter(g => packList.includes(g.id))
      .reduce((sum, item) => sum + item.weight, 0);
  }, [gearList, packList]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.weight) return;
    
    const item: GearItem = {
      id: Date.now(),
      name: newItem.name,
      weight: parseFloat(newItem.weight),
      price: parseFloat(newItem.price) || 0,
      category: newItem.category,
      date: newItem.date,
      source: newItem.source,
      image: newItem.image
    };
    
    setGearList([item, ...gearList]);
    setNewItem({ 
      name: '', weight: '', price: '', category: 'misc', 
      date: new Date().toISOString().split('T')[0], source: '', image: null 
    });
    setIsAddModalOpen(false);
  };

  const handleDeleteGear = (id: number) => {
    if(confirm('确认移除这件装备回归自然吗？')) {
      setGearList(gearList.filter(item => item.id !== id));
      setPackList(packList.filter(pid => pid !== id));
    }
  };

  const toggleToPack = (id: number) => {
    if (packList.includes(id)) {
      setPackList(packList.filter(pid => pid !== id));
      const newStatus = { ...packedStatus };
      delete newStatus[id];
      setPackedStatus(newStatus);
    } else {
      setPackList([...packList, id]);
    }
  };

  const togglePhysicalPack = (id: number) => {
    setPackedStatus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#F1F0EA] text-stone-800 font-sans selection:bg-emerald-200 selection:text-emerald-900 flex justify-center">
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>

      <div className="w-full max-w-5xl min-h-screen flex flex-col relative z-10 shadow-2xl bg-[#F5F5F0]">
        
        <nav className="sticky top-0 z-50 bg-[#F5F5F0]/80 backdrop-blur-lg border-b border-stone-200/50 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-stone-800 text-white p-2 rounded-lg"><Mountain size={20} /></div>
            <div>
              <span className="font-bold text-xl tracking-tight text-stone-800 block leading-none">MOSS</span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest">Outdoor System</span>
            </div>
          </div>
          <div className="flex bg-stone-200/50 p-1 rounded-2xl">
            {[
              { id: 'dashboard', icon: <Leaf size={18} />, label: '概览' },
              { id: 'gear', icon: <Package size={18} />, label: '库房' },
              { id: 'pack', icon: <Scale size={18} />, label: '整理' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id ? 'bg-white shadow-sm text-stone-800 scale-105' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView gearList={gearList} totalWeight={totalWeight} totalPrice={totalPrice} />}
          {activeTab === 'gear' && <GearView gearList={gearList} setIsAddModalOpen={setIsAddModalOpen} handleDeleteGear={handleDeleteGear} />}
          {activeTab === 'pack' && <PackerView gearList={gearList} packList={packList} packedStatus={packedStatus} toggleToPack={toggleToPack} togglePhysicalPack={togglePhysicalPack} packTotalWeight={packTotalWeight} />}
        </main>

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-xl font-medium text-stone-800">录入新装备</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddGear} className="p-6 space-y-5 overflow-y-auto">
                <div onClick={() => fileInputRef.current?.click()} className={`w-full h-40 rounded-2xl border-2 border-dashed ${newItem.image ? 'border-transparent' : 'border-stone-300'} bg-stone-50 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors relative overflow-hidden group`}>
                  {newItem.image ? (
                    <>
                      <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">更换图片</div>
                    </>
                  ) : (
                    <div className="text-stone-400 flex flex-col items-center"><Camera size={32} className="mb-2" /><span className="text-xs">点击上传装备照片</span></div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">装备名称</label>
                  <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all" placeholder="例如：始祖鸟 Alpha SV" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">重量 (g)</label>
                    <input type="number" required value={newItem.weight} onChange={e => setNewItem({...newItem, weight: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">价格 (¥)</label>
                    <input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3" placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">购入日期</label>
                    <input type="date" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">购入渠道</label>
                    <input type="text" value={newItem.source} onChange={e => setNewItem({...newItem, source: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm" placeholder="例如：官网、海淘" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">类别</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(cat => (
                      <button type="button" key={cat.id} onClick={() => setNewItem({...newItem, category: cat.id})} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${newItem.category === cat.id ? 'bg-stone-800 text-white shadow-md transform scale-105' : 'bg-white text-stone-500 border-stone-100 hover:border-stone-300'}`}>
                        {cat.icon}
                        <span className="text-[10px] mt-1">{cat.name.substring(0,2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full bg-stone-800 text-white font-medium py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 hover:bg-stone-700 active:scale-95"><Plus size={20} /> 确认入库</button>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}