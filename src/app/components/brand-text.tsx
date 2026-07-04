/**
 * Helper de marque — met « IPPOO TRIIP » en gras partout où le nom apparaît
 * dans un texte (y compris au milieu d'une phrase issue de données).
 */
import { Fragment, type ReactNode } from "react";

const BRAND = "IPPOO TRIIP";

/** Renvoie le texte avec chaque occurrence de « IPPOO TRIIP » en gras. */
export function boldBrand(text: string): ReactNode {
  if (!text || !text.includes(BRAND)) return text;
  const parts = text.split(BRAND);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <strong className="font-bold">{BRAND}</strong>}
    </Fragment>
  ));
}
