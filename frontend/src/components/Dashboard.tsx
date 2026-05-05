import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SensorData {
  sensor1: number;
  sensor2: number;
  sensor3: number;
  sensor4: number;
}
type SensorStatus = 'optimal' | 'low' | 'high';

interface WeatherData {
  temp: number;
  descricao: string;
  umidade: number;
  vento: number;
  cidade: string;
}

const WEATHER_API_KEY = '03b273bb11c049c9b1205155262402';
const CIDADE = 'Engenheiro Coelho';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSensorStatus(value: number, min: number, max: number): SensorStatus {
  if (value >= min && value <= max) return 'optimal';
  return value < min ? 'low' : 'high';
}

const badgeClass: Record<SensorStatus, string> = {
  optimal: 'badge-optimal',
  low:     'badge-low',
  high:    'badge-high',
};

const badgeLabel: Record<SensorStatus, string> = {
  optimal: '✓ Ótimo',
  low:     '↓ Muito Baixo',
  high:    '↑ Muito Alto',
};

function gerarDica(temp: number, umidade: number, vento: number): string {
  let d = '';
  if (umidade > 80)      d += 'Umidade alta — reduza a irrigação.';
  else if (umidade < 50) d += 'Umidade baixa — aumente a irrigação.';
  else                   d += 'Condições normais — irrigação regular.';
  if (temp > 30) d += ' Alta temperatura detectada.';
  if (vento > 5) d += ' Vento forte — evaporação elevada.';
  return d;
}

// ─── Sensor Card ──────────────────────────────────────────────────────────────
interface SensorCardProps {
  label: string; icon: string; value: number;
  unit: string; min: number; max: number;
}
const SensorCard: React.FC<SensorCardProps> = ({ label, icon, value, unit, min, max }) => {
  const status = getSensorStatus(value, min, max);
  const pct = Math.round(((value - min) / (max - min)) * 100);
  const barClamped = Math.max(0, Math.min(100, pct));

  return (
    <div className="panel-surface p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-surface-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-4xl font-display font-extrabold text-surface-900 tabular-nums leading-none">
          {Math.round(value)}
        </span>
        <span className="text-surface-400 text-base mb-1">{unit}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            status === 'optimal' ? 'bg-brand-500' :
            status === 'low'     ? 'bg-amber-400' :
                                   'bg-rose-400'
          }`}
          style={{ width: `${barClamped}%` }}
        />
      </div>

      <span className={badgeClass[status]}>{badgeLabel[status]}</span>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('usuarioNome') ?? 'Usuário';

  const [sensors, setSensors] = useState<SensorData>({ sensor1: 65, sensor2: 72, sensor3: 28, sensor4: 55 });
  const [pumpOn, setPumpOn]   = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [time, setTime]       = useState(new Date());

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const updateSensors = useCallback(() => {
    setSensors(prev => {
      const next = {
        sensor1: Math.max(30, Math.min(90, prev.sensor1 + (Math.random() - 0.5) * 10)),
        sensor2: Math.max(30, Math.min(90, prev.sensor2 + (Math.random() - 0.5) * 10)),
        sensor3: Math.max(15, Math.min(40, prev.sensor3 + (Math.random() - 0.5) * 3)),
        sensor4: Math.max(30, Math.min(95, prev.sensor4 + (Math.random() - 0.5) * 8)),
      };
      if (next.sensor1 < 50 || next.sensor2 < 50) setPumpOn(true);
      else if (next.sensor1 > 80 && next.sensor2 > 80) setPumpOn(false);
      return next;
    });
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${CIDADE}&aqi=no&lang=pt`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('err');
      const d = await res.json();
      setWeather({
        temp:      Math.round(d.current.temp_c),
        descricao: d.current.condition.text,
        umidade:   d.current.humidity,
        vento:     d.current.wind_kph / 3.6,
        cidade:    d.location.name,
      });
      setWeatherError(false);
    } catch { setWeatherError(true); }
  }, []);

  useEffect(() => {
    updateSensors();
    fetchWeather();
    const s = setInterval(updateSensors, 5000);
    const w = setInterval(fetchWeather, 600_000);
    return () => { clearInterval(s); clearInterval(w); };
  }, [updateSensors, fetchWeather]);

  const handleLogout = () => {
    localStorage.removeItem('usuarioNome');
    localStorage.removeItem('usuarioLogado');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-surface">

      {/* ── Navbar glass ── */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-sm">
              <span className="text-white font-display font-extrabold text-xs">AV</span>
            </div>
            <span className="font-display font-extrabold text-surface-100 text-lg tracking-tight">AgroVia</span>
            <span className="hidden sm:block text-surface-500 text-xs ml-2 font-light">
              {time.toLocaleTimeString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-surface-300 text-sm">
              Olá, <span className="text-surface-100 font-semibold">{nomeUsuario}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-surface-400 hover:text-surface-100 text-sm font-medium border border-white/10 hover:border-white/25 px-4 py-1.5 rounded-lg transition duration-150"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Page title ── */}
        <div>
          <h2 className="font-display text-2xl font-extrabold text-surface-900 tracking-tight">
            Painel de Controle
          </h2>
          <p className="text-surface-500 text-sm mt-0.5">
            Monitoramento em tempo real — atualização a cada 5 segundos
          </p>
        </div>

        {/* ── Sensor Cards ── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">
            Sensores ativos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SensorCard label="Umidade Solo 1" icon="💧" value={sensors.sensor1} unit="%" min={60} max={80} />
            <SensorCard label="Umidade Solo 2" icon="💧" value={sensors.sensor2} unit="%" min={60} max={80} />
            <SensorCard label="Temperatura"    icon="🌡️" value={sensors.sensor3} unit="°C" min={20} max={30} />
            <SensorCard label="Umidade do Ar"  icon="🌬️" value={sensors.sensor4} unit="%" min={40} max={70} />
          </div>
        </section>

        {/* ── Pump + Weather row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Pump control */}
          <div className="panel-surface p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-surface-400">
                Controle da Bomba
              </h3>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1 ${
                  pumpOn
                    ? 'text-brand-700 bg-brand-50 ring-brand-200'
                    : 'text-surface-500 bg-surface-100 ring-surface-200'
                }`}
              >
                {pumpOn ? '● Ativa' : '○ Inativa'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  pumpOn ? 'bg-brand-500/10' : 'bg-surface-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-colors ${
                    pumpOn ? 'bg-brand-500 animate-pulse' : 'bg-surface-300'
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold text-surface-900 text-sm">
                  Bomba d'Água Principal
                </p>
                <p className="text-surface-400 text-xs">
                  {pumpOn ? 'Irrigação em andamento' : 'Aguardando ativação'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setPumpOn(p => !p)}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm tracking-wide transition duration-200 hover:scale-[1.02] active:scale-100 ${
                pumpOn
                  ? 'bg-rose-500/10 text-rose-600 border border-rose-200 hover:bg-rose-500/20'
                  : 'bg-brand-700 text-white hover:bg-brand-600 shadow-md'
              }`}
            >
              {pumpOn ? 'Desligar Bomba' : 'Ligar Bomba'}
            </button>
          </div>

          {/* Weather card */}
          <div className="panel-surface p-6 flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-surface-400">
              Previsão do Tempo
            </h3>

            {!weather && !weatherError && (
              <div className="flex items-center gap-2 text-surface-400 text-sm">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Carregando...
              </div>
            )}

            {weatherError && (
              <p className="text-rose-500 text-sm bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                ⚠️ Erro ao carregar previsão. Verifique sua conexão.
              </p>
            )}

            {weather && (
              <>
                <div className="flex items-end gap-3">
                  <span className="font-display text-5xl font-extrabold text-surface-900 tabular-nums leading-none">
                    {weather.temp}°
                  </span>
                  <div className="mb-1">
                    <p className="text-surface-700 text-sm font-medium capitalize">{weather.descricao}</p>
                    <p className="text-surface-400 text-xs">📍 {weather.cidade}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-50 rounded-xl px-3 py-2.5 border border-surface-100">
                    <p className="text-xs text-surface-400 mb-0.5">Umidade</p>
                    <p className="text-surface-800 font-semibold text-sm">{weather.umidade}%</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl px-3 py-2.5 border border-surface-100">
                    <p className="text-xs text-surface-400 mb-0.5">Vento</p>
                    <p className="text-surface-800 font-semibold text-sm">{weather.vento.toFixed(1)} m/s</p>
                  </div>
                </div>

                <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 text-xs text-brand-800 leading-relaxed">
                  📋 {gerarDica(weather.temp, weather.umidade, weather.vento)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Crops row ── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-4">
            Culturas monitoradas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Soja',   icon: '🌾', ideal: '60–80%',  note: 'Umidade do solo ideal' },
              { label: 'Feijão', icon: '🫘', ideal: '50–70%',  note: 'Umidade do solo ideal' },
            ].map(crop => (
              <div key={crop.label} className="panel-surface p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {crop.icon}
                </div>
                <div>
                  <p className="font-semibold text-surface-900 font-display">{crop.label}</p>
                  <p className="text-xs text-surface-400">{crop.note}</p>
                  <p className="text-brand-700 font-semibold text-sm mt-1">{crop.ideal}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="text-center py-6 text-surface-400 text-xs border-t border-surface-200 mt-4">
        © 2026 AgroVia — Automação Agrícola para Pequenos Produtores
      </footer>
    </div>
  );
};

export default Dashboard;
