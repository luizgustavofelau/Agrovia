import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SensorData {
  sensor1: number; // Umidade Solo 1 (%)
  sensor2: number; // Umidade Solo 2 (%)
  sensor3: number; // Temperatura (°C)
  sensor4: number; // Umidade Ar (%)
}

type SensorStatus = 'optimal' | 'low' | 'high';

interface WeatherData {
  temp: number;
  descricao: string;
  umidade: number;
  vento: number;
  cidade: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const WEATHER_API_KEY = '03b273bb11c049c9b1205155262402';
const CIDADE = 'Engenheiro Coelho';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSensorStatus(value: number, min: number, max: number): SensorStatus {
  if (value >= min && value <= max) return 'optimal';
  if (value < min) return 'low';
  return 'high';
}

const statusStyles: Record<SensorStatus, string> = {
  optimal: 'text-green-600 bg-green-50',
  low: 'text-yellow-600 bg-yellow-50',
  high: 'text-red-600 bg-red-50',
};

const statusLabels: Record<SensorStatus, string> = {
  optimal: 'Ótimo',
  low: 'Muito Baixo',
  high: 'Muito Alto',
};

function gerarDicaIrrigacao(temp: number, umidade: number, vento: number): string {
  let dica = '';
  if (umidade > 80) dica += 'Umidade alta. Reduza a irrigação.';
  else if (umidade < 50) dica += 'Umidade baixa. Aumente a irrigação.';
  else dica += 'Condições normais. Mantenha irrigação regular.';
  if (temp > 30) dica += ' 🌞 Dia quente: aumente a hidratação.';
  if (vento > 5) dica += ' 💨 Vento forte: aumento de evaporação.';
  return dica;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  icon: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ label, value, unit, min, max, icon }) => {
  const status = getSensorStatus(value, min, max);
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 border border-gray-100 hover:shadow-lg transition">
      <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
        <span className="text-xl">{icon}</span>
        {label}
      </div>
      <div className="text-4xl font-bold text-gray-800">
        {Math.round(value)}
        <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('usuarioNome') ?? 'Usuário';

  const [sensors, setSensors] = useState<SensorData>({
    sensor1: 65, sensor2: 72, sensor3: 28, sensor4: 55,
  });
  const [pumpOn, setPumpOn] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  // Simulação de sensores
  const updateSensors = useCallback(() => {
    setSensors(prev => {
      const next = {
        sensor1: Math.max(30, Math.min(90, prev.sensor1 + (Math.random() - 0.5) * 10)),
        sensor2: Math.max(30, Math.min(90, prev.sensor2 + (Math.random() - 0.5) * 10)),
        sensor3: Math.max(15, Math.min(40, prev.sensor3 + (Math.random() - 0.5) * 3)),
        sensor4: Math.max(30, Math.min(95, prev.sensor4 + (Math.random() - 0.5) * 8)),
      };
      // Auto-controle da bomba
      if (next.sensor1 < 50 || next.sensor2 < 50) setPumpOn(true);
      else if (next.sensor1 > 80 && next.sensor2 > 80) setPumpOn(false);
      return next;
    });
  }, []);

  // Previsão do tempo
  const fetchWeather = useCallback(async () => {
    try {
      const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${CIDADE}&aqi=no&lang=pt`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const d = await res.json();
      setWeather({
        temp: Math.round(d.current.temp_c),
        descricao: d.current.condition.text,
        umidade: d.current.humidity,
        vento: d.current.wind_kph / 3.6,
        cidade: d.location.name,
      });
      setWeatherError(false);
    } catch {
      setWeatherError(true);
    }
  }, []);

  useEffect(() => {
    updateSensors();
    fetchWeather();
    const sensorInterval = setInterval(updateSensors, 5000);
    const weatherInterval = setInterval(fetchWeather, 600_000);
    return () => {
      clearInterval(sensorInterval);
      clearInterval(weatherInterval);
    };
  }, [updateSensors, fetchWeather]);

  const handleLogout = () => {
    localStorage.removeItem('usuarioNome');
    localStorage.removeItem('usuarioLogado');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ── */}
      <header className="bg-green-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center font-bold text-sm shadow">
              AV
            </div>
            <span className="text-xl font-bold tracking-wide">AgroVia</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-200 text-sm hidden sm:block">
              Bem-vindo, <strong>{nomeUsuario}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── Sensor Cards ── */}
        <section>
          <h2 className="text-2xl font-bold text-green-900 mb-5">📡 Monitoramento de Sensores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <SensorCard label="Umidade Solo 1" value={sensors.sensor1} unit="%" min={60} max={80} icon="💧" />
            <SensorCard label="Umidade Solo 2" value={sensors.sensor2} unit="%" min={60} max={80} icon="💧" />
            <SensorCard label="Temperatura"    value={sensors.sensor3} unit="°C" min={20} max={30} icon="🌡️" />
            <SensorCard label="Umidade do Ar"  value={sensors.sensor4} unit="%" min={40} max={70} icon="🌬️" />
          </div>
        </section>

        {/* ── Controle da Bomba ── */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-green-900 mb-4">🚿 Controle da Bomba d'Água</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full shadow-md transition-colors ${pumpOn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className={`font-semibold text-lg ${pumpOn ? 'text-green-700' : 'text-gray-500'}`}>
                Bomba: {pumpOn ? 'LIGADA' : 'DESLIGADA'}
              </span>
            </div>
            <button
              onClick={() => setPumpOn(p => !p)}
              className={`px-6 py-3 rounded-xl font-bold shadow transition duration-200 transform hover:scale-105 active:scale-100 ${
                pumpOn
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-700 hover:bg-green-600 text-white'
              }`}
            >
              {pumpOn ? 'Desligar Bomba' : 'Ligar Bomba'}
            </button>
          </div>
        </section>

        {/* ── Culturas + Previsão ── */}
        <section>
          <h2 className="text-2xl font-bold text-green-900 mb-5">🌱 Culturas Monitoradas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Soja */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <h3 className="font-bold text-green-800 text-lg mb-2">🌾 Soja</h3>
              <p className="text-gray-500 text-sm">Umidade ideal: <span className="font-semibold text-green-700">60–80%</span></p>
            </div>

            {/* Feijão */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <h3 className="font-bold text-green-800 text-lg mb-2">🫘 Feijão</h3>
              <p className="text-gray-500 text-sm">Umidade ideal: <span className="font-semibold text-green-700">50–70%</span></p>
            </div>

            {/* Previsão do Tempo */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <h3 className="font-bold text-green-800 text-lg mb-3">🌤️ Previsão do Tempo</h3>
              {weatherError && (
                <p className="text-red-500 text-sm">⚠️ Erro ao carregar previsão. Verifique sua conexão.</p>
              )}
              {!weather && !weatherError && (
                <p className="text-gray-400 text-sm animate-pulse">Carregando dados do tempo...</p>
              )}
              {weather && (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-700">🌍 {weather.cidade}</p>
                  <p className="text-3xl font-bold text-green-700">{weather.temp}°C</p>
                  <p className="text-gray-500 capitalize">{weather.descricao}</p>
                  <p className="text-gray-500">💧 Umidade: {weather.umidade}%</p>
                  <p className="text-gray-500">💨 Vento: {weather.vento.toFixed(1)} m/s</p>
                  <p className="mt-3 text-xs text-green-700 bg-green-50 rounded-lg p-2 leading-relaxed">
                    📋 {gerarDicaIrrigacao(weather.temp, weather.umidade, weather.vento)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 text-gray-400 text-xs mt-4">
        © 2026 AgroVia — Automação Agrícola para Pequenos Produtores
      </footer>
    </div>
  );
};

export default Dashboard;
