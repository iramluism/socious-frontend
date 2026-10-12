import type { CatalogDefinition } from "../../shared/CatalogSection";

/** Illustrative Hugging Face model references; no download or inference. */
export const modelsCatalog: CatalogDefinition = {
  title: "Modelos",
  description: "Un espacio para organizar los modelos de tu memoria.",
  action: "Añadir modelo",
  route: "modelos",
  icon: "gen-ai",
  items: [
    {
      id: "multilingual-e5",
      name: "Multilingual E5 Small",
      description: "Representaciones vectoriales multilingües.",
      type: "Embeddings · Hugging Face",
      url: "https://huggingface.co/intfloat/multilingual-e5-small",
      details:
        "Referencia ilustrativa a intfloat/multilingual-e5-small. Sin descarga, credenciales, inferencia ni vinculación con Query.",
    },
    {
      id: "bge-reranker",
      name: "BGE Reranker v2 M3",
      description: "Referencia para reordenación de resultados.",
      type: "Reranking · Hugging Face",
      url: "https://huggingface.co/BAAI/bge-reranker-v2-m3",
      details:
        "Referencia ilustrativa a BAAI/bge-reranker-v2-m3. No está cargado ni ejecutándose; las consultas utilizan coincidencias léxicas locales.",
    },
  ],
};
