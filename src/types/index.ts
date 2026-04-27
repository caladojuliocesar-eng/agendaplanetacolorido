// ============================================
// Agenda Digital Ottomatic — Type Definitions
// ============================================

// Alimentação status: 0=não preenchido, 1=Bom, 2=Pouco, 3=Recusou
export type FeedingStatus = 0 | 1 | 2 | 3;

export const FEEDING_LABELS: Record<FeedingStatus, string> = {
  0: "",
  1: "Bom",
  2: "Pouco",
  3: "Recusou",
};

export const FEEDING_COLORS: Record<FeedingStatus, string> = {
  0: "neutral",
  1: "success",
  2: "warning",
  3: "danger",
};

export const FEEDING_EMOJI: Record<FeedingStatus, string> = {
  0: "⬜",
  1: "😋",
  2: "😐",
  3: "😕",
};

export interface Feeding {
  frutas: FeedingStatus;
  almoco: FeedingStatus;
  lancheTarde: FeedingStatus;
  jantar: FeedingStatus;
  outros: FeedingStatus;
}

export const FEEDING_ITEMS: { key: keyof Feeding; label: string }[] = [
  { key: "frutas", label: "Frutas" },
  { key: "almoco", label: "Almoço" },
  { key: "lancheTarde", label: "Lanche da Tarde" },
  { key: "jantar", label: "Jantar" },
  { key: "outros", label: "Outros" },
];

export interface Activities {
  rodaHistoria: boolean;
  rodaConversa: boolean;
  recreacaoDirigida: boolean;
  recreacaoLivre: boolean;
  edFisica: boolean;
  artes: boolean;
  danca: boolean;
  ingles: boolean;
  parque: boolean;
  musica: boolean;
  natacao: boolean;
}

export const ACTIVITY_ITEMS: { key: keyof Activities; label: string; emoji: string }[] = [
  { key: "rodaHistoria", label: "Roda de História", emoji: "📖" },
  { key: "rodaConversa", label: "Roda de Conversa", emoji: "💬" },
  { key: "recreacaoDirigida", label: "Recreação Dirigida", emoji: "🎯" },
  { key: "recreacaoLivre", label: "Recreação Livre", emoji: "🎈" },
  { key: "edFisica", label: "Ed. Física", emoji: "🏃" },
  { key: "artes", label: "Artes", emoji: "🎨" },
  { key: "danca", label: "Dança", emoji: "💃" },
  { key: "ingles", label: "Inglês", emoji: "🇬🇧" },
  { key: "parque", label: "Parque", emoji: "🌳" },
  { key: "musica", label: "Música", emoji: "🎵" },
  { key: "natacao", label: "Natação", emoji: "🏊" },
];

export type UserRole = "professor" | "pai" | "admin";

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  role: UserRole;
  escolaId: string;
  turma?: string;        // professor: turma que leciona
  filhos?: string[];     // pai: IDs dos alunos
  criadoEm: string;
}

export interface Student {
  id: string;
  nome: string;
  turma: string;
  escolaId: string;
  fotoUrl: string | null;
  paiIds: string[];
  criadoEm: string;
}

export interface DailyRecord {
  id: string;            // formato: {alunoId}_{data}
  alunoId: string;
  escolaId: string;
  turma: string;
  data: string;          // "YYYY-MM-DD"
  alimentacao: Feeding;
  atividades: Activities;
  atividadeTexto: string;
  observacoes: string;
  recadoPais: string;
  recadoLidoProfessor: boolean;
  resumoIA: string | null;
  lido: boolean;
  dataLeitura: string | null;
  professorId: string;
  criadoEm: string;
  atualizadoEm: string;
}

// Default empty values for creating new records
export const DEFAULT_FEEDING: Feeding = {
  frutas: 0,
  almoco: 0,
  lancheTarde: 0,
  jantar: 0,
  outros: 0,
};

export const DEFAULT_ACTIVITIES: Activities = {
  rodaHistoria: false,
  rodaConversa: false,
  recreacaoDirigida: false,
  recreacaoLivre: false,
  edFisica: false,
  artes: false,
  danca: false,
  ingles: false,
  parque: false,
  musica: false,
  natacao: false,
};
