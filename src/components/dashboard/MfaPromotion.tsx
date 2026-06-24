"use client";

/**
 * @purpose Renderiza una componente promocional para Autenticación Multifactor (MFA) con una alerta flotante, título, descripción, botón de llamada a acción y badge de certificación SOC2.
 * @purpose_en Renders a promotional component for Multi-Factor Authentication (MFA), featuring an alert icon, title, description, call-to-action button, and a SOC2 certification badge.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:d2m7bh
 * @lastUpdated 2026-06-21T12:03:47.917Z
 */

import React from 'react';
import { ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface MfaPromotionProps {
  t: {
    mfa_title: string;
    mfa_desc: string;
    mfa_cta: string;
    mfa_badge: string;
  };
  locale: string;
}

export function MfaPromotion({ t, locale }: MfaPromotionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden group rounded-none border border-amber-500/30 bg-amber-500/5 p-6 mb-6"
    >
      {/* 🎭 Industrial Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl -mr-32 -mt-32 pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-none bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 transition-transform duration-500 group-hover:scale-105">
            <ShieldAlert size={28} />
          </div>
        </div>

        <div className="flex-grow text-center md:text-left space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center justify-center md:justify-start gap-2">
            <span className="w-1 h-1 bg-amber-600 rounded-full" />
            {t.mfa_title}
          </h3>
          <p className="text-[11px] text-muted-foreground font-bold leading-relaxed max-w-2xl">
            {t.mfa_desc}
          </p>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
          <Link 
            href={`/${locale}/dashboard/security`}
            className="flex items-center justify-center gap-2 px-6 h-10 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-none text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
          >
            {t.mfa_cta}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* 🛡️ SOC2 Certification Badge */}
      <div className="absolute top-4 right-4 hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-amber-500/10 border border-amber-500/20">
        <ShieldCheck size={10} className="text-amber-600" />
        <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest">{t.mfa_badge}</span>
      </div>
    </motion.div>
  );
}
