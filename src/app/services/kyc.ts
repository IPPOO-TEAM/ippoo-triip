/**
 * KYC chauffeur IPPOO — vérification documents.
 *
 * Stratégie hybride :
 *  1. Côté client : extraction de champs basiques par regex sur le texte OCR
 *     (à brancher sur tesseract.js ou Google ML Kit — stub fourni).
 *  2. Côté serveur : vérification approfondie (Onfido / Smile ID Africa)
 *     déclenchée via /kyc/submit.
 */
import { api } from "./../api/client";
import { logger } from "./logger";

export type DocType = "cni" | "permis" | "carte_grise" | "selfie";

export type OCRResult = {
  rawText: string;
  fields: Partial<{
    fullName: string;
    documentNumber: string;
    dateOfBirth: string;
    expiryDate: string;
    nationality: string;
  }>;
  confidence: number;
};

/** OCR client — stub. Branchez tesseract.js : `import Tesseract from "tesseract.js"`. */
export async function runOcr(_file: File): Promise<OCRResult> {
  logger.info("kyc.ocr.stub", { hint: "Brancher tesseract.js dans services/kyc.ts" });
  await new Promise((r) => setTimeout(r, 600));
  return {
    rawText: "RÉPUBLIQUE DU BÉNIN\nCARTE NATIONALE D'IDENTITÉ\nNOM: AYODÉLÉ\nPRÉNOMS: KOSSI",
    fields: {
      fullName: "Kossi Ayodélé",
      documentNumber: "BJ" + Math.floor(Math.random() * 1e8),
      nationality: "Béninoise",
    },
    confidence: 0.78,
  };
}

export function extractFieldsFromText(text: string): OCRResult["fields"] {
  const fields: OCRResult["fields"] = {};
  const nomMatch = text.match(/NOMS?\s*:?\s*([A-ZÉÈÀÔÎÛ' -]{2,40})/i);
  const prenomMatch = text.match(/PR[ÉE]NOMS?\s*:?\s*([A-ZÉÈÀÔÎÛ' -]{2,40})/i);
  if (nomMatch && prenomMatch) fields.fullName = `${prenomMatch[1].trim()} ${nomMatch[1].trim()}`;
  const numMatch = text.match(/N[°O]?\s*:?\s*([A-Z0-9]{6,16})/i);
  if (numMatch) fields.documentNumber = numMatch[1];
  const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dobMatch) fields.dateOfBirth = dobMatch[1];
  return fields;
}

export async function submitKyc(input: {
  driverId: string;
  docs: { type: DocType; fileName: string; fields?: OCRResult["fields"] }[];
}) {
  return api.post("/kyc/submit", input);
}
