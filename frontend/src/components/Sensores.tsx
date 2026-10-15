import { useEffect, useMemo, useState } from "react";
import { Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { ConfirmDestructiveDialog } from "./ConfirmDestructiveDialog";
import { DispositivoCard, type Dispositivo } from "./DispositivoCard";
import { listarDispositivos, removerDispositivo } from "../services/dispositivos.api";
import "../styles/sensors.css";

const conectado = (dispositivo: Dispositivo) =>
  dispositivo.status === "ON" || dispositivo.status === "conectado" || dispositivo.online === true;

export default function Sensores() {
  const idUsuario = localStorage.getItem("usuarioId");
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dadosDemonstracao, setDadosDemonstracao] = useState(false);
  const [alvoRemocao, setAlvoRemocao] = useState<Dispositivo | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState("");
  const indicadores = useMemo(() => ({
    registrados: dispositivos.length,
    conectados: dispositivos.filter(conectado).length,
  }), [dispositivos]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!idUsuario) {
        setErro("Não foi possível identificar a conta. Saia e entre novamente.");
        setCarregando(false);
        return;
      }
      try {
        const resultado = await listarDispositivos(idUsuario);
        if (!cancelado) {
          setDispositivos(resultado.dispositivos);
          setDadosDemonstracao(resultado.demonstracao);
        }
      } catch (error) {
        if (!cancelado) {
          const mensagem = error instanceof Error ? error.message : "Não foi possível carregar os dispositivos.";
          setErro(mensagem);
          toast.error(mensagem);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  async function confirmarRemocao() {
    if (!alvoRemocao) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      const mensagem = "Sua sessão expirou. Entre novamente para remover o dispositivo.";
      setErroRemocao(mensagem);
      toast.error(mensagem);
      return;
    }

    setRemovendo(true);
    setErroRemocao("");
    try {
      await removerDispositivo(alvoRemocao.id, accessToken);
      setDispositivos((atuais) => atuais.filter((dispositivo) => dispositivo.id !== alvoRemocao.id));
      toast.success(`Dispositivo “${alvoRemocao.nome}” removido com sucesso.`);
      setAlvoRemocao(null);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Não foi possível remover o dispositivo.";
      setErroRemocao(mensagem);
      toast.error(mensagem);
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <div className="sensor-page min-h-full bg-[#f4f1ea] p-6 text-stone-800 sm:p-10">
      <Toaster richColors position="top-right" />
      <header className="sensor-page-header mb-8">
        <p className="sensor-eyebrow">Telemetria</p>
        <h1 className="text-3xl font-semibold text-stone-900">Dispositivos e sensores</h1>
        <p className="mt-1 text-stone-500">
          Consulte dispositivos vinculados. Leituras dependem de integração de telemetria.
        </p>
      </header>

      {dadosDemonstracao && (
        <div
          role="status"
          className="sensor-demo-notice mb-6 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          Modo demonstração: estes cadastros são exemplos da API e não estão persistidos no MySQL.
        </div>
      )}
      {erro && <p className="mb-5 text-sm text-red-700" role="alert">{erro}</p>}

      {carregando ? (
        <p className="text-stone-500">Carregando dispositivos...</p>
      ) : (
        <>
          {dispositivos.length > 0 && (
            <div className="sensor-summary" aria-label="Resumo dos dispositivos">
              <div><span>Dispositivos registrados</span><strong>{indicadores.registrados}</strong></div>
              <div><span>Conectados</span><strong>{indicadores.conectados}</strong></div>
              <div><span>Leituras de umidade</span><strong className="sensor-summary-unavailable">Não disponíveis</strong></div>
            </div>
          )}
          <div className="sensor-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {dispositivos.map((device) => (
              <DispositivoCard key={device.id} dispositivo={device} onSolicitarRemocao={(dispositivo) => {
                setErroRemocao("");
                setAlvoRemocao(dispositivo);
              }} />
            ))}
            {!erro && dispositivos.length === 0 && <p className="sensor-empty-state" role="status">Nenhum dispositivo registrado. Cadastre um dispositivo na área da Conta.</p>}
            <Link className="sensor-account-link" to="/conta?aba=dispositivos">
              <span aria-hidden="true"><Cpu size={22} /></span>
              <strong>Gerenciar dispositivos</strong>
              <small>Abrir cadastro na área da Conta</small>
            </Link>
          </div>
        </>
      )}
      <ConfirmDestructiveDialog
        open={alvoRemocao !== null}
        title="Remover dispositivo?"
        loading={removendo}
        error={erroRemocao}
        onCancel={() => setAlvoRemocao(null)}
        onConfirm={confirmarRemocao}
      >
        Confirma a remoção de <strong className="text-stone-900">{alvoRemocao?.nome}</strong>? O dispositivo será marcado como removido, deixará de aparecer nesta lista e seu status será definido como desconectado. Os registros existentes no banco não serão apagados.
      </ConfirmDestructiveDialog>
    </div>
  );
}
