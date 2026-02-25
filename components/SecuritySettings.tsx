
import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Save, CheckCircle2 } from 'lucide-react';
import { AppConfig } from '../types';

interface SecuritySettingsProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ config, onUpdateConfig }) => {
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!formData.masterPassword || !formData.supervisorPin) {
      alert("Los campos no pueden estar vacíos");
      return;
    }
    onUpdateConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Ajustes de Seguridad</h2>
          <p className="text-slate-500 text-sm">Gestiona quién puede acceder a las funciones avanzadas.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card Contraseña Maestra */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800">Contraseña Maestra</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Esta es la clave para entrar al rol de **Supervisor**. Cámbiala periódicamente para mantener el sistema seguro.
          </p>
          <input 
            type="text"
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 outline-none font-bold text-slate-700"
            value={formData.masterPassword}
            onChange={(e) => setFormData({ ...formData, masterPassword: e.target.value })}
            placeholder="Nueva contraseña maestra"
          />
        </div>

        {/* Card PIN Desbloqueo */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800">PIN de Desbloqueo</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Este PIN de 4 dígitos se utiliza para autorizar entregas cuando el sistema detecta un consumo excesivo.
          </p>
          <input 
            type="text"
            maxLength={4}
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-center text-3xl tracking-widest text-slate-700"
            value={formData.supervisorPin}
            onChange={(e) => setFormData({ ...formData, supervisorPin: e.target.value.replace(/\D/g, '') })}
            placeholder="0000"
          />
        </div>

        <button 
          onClick={handleSave}
          className={`w-full py-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${isSaved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}
        >
          {isSaved ? (
            <><CheckCircle2 className="w-6 h-6" /> ¡Guardado con éxito!</>
          ) : (
            <><Save className="w-6 h-6" /> Guardar Cambios de Seguridad</>
          )}
        </button>
      </div>

      <div className="mt-10 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <p className="text-xs text-blue-600 font-medium leading-relaxed">
          <span className="font-black uppercase block mb-1">Nota importante:</span>
          Los cambios realizados aquí se sincronizan con todos los dispositivos. Asegúrate de comunicar la nueva contraseña a las personas autorizadas.
        </p>
      </div>
    </div>
  );
};

export default SecuritySettings;
