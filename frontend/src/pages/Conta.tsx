import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Cpu,
  Droplets,
  Leaf,
  Loader2,
  Plus,
  Save,
  Sprout,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import "../styles/account.css";

type Tab = "perfil" | "fazendas" | "culturas" | "dispositivos";
export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  telefone: string | null;
  tipo_usuario: string;
}
export interface Fazenda {
  id: number;
  nome: string;
  localizacao: string | null;
}
export interface Cultura {
  id: number;
  nome: string;
  descricao?: string | null;
  umidadeMin: number;
  umidadeMax: number;
}
export interface Dispositivo {
  id: number;
  nome: string;
  mac: string;
  online: boolean;
  id_fazenda: number;
  id_campo: number;
  fazenda?: string;
}

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || "" });
const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "fazendas", label: "Fazendas", icon: Building2 },
  { id: "culturas", label: "Culturas", icon: Sprout },
  { id: "dispositivos", label: "Dispositivos", icon: Cpu },
];
const emptyCulture = {
  nome_cultura: "",
  descricao_tecnica: "",
  umidade_minima: "",
  umidade_maxima: "",
};
const emptyDevice = {
  nome_dispositivo: "",
  mac_address: "",
  id_fazenda: "",
  id_campo: "",
};

const demoUsuario: Usuario = {
  id_usuario: 1,
  nome: "Miguel Maximus",
  email: "miguelmaximus2008@gmail.com",
  telefone: "(11) 98765-4321",
  tipo_usuario: "ADMIN",
};

const demoFazendas: Fazenda[] = [
  { id: 1, nome: "Fazenda Vale Verde", localizacao: "São José do Rio Preto - SP" },
  { id: 2, nome: "Lote Estrela", localizacao: "Bauru - SP" },
];

const demoCulturas: Cultura[] = [
  { id: 1, nome: "Soja", descricao: "Cultura de alta produtividade para clima temperado.", umidadeMin: 40, umidadeMax: 65 },
  { id: 2, nome: "Milho", descricao: "Ajuste ideal para irrigação em estágios de desenvolvimento.", umidadeMin: 35, umidadeMax: 60 },
  { id: 3, nome: "Café", descricao: "Requer monitoramento mais frequente em regiões de maior elevação.", umidadeMin: 45, umidadeMax: 70 },
];

const demoDispositivos: Dispositivo[] = [
  { id: 1, nome: "ESP32-01", mac: "A0:B7:65:12:33:AA", online: true, id_fazenda: 1, id_campo: 1, fazenda: "Fazenda Vale Verde" },
  { id: 2, nome: "ESP32-02", mac: "A0:B7:65:12:33:BB", online: false, id_fazenda: 2, id_campo: 2, fazenda: "Lote Estrela" },
];

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
      />
    </label>
  );
}
function Button({
  children,
  busy = false,
}: {
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-emerald-50 hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
    >
      {busy && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export default function Conta() {
  const idUsuario = Number(localStorage.getItem("usuarioId"));
  const [aba, setAba] = useState<Tab>("perfil");
  const [dadosUsuario, setDadosUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState({
    nome: "",
    email: "",
    telefone: "",
    documento: "",
    tipo_usuario: "AGRICULTOR",
  });
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [culturas, setCulturas] = useState<Cultura[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [farm, setFarm] = useState({ nome_fazenda: "", localizacao: "" });
  const [culture, setCulture] = useState(emptyCulture);
  const [device, setDevice] = useState(emptyDevice);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Tab | null>(null);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [dateTime, setDateTime] = useState("");
  const initials = (perfil.nome || "Usuário").slice(0, 2).toUpperCase();
  const apiError = (error: unknown) =>
    axios.isAxiosError(error)
      ? error.response?.data?.mensagem ||
        "Não foi possível concluir a operação."
      : "Servidor indisponível.";

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const date = now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      setDateTime(
        `${date.charAt(0).toUpperCase()}${date.slice(1)} · ${now.toLocaleTimeString("pt-BR")}`,
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const applyDemoData = () => {
      setDadosUsuario(demoUsuario);
      setPerfil({
        nome: demoUsuario.nome,
        email: demoUsuario.email,
        telefone: demoUsuario.telefone || "",
        documento: "",
        tipo_usuario: demoUsuario.tipo_usuario,
      });
      setFazendas(demoFazendas);
      setCulturas(demoCulturas);
      setDispositivos(demoDispositivos);
      setFeedback({
        text: "Modo demonstração ativo: os dados da conta foram carregados localmente porque o banco não está disponível.",
        error: false,
      });
    };

    if (!idUsuario) {
      setFeedback({
        text: "Faça login novamente para acessar sua conta.",
        error: true,
      });
      setLoading(false);
      return;
    }

    Promise.all([
      api.get<Usuario>(`/api/usuario/${idUsuario}`),
      api.get<Fazenda[]>("/api/fazendas", {
        params: { id_usuario: idUsuario },
      }),
      api.get<Cultura[]>("/api/culturas"),
      api.get<Dispositivo[]>("/api/dispositivos", {
        params: { id_usuario: idUsuario },
      }),
    ])
      .then(([user, farms, crops, devices]) => {
        setDadosUsuario(user.data);
        setPerfil({
          nome: user.data.nome,
          email: user.data.email,
          telefone: user.data.telefone || "",
          documento: "",
          tipo_usuario: user.data.tipo_usuario,
        });
        setFazendas(farms.data);
        setCulturas(crops.data);
        setDispositivos(devices.data);
      })
      .catch((error) => {
        console.warn("Falling back to demo account data:", error);
        applyDemoData();
      })
      .finally(() => setLoading(false));
  }, [idUsuario]);

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving("perfil");
    try {
      const { data } = await api.put<Usuario>(
        `/api/usuario/${idUsuario}`,
        perfil,
      );
      setDadosUsuario(data);
      localStorage.setItem("usuarioNome", data.nome);
      setFeedback({ text: "Perfil atualizado com sucesso.", error: false });
    } catch (error) {
      setFeedback({ text: apiError(error), error: true });
    } finally {
      setSaving(null);
    }
  }
  async function handleFarmSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving("fazendas");
    try {
      const { data } = await api.post<Fazenda>("/api/fazendas", {
        ...farm,
        id_usuario: idUsuario,
      });
      setFazendas((items) => [...items, data]);
      setFarm({ nome_fazenda: "", localizacao: "" });
      setFeedback({ text: "Fazenda cadastrada com sucesso.", error: false });
    } catch (error) {
      setFeedback({ text: apiError(error), error: true });
    } finally {
      setSaving(null);
    }
  }
  async function handleCultureSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving("culturas");
    try {
      const { data } = await api.post<Cultura>("/api/culturas", {
        ...culture,
        umidade_minima: Number(culture.umidade_minima),
        umidade_maxima: Number(culture.umidade_maxima),
      });
      setCulturas((items) => [...items, data]);
      setCulture(emptyCulture);
      setFeedback({ text: "Cultura cadastrada com sucesso.", error: false });
    } catch (error) {
      setFeedback({ text: apiError(error), error: true });
    } finally {
      setSaving(null);
    }
  }
  async function handleDeviceSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving("dispositivos");
    try {
      const { data } = await api.post<Dispositivo>("/api/dispositivos", {
        ...device,
        id_fazenda: Number(device.id_fazenda),
        id_campo: Number(device.id_campo),
      });
      setDispositivos((items) => [...items, data]);
      setDevice(emptyDevice);
      setFeedback({
        text: "Dispositivo ESP32 vinculado com sucesso.",
        error: false,
      });
    } catch (error) {
      setFeedback({ text: apiError(error), error: true });
    } finally {
      setSaving(null);
    }
  }

  if (loading)
    return (
      <main className="min-h-screen bg-[#F4F0E6] p-10 text-[#687263]">
        Carregando dados da conta...
      </main>
    );
  return (
    <div className="min-h-screen bg-[#F4F0E6] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <Sidebar />
      <main className="account-page min-w-0 px-4 py-7 text-[#243126] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="account-heading mb-8 flex items-end justify-between gap-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3A7D44]">{dateTime}</p><h1 className="mt-2 font-serif text-3xl font-medium">Minha conta Agrovia</h1><p className="mt-2 text-sm text-[#687263]">{dadosUsuario?.tipo_usuario || "AGRICULTOR"} · Gerencie seus dados, fazendas, culturas e dispositivos ESP32.</p></div>
          <div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs font-semibold text-[#76591f] sm:flex"><i className="h-2 w-2 rounded-full bg-[#c59a45]" />Modo demonstração</span><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3A7D44] text-sm font-bold text-white">{initials}</span></div>
        </header>
        {feedback && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${feedback.error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}
          >
            {feedback.text}
          </div>
        )}
        <div className="account-tabs mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setAba(id)}
              className={`account-tab flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${aba === id ? "active border border-emerald-700/40 bg-emerald-900/60 text-emerald-300" : "text-slate-400 hover:bg-white/5"}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        {aba === "perfil" && (
          <section className="account-section rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Dados do fazendeiro</h2>
            <form
              onSubmit={handleProfileSubmit}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <Field
                label="Nome completo"
                value={perfil.nome}
                onChange={(value) => setPerfil({ ...perfil, nome: value })}
              />
              <Field
                label="E-mail"
                type="email"
                value={perfil.email}
                onChange={(value) => setPerfil({ ...perfil, email: value })}
              />
              <Field
                label="Telefone / WhatsApp"
                required={false}
                value={perfil.telefone}
                onChange={(value) => setPerfil({ ...perfil, telefone: value })}
              />
              <Field
                label="CPF / CNPJ"
                required={false}
                value={perfil.documento}
                onChange={(value) => setPerfil({ ...perfil, documento: value })}
              />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Tipo de perfil</span>
                <select value={perfil.tipo_usuario} onChange={(event) => setPerfil({ ...perfil, tipo_usuario: event.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100">
                  <option value="AGRICULTOR">Agricultor</option>
                  <option value="TECNICO">Técnico</option>
                </select>
              </label>
              <div className="flex items-end justify-end">
                <Button busy={saving === "perfil"}>
                  <Save size={15} />
                  Salvar alterações
                </Button>
              </div>
            </form>
          </section>
        )}
        {aba === "fazendas" && (
          <section className="account-section rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Fazendas cadastradas</h2>
            <form
              onSubmit={handleFarmSubmit}
              className="mt-5 grid gap-3 sm:grid-cols-3"
            >
              <Field
                label="Nome da fazenda"
                value={farm.nome_fazenda}
                onChange={(value) => setFarm({ ...farm, nome_fazenda: value })}
              />
              <Field
                label="Localização"
                required={false}
                value={farm.localizacao}
                onChange={(value) => setFarm({ ...farm, localizacao: value })}
              />
              <div className="flex items-end">
                <Button busy={saving === "fazendas"}>
                  <Plus size={15} />
                  Cadastrar fazenda
                </Button>
              </div>
            </form>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fazendas.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-4"
                >
                  <p className="font-medium">{item.nome}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    <Building2 size={13} className="mr-1 inline" />
                    {item.localizacao || "Localização não informada"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {aba === "culturas" && (
          <section className="account-section rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Culturas cadastradas</h2>
            <form
              onSubmit={handleCultureSubmit}
              className="mt-5 grid gap-3 sm:grid-cols-4"
            >
              <Field
                label="Cultura"
                value={culture.nome_cultura}
                onChange={(value) =>
                  setCulture({ ...culture, nome_cultura: value })
                }
              />
              <Field
                label="Mínimo (%)"
                type="number"
                value={culture.umidade_minima}
                onChange={(value) =>
                  setCulture({ ...culture, umidade_minima: value })
                }
              />
              <Field
                label="Máximo (%)"
                type="number"
                value={culture.umidade_maxima}
                onChange={(value) =>
                  setCulture({ ...culture, umidade_maxima: value })
                }
              />
              <div className="flex items-end">
                <Button busy={saving === "culturas"}>
                  <Droplets size={15} />
                  Adicionar cultura
                </Button>
              </div>
            </form>
            <div className="mt-5 space-y-3">
              {culturas.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between rounded-xl border border-white/10 bg-slate-900/50 p-4"
                >
                  <span>
                    <Leaf size={16} className="mr-2 inline text-emerald-400" />
                    {item.nome}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.umidadeMin}% - {item.umidadeMax}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
        {aba === "dispositivos" && (
          <section className="account-section rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Dispositivos ESP32</h2>
            <form
              onSubmit={handleDeviceSubmit}
              className="mt-5 grid gap-3 sm:grid-cols-4"
            >
              <Field
                label="Nome do dispositivo"
                value={device.nome_dispositivo}
                onChange={(value) =>
                  setDevice({ ...device, nome_dispositivo: value })
                }
              />
              <Field
                label="MAC address"
                value={device.mac_address}
                onChange={(value) =>
                  setDevice({ ...device, mac_address: value })
                }
              />
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-wide text-slate-400">
                  Fazenda
                </span>
                <select
                  required
                  value={device.id_fazenda}
                  onChange={(event) =>
                    setDevice({ ...device, id_fazenda: event.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100"
                >
                  <option value="">Selecione</option>
                  {fazendas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="ID do campo / talhão"
                type="number"
                value={device.id_campo}
                onChange={(value) => setDevice({ ...device, id_campo: value })}
              />
              <div className="sm:col-span-4">
                <Button busy={saving === "dispositivos"}>
                  <Wifi size={15} />
                  Vincular dispositivo
                </Button>
              </div>
            </form>
            <div className="mt-5 space-y-3">
              {dispositivos.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between rounded-xl border border-white/10 bg-slate-900/50 p-4"
                >
                  <span>
                    <strong className="block">{item.nome}</strong>
                    <small className="text-slate-400">
                      {item.mac} · {item.fazenda || "Fazenda"}
                    </small>
                  </span>
                  <span
                    className={
                      item.online ? "text-emerald-400" : "text-slate-500"
                    }
                  >
                    {item.online ? (
                      <Wifi size={14} className="inline mr-1" />
                    ) : (
                      <WifiOff size={14} className="inline mr-1" />
                    )}
                    {item.online ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      </main>
    </div>
  );
}
