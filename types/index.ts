export interface AnalysisData {
  evaluacion_heuristicas: {
    nombre: string;
    estado?: "pasa" | "advertencia" | "falla";
    puntuacion: number;
    comentario: string;
  }[];
  facilidad_cognitiva?: {
    nivel_facilidad: number;
    semaforo?: "bajo" | "medio" | "alto";
    factores: string[];
  };
  carga_cognitiva?: {
    nivel_esfuerzo: number;
    semaforo: "bajo" | "medio" | "alto";
    factores: string[];
  };
  puntajes_categorias?: {
    heuristicas: number;
    carga_cognitiva?: number;
  };
  puntaje_global: number;
}

export interface HistoryItem {
  _id: string;
  url: string;
  result: AnalysisData;
  createdAt: string;
}
