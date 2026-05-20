"use client";
import { createContext, useContext } from "react";

export const LangContext = createContext({ lang: "en", t: {} });

export function useLang() {
  return useContext(LangContext);
}