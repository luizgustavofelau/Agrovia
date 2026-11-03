import React, { useEffect, useState } from "react";

const formatar = (now: Date) => {
  const hour = now.getHours();
  const date = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return {
    greeting: hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite",
    dateTime: `${date.charAt(0).toUpperCase()}${date.slice(1)} · ${now.toLocaleTimeString("pt-BR")}`,
  };
};

// O relógio atualiza a cada segundo só neste componente, sem re-renderizar o painel inteiro.
const DashboardGreeting: React.FC<{ name: string }> = ({ name }) => {
  const [agora, setAgora] = useState(() => formatar(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(formatar(new Date())), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <h1>{agora.greeting}, {name}</h1>
      <p>Visão geral da operação · <time>{agora.dateTime}</time></p>
    </>
  );
};

export default DashboardGreeting;
