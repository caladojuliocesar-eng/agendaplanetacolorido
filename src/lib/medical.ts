import { Student, MedicamentoTemporario } from "@/types";

/**
 * Checks if a string contains a real critical medical warning (allergies, chronic conditions, dietary restrictions).
 * Filters out SOS/fever authorization notes like "Dipirona se febre", "Paracetamol", "SOS", "nao", "nenhum", etc.
 */
export function isCriticalMedicalAlert(text?: string): boolean {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  if (clean.length === 0) return false;

  // Common negative responses
  const negatives = [
    "não", "nao", "nenhum", "nenhuma", "não possui", "nao possui",
    "não tem", "nao tem", "n/a", "-", "nada", "sem restrição", "sem restricao", "sem restrições", "sem restricoes"
  ];
  if (negatives.includes(clean)) return false;

  // Check if text is purely a fever/SOS authorization note (e.g. "dipirona em caso de febre", "paracetamol sos")
  // NOTE: If it explicitly specifies an allergy to a medication (e.g., "alergia a dipirona", "alérgico a paracetamol"), it IS a critical alert!
  const hasExplicitAllergyKeyword = 
    clean.includes("alerg") || 
    clean.includes("alérg") || 
    clean.includes("intoleran") || 
    clean.includes("restriç") ||
    clean.includes("asma") ||
    clean.includes("diabete") ||
    clean.includes("epileps");

  const isFeverSOS = (clean.includes("febre") || clean.includes("sos") || clean.includes("se precisar") || clean.includes("se houver febre")) && !hasExplicitAllergyKeyword;

  if (isFeverSOS) return false;

  return true;
}

/**
 * Gets active temporary medications for a given target date (defaults to today's date "YYYY-MM-DD").
 */
export function getActiveTemporaryMedications(meds?: MedicamentoTemporario[], targetDateStr?: string): MedicamentoTemporario[] {
  if (!meds || meds.length === 0) return [];
  const todayStr = targetDateStr || new Date().toISOString().split("T")[0];

  return meds.filter(m => {
    if (!m.dataInicio || !m.dataFim) return false;
    return todayStr >= m.dataInicio && todayStr <= m.dataFim;
  });
}

/**
 * Summarizes medical status for a student.
 */
export function getStudentMedicalSummary(student: Student, targetDateStr?: string) {
  const hasCriticalAllergy = isCriticalMedicalAlert(student.alergias);
  const hasCriticalDiet = isCriticalMedicalAlert(student.restricoesAlimentares);
  const hasCriticalMedication = isCriticalMedicalAlert(student.medicamentosContinuos);

  const activeTempMeds = getActiveTemporaryMedications(student.medicamentosTemporarios, targetDateStr);
  const hasActiveTempMeds = activeTempMeds.length > 0;

  const hasAnyCritical = hasCriticalAllergy || hasCriticalDiet || hasCriticalMedication;

  return {
    hasAnyCritical,
    hasCriticalAllergy,
    hasCriticalDiet,
    hasCriticalMedication,
    activeTempMeds,
    hasActiveTempMeds,
    alergias: hasCriticalAllergy ? student.alergias : undefined,
    restricoes: hasCriticalDiet ? student.restricoesAlimentares : undefined,
    medicamentosContinuos: hasCriticalMedication ? student.medicamentosContinuos : undefined,
  };
}
