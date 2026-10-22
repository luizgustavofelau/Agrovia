import { FormEvent, useEffect, useState } from "react";
import { Mail, RefreshCw } from "lucide-react";

type ReportSettings = {
  ativo: boolean;
  frequencia: "diario" | "semanal";
  email: string;
  proximoEnvio?: string | null;
  ultimoEnvio?: string | null;
  smtpConfigurado: boolean;
};

const endpoint = "/api/relatorios/automacao";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
}

export default function ReportAutomation() {
  const [settings, setSettings] = useState<ReportSettings | null>(null);
  const [ativo, setAtivo] = useState(false);
  const [frequencia, setFrequencia] = useState<"diario" | "semanal">("semanal");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  async function carregarConfiguracao() {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Sua sessão expirou. Entre novamente para configurar os relatórios.");
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.mensagem || "Não foi possível carregar a configuração.");
    const result = data as ReportSettings;
    setSettings(result);
    setAtivo(result.ativo);
    setFrequencia(result.frequencia);
  }

  useEffect(() => {
    carregarConfiguracao()
      .catch((error: unknown) => {
        setMensagem(error instanceof Error ? error.message : "Serviço de relatórios indisponível.");
        setErro(true);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMensagem("Sua sessão expirou. Entre novamente para configurar os relatórios.");
      setErro(true);
      return;
    }

    setSalvando(true);
    setMensagem("");
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ativo, frequencia }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensagem || "Não foi possível salvar a configuração.");
      setMensagem(data.mensagem);
      setErro(false);
      await carregarConfiguracao();
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível salvar a configuração.");
      setErro(true);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="report-automation" aria-labelledby="report-automation-title">
      <div className="report-automation-heading">
        <span className="report-automation-icon" aria-hidden="true"><Mail size={19} /></span>
        <div>
          <p className="section-kicker">Acompanhamento recorrente</p>
          <h3 id="report-automation-title">Envio automático por e-mail</h3>
        </div>
      </div>
      <p className="report-automation-copy">
        Receba um resumo das propriedades e da conexão dos dispositivos cadastrados. Leituras e condições atuais da plantação só serão incluídas quando a telemetria estiver integrada; o relatório não inventa diagnósticos.
      </p>

      {carregando ? (
        <p className="report-automation-status">Carregando configuração…</p>
      ) : settings ? (
        <form onSubmit={salvar} className="report-automation-form">
          <label className="report-automation-toggle">
            <input type="checkbox" checked={ativo} onChange={(event) => setAtivo(event.target.checked)} />
            <span>Ativar relatórios automáticos</span>
          </label>
          <label className="report-automation-frequency">
            Frequência
            <select value={frequencia} onChange={(event) => setFrequencia(event.target.value as "diario" | "semanal")}>
              <option value="semanal">Semanal</option>
              <option value="diario">Diária</option>
            </select>
          </label>
          <p className="report-automation-meta">Destino: {settings.email}</p>
          <p className="report-automation-meta">Próximo envio: {ativo ? formatDate(settings.proximoEnvio) : "não agendado"} · Último envio: {formatDate(settings.ultimoEnvio)}</p>
          {!settings.smtpConfigurado && (
            <p className="report-automation-warning" role="status">O servidor ainda não configurou o envio de e-mail. A ativação ficará disponível após configurar o SMTP.</p>
          )}
          <button className="dashboard-secondary-btn report-automation-save" type="submit" disabled={salvando || (ativo && !settings.smtpConfigurado)}>
            <RefreshCw size={15} aria-hidden="true" />
            {salvando ? "Salvando…" : "Salvar preferência"}
          </button>
        </form>
      ) : (
        <p className="report-automation-warning" role={erro ? "alert" : "status"}>{mensagem}</p>
      )}
      {mensagem && settings && <p className={erro ? "report-automation-warning" : "report-automation-success"} role={erro ? "alert" : "status"}>{mensagem}</p>}
    </section>
  );
}
