import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Lock, LucideIcon, Mail, Phone, Radio, Sprout, User } from 'lucide-react';
import { apiFetch } from '../services/http';
import { saveSession } from '../services/session';
import { AuthCabecalho, AuthCampo, AuthErro, AuthLayout, RegrasSenha, SessaoAberta } from './AuthLayout';
import { useTituloPagina } from '../hooks/useTituloPagina';

const destaques = [
  { icone: Sprout, titulo: 'Cadastro gratuito', detalhe: 'Fazendas, talhões e culturas' },
  { icone: Radio, titulo: 'Dispositivos ESP32', detalhe: 'Vínculo pelo código MAC' },
  { icone: BookOpen, titulo: 'Estudos agrícolas', detalhe: 'Referências técnicas por cultura' },
];

const SENHA_MINIMA = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Campos = { nome: string; email: string; telefone: string; senha: string; confirmacao: string };
type Erros = Partial<Record<keyof Campos, string>>;

// Formata enquanto digita: (11) 98765-4321 para celular, (11) 3456-7890 para fixo.
// Números que não seguem o padrão brasileiro (ex.: começando com +) ficam como foram digitados.
function formatarTelefone(valor: string) {
  if (/^\s*\+/.test(valor)) return valor;
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Mesmas regras do servidor, para o usuário ver o problema antes de enviar.
function validar(campos: Campos): Erros {
  const erros: Erros = {};
  const senha = campos.senha.trim();
  if (!campos.nome.trim()) erros.nome = 'Informe seu nome.';
  else if (campos.nome.trim().length > 100) erros.nome = 'Use no máximo 100 caracteres.';
  if (!EMAIL_PATTERN.test(campos.email.trim())) erros.email = 'Informe um e-mail válido.';
  if (campos.telefone.trim().length > 20) erros.telefone = 'Use no máximo 20 caracteres.';
  if (senha.length < SENHA_MINIMA || !/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha))
    erros.senha = `Use pelo menos ${SENHA_MINIMA} caracteres, com letras e números.`;
  else if (new TextEncoder().encode(senha).length > 72) erros.senha = 'Senha longa demais.';
  if (campos.confirmacao.trim() !== senha) erros.confirmacao = 'As senhas não coincidem.';
  return erros;
}

const Cadastro: React.FC = () => {
  useTituloPagina("Criar conta");
  const navigate = useNavigate();
  const [campos, setCampos] = useState<Campos>({ nome: '', email: '', telefone: '', senha: '', confirmacao: '' });
  const [erros, setErros] = useState<Erros>({});
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const atualizar = (campo: keyof Campos) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const valor = campo === 'telefone' ? formatarTelefone(event.target.value) : event.target.value;
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    const encontrados = validar(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    setCarregando(true);
    try {
      const response = await apiFetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: campos.nome.trim(),
          email: campos.email.trim(),
          telefone: campos.telefone.trim(),
          senha: campos.senha.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        saveSession(data.accessToken, data.usuario);
        navigate('/painel', { replace: true });
        return;
      }
      const mensagens: Record<number, string> = {
        409: 'Este e-mail já está cadastrado. Entre com sua senha.',
        429: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.',
        503: 'O serviço está temporariamente indisponível. Tente novamente em instantes.',
      };
      setErro(data.mensagem || mensagens[response.status] || 'Não foi possível concluir o cadastro.');
    } catch {
      setErro('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const campo = (
    id: keyof Campos,
    label: string,
    icone: LucideIcon,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <AuthCampo
      id={`cadastro-${id}`}
      label={label}
      icone={icone}
      erro={erros[id]}
      value={campos[id]}
      onChange={atualizar(id)}
      className={erros[id] ? 'input-invalid' : undefined}
      {...props}
    />
  );

  return (
    <AuthLayout
      vitrineTitulo="Crie sua conta e organize"
      vitrineDestaque="a sua propriedade."
      vitrineTexto="Depois do cadastro você já entra no painel para registrar fazendas, vincular dispositivos e consultar os estudos agrícolas."
      destaques={destaques}
      compacto
    >
      <AuthCabecalho titulo="Criar conta" subtitulo="Preencha seus dados para começar" />

      <form onSubmit={handleSubmit} className="login-form signup-form" noValidate>
        <SessaoAberta />
        <div className="signup-row">
          {campo('nome', 'Nome completo', User, { type: 'text', autoComplete: 'name', maxLength: 100, required: true, placeholder: 'Seu nome' })}
          {campo('telefone', 'Telefone (opcional)', Phone, { type: 'tel', autoComplete: 'tel', maxLength: 20, placeholder: '(00) 00000-0000' })}
        </div>
        {campo('email', 'E-mail', Mail, { type: 'email', autoComplete: 'email', maxLength: 100, required: true, placeholder: 'seu@email.com' })}
        <div className="signup-row">
          {campo('senha', 'Senha', Lock, { type: 'password', autoComplete: 'new-password', required: true, placeholder: '••••••••' })}
          {campo('confirmacao', 'Confirmar senha', Lock, { type: 'password', autoComplete: 'new-password', required: true, placeholder: '••••••••' })}
        </div>
        <RegrasSenha senha={campos.senha} minimo={SENHA_MINIMA} confirmacao={campos.confirmacao} />

        {erro && <AuthErro>{erro}</AuthErro>}

        <button type="submit" disabled={carregando} className="login-btn">
          {carregando ? (
            <>
              <div className="spinner" />
              <span>Criando conta...</span>
            </>
          ) : (
            <>Criar conta <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

      <p className="login-switch">
        Já tem uma conta? <Link to="/login">Entrar</Link>
      </p>

      <footer className="login-footer">
        © 2026 AgroVia — Tecnologia para o Campo
      </footer>
    </AuthLayout>
  );
};

export default Cadastro;
