import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Plus,
  Search,
  Globe,
  Mail,
  Phone,
  Plane,
  Percent,
  Upload,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Company } from '../../types';

export const CompanyManagementView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { companies, addCompany, updateCompany, deleteCompany } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    iata: '',
    icao: '',
    logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&auto=format&fit=crop&q=80',
    hub: '',
    contactEmail: '',
    contactPhone: ''
  });

  const handleOpenNew = () => {
    setEditingComp(null);
    setFormData({
      name: '',
      abbreviation: '',
      iata: '',
      icao: '',
      logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&auto=format&fit=crop&q=80',
      hub: 'Tunis-Carthage (TUN)',
      contactEmail: '',
      contactPhone: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingComp(comp);
    setFormData({
      name: comp.name,
      abbreviation: comp.abbreviation,
      iata: comp.iata,
      icao: comp.icao,
      logo: comp.logo,
      hub: comp.hub,
      contactEmail: comp.contactEmail,
      contactPhone: comp.contactPhone
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.abbreviation.trim()) return;

    if (editingComp) {
      updateCompany(editingComp.id, formData);
    } else {
      addCompany(formData);
    }
    setIsModalOpen(false);
  };

  const handleLogoUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredCompanies = companies.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.abbreviation.toLowerCase().includes(q) ||
        c.iata.toLowerCase().includes(q) ||
        c.icao.toLowerCase().includes(q) ||
        c.hub.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="company-management-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{t('companyTitle')}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('companySub')}
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btnAddCompany')}</span>
        </button>
      </div>

      {/* Grid of Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={comp.logo}
                  alt={comp.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 p-1 bg-slate-50"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{comp.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-mono font-bold">
                      {comp.abbreviation}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">IATA: {comp.iata} • ICAO: {comp.icao}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(comp)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteCompany(comp.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Hub: <strong>{comp.hub}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{comp.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{comp.contactPhone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-500 block">{t('colActiveFlights')}</span>
                <span className="font-bold text-slate-900 font-mono">{comp.activeFlightsCount} Flights</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <span className="text-[10px] text-emerald-700 block">{t('colSla')}</span>
                <span className="font-bold text-emerald-800 font-mono">{comp.slaComplianceRate}%</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add / Edit Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingComp ? 'Edit Airline Partner' : 'Register Airline Partner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Royal Air Maroc"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Abbreviation *</label>
                  <input
                    type="text"
                    required
                    value={formData.abbreviation}
                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                    placeholder="e.g. AT"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">IATA Code</label>
                  <input
                    type="text"
                    value={formData.iata}
                    onChange={(e) => setFormData({ ...formData, iata: e.target.value.toUpperCase() })}
                    placeholder="AT"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ICAO Code</label>
                  <input
                    type="text"
                    value={formData.icao}
                    onChange={(e) => setFormData({ ...formData, icao: e.target.value.toUpperCase() })}
                    placeholder="RAM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 block">{t('uploadLogo')}</label>
                <div className="flex items-center gap-3">
                  <img
                    src={formData.logo}
                    alt="Logo Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 p-1 bg-white"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUploadSim}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, or SVG airline insignia</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Main Hub Airport</label>
                <input
                  type="text"
                  value={formData.hub}
                  onChange={(e) => setFormData({ ...formData, hub: e.target.value })}
                  placeholder="e.g. Casablanca Mohammed V (CMN)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="ops@airline.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+216 ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl"
                >
                  Save Partner Record
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
