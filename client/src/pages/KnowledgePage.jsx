import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Leaf, AlertTriangle, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DashboardLayout from '../components/DashboardLayout';
import { LoadingSkeleton, EmptyState } from '../components/CommonUI';

const CATEGORIES = ['All', 'Doshas', 'Herbs', 'Shrubs', 'Recipes', 'Dinacharya', 'Ritucharya', 'Nutrition', 'YogaTherapy'];

export default function KnowledgePage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const res = await api.get('/knowledge', {
        params: {
          category: category !== 'All' ? category : undefined,
          search: search.trim() || undefined,
        },
      });
      setItems(res.data.knowledge || []);
    } catch (err) {
      console.error('Failed to load knowledge:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKnowledge();
    }, 250);
    return () => clearTimeout(timer);
  }, [category, search]);

  const content = (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="hitayu-card p-5 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-[#78847C] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search herbs (Tulsi, Ashwagandha), doshas, Dinacharya, or concepts..."
            className="hitayu-input pl-12"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-[#173F35] text-white'
                  : 'bg-[#E8F0E9] text-[#173F35] hover:bg-[#d8e6da]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No matching articles found"
          description="Try clearing your filters or searching for another Ayurvedic term like Vata, Tulsi, or Dinacharya."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedItem(item)}
              className="hitayu-card overflow-hidden cursor-pointer hover:border-[#173F35]/40 hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-[#E8F0E9]">
                  <img
                    src={item.imageUrl || '/images/botanical-apothecary.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#102E28]/50 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-[#173F35] backdrop-blur-xs">
                    {item.category}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#102E28]/80 text-[#C6A56B] backdrop-blur-xs">
                    {item.doshaAffinity}
                  </span>
                </div>
                <div className="p-6 pb-2">
                  <h3 className="font-serif text-xl font-bold text-[#173F35]">{item.title}</h3>
                  {item.sanskritName && (
                    <p className="text-xs italic text-[#78847C] mt-0.5">{item.sanskritName}</p>
                  )}
                  <p className="text-sm text-[#26352F]/80 mt-3 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 mt-2 border-t border-[#E4E9E2] flex items-center justify-between text-xs font-semibold text-[#173F35]">
                <span>Read Monograph</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-[#102E28]/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.imageUrl && (
              <div className="rounded-2xl overflow-hidden h-52 bg-[#E8F0E9]">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0E9] text-[#173F35]">
                  {selectedItem.category} • {selectedItem.doshaAffinity}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173F35] mt-3">
                  {selectedItem.title}
                </h2>
                {selectedItem.sanskritName && (
                  <p className="text-sm italic text-[#78847C] mt-1">{selectedItem.sanskritName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-3 py-1.5 rounded-xl bg-[#F8F6EF] text-sm font-medium text-[#173F35] hover:bg-[#E8F0E9]"
              >
                Close
              </button>
            </div>

            <p className="text-sm sm:text-base text-[#26352F] leading-relaxed">
              {selectedItem.description}
            </p>

            {selectedItem.traditionalUses?.length > 0 && (
              <div className="bg-[#F8F6EF] rounded-2xl p-5 space-y-2">
                <h4 className="font-semibold text-sm text-[#173F35] flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-[#C6A56B]" />
                  <span>Traditional Applications</span>
                </h4>
                <ul className="list-disc list-inside text-sm text-[#26352F]/85 space-y-1">
                  {selectedItem.traditionalUses.map((u, idx) => (
                    <li key={idx}>{u}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItem.modernContext && (
              <div className="space-y-1.5">
                <h4 className="font-semibold text-sm text-[#173F35]">Modern Scientific Context</h4>
                <p className="text-sm text-[#78847C] leading-relaxed">
                  {selectedItem.modernContext}
                </p>
              </div>
            )}

            {selectedItem.contraindications?.length > 0 && (
              <div className="bg-[#FDF2F2] border border-[#C85D55]/30 rounded-2xl p-4 space-y-1.5">
                <h4 className="font-semibold text-sm text-[#9B3B35] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Safety & Precautions</span>
                </h4>
                <ul className="text-xs text-[#9B3B35] space-y-1">
                  {selectedItem.contraindications.map((c, idx) => (
                    <li key={idx}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItem.references?.length > 0 && (
              <p className="text-xs text-[#78847C] pt-2 border-t border-[#E4E9E2]">
                Classical References: {selectedItem.references.join(' | ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isAuthenticated) {
    return (
      <DashboardLayout
        title="Ayurvedic Knowledge Library"
        subtitle="Explore classical principles, botanicals, and seasonal rhythms backed by MongoDB."
      >
        {content}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6EF] flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173F35]">
            Ayurvedic Knowledge Library
          </h1>
          <p className="text-[#78847C] mt-1">
            Curated educational monographs on doshas, herbs, nutrition, and daily wellness.
          </p>
        </div>
        {content}
      </main>
    </div>
  );
}
