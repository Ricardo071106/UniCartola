export function isMatchPredictionOpen(match: {
  status: string;
  scheduledAt: Date | string;
}): { open: boolean; message?: string } {
  if (match.status === "finished" || match.status === "cancelled") {
    return { open: false, message: "Partida encerrada — palpite bloqueado" };
  }
  if (match.status === "live") {
    return {
      open: false,
      message: "Jogo em andamento — palpites bloqueados até o apito inicial",
    };
  }

  const kickoff = new Date(match.scheduledAt).getTime();
  if (!Number.isNaN(kickoff) && Date.now() >= kickoff) {
    return {
      open: false,
      message: "Horário de início atingido — palpites bloqueados",
    };
  }

  return { open: true };
}
