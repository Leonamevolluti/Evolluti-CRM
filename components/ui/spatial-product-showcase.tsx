'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Battery,
  Sliders,
  ChevronRight,
  Zap,
  Bluetooth,
  Wifi,
  Music,
  LucideIcon,
} from 'lucide-react';

// =========================================
// 1. CONFIGURATION & DATA TYPES
// =========================================

export type ProductId = 'auth' | 'destination' | 'sync' | 'contact';

export interface FeatureMetric {
  label: string;
  value: number; // 0-100
  icon: LucideIcon;
}

export interface ProductData {
  id: ProductId;
  label: string; // Display name for the switcher
  title: string;
  description: string;
  image: string;
  colors: {
    gradient: string; // Tailwind gradient classes
    glow: string; // Tailwind color class for accents
    ring: string; // Tailwind border color for rings
  };
  stats: {
    connectionStatus: string;
    batteryLevel: number;
  };
  features: FeatureMetric[];
}

/**
 * NOTE (adapted for this repo):
 * - Replaced external imagekit earbud assets with stable Unsplash stock images (space / cinematic).
 * - Added optional controlled props so we can use it as a "cinematic stage" behind the installer.
 */
const PRODUCT_DATA: Record<ProductId, ProductData> = {
  auth: {
    id: 'auth',
    label: 'Capítulo 1 — Autorização',
    title: 'Tudo começa com uma chave.',
    description:
      'Confirmando acesso para iniciar a jornada. Cole o PAT e seguimos em frente.',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
    colors: {
      gradient: 'from-cyan-600 to-slate-900',
      glow: 'bg-cyan-400',
      ring: 'border-l-cyan-400/40',
    },
    stats: { connectionStatus: 'Aguardando', batteryLevel: 88 },
    features: [
      { label: 'Validação', value: 72, icon: Wifi },
      { label: 'Segurança', value: 96, icon: Zap },
    ],
  },
  destination: {
    id: 'destination',
    label: 'Capítulo 2 — Destino',
    title: 'Onde nasce seu novo mundo.',
    description:
      'Escolha onde vamos pousar: sua organização e seu projeto Supabase.',
    image:
      'https://images.unsplash.com/photo-1447433819943-74a20887a81e?auto=format&fit=crop&w=1400&q=80',
    colors: {
      gradient: 'from-teal-600 to-slate-900',
      glow: 'bg-teal-400',
      ring: 'border-l-teal-400/40',
    },
    stats: { connectionStatus: 'Mapeando', batteryLevel: 81 },
    features: [
      { label: 'Projetos', value: 64, icon: Bluetooth },
      { label: 'Rota', value: 92, icon: Wifi },
    ],
  },
  sync: {
    id: 'sync',
    label: 'Capítulo 3 — Sincronização',
    title: 'Tudo no lugar.',
    description:
      'Alinhando chaves e ambiente. Auto-preenchimento e configuração silenciosa.',
    image:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80',
    colors: {
      gradient: 'from-sky-600 to-slate-900',
      glow: 'bg-sky-400',
      ring: 'border-l-sky-400/40',
    },
    stats: { connectionStatus: 'Sincronizando', batteryLevel: 76 },
    features: [
      { label: 'Chaves', value: 90, icon: Wifi },
      { label: 'Ambiente', value: 84, icon: Sliders },
    ],
  },
  contact: {
    id: 'contact',
    label: 'Capítulo 4 — Primeiro contato',
    title: 'Agora começa.',
    description:
      'Tudo pronto para entrar no novo mundo. Revisão final e ignição.',
    image:
      'https://images.unsplash.com/photo-1450849608880-6f787542c88a?auto=format&fit=crop&w=1400&q=80',
    colors: {
      gradient: 'from-indigo-700 to-slate-900',
      glow: 'bg-indigo-400',
      ring: 'border-l-indigo-400/35',
    },
    stats: { connectionStatus: 'Pronto', batteryLevel: 92 },
    features: [
      { label: 'Prontidão', value: 96, icon: Zap },
      { label: 'Conexão', value: 98, icon: Wifi },
    ],
  },
};

// =========================================
// 2. ANIMATION VARIANTS
// =========================================

const ANIMATIONS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
    },
    exit: { opacity: 0, y: -10, filter: 'blur(5px)' },
  },
  image: (isLeft: boolean): Variants => ({
    initial: {
      opacity: 0,
      scale: 1.5,
      filter: 'blur(15px)',
      rotate: isLeft ? -30 : 30,
      x: isLeft ? -80 : 80,
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      rotate: 0,
      x: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
    exit: {
      opacity: 0,
      scale: 0.6,
      filter: 'blur(20px)',
      transition: { duration: 0.25 },
    },
  }),
};

// =========================================
// 3. SUB-COMPONENTS
// =========================================

const BackgroundGradient = ({ isLeft }: { isLeft: boolean }) => (
  <div className="fixed inset-0 pointer-events-none">
    <motion.div
      animate={{
        background: isLeft
          ? 'radial-gradient(circle at 0% 50%, rgba(34, 211, 238, 0.16), transparent 55%)'
          : 'radial-gradient(circle at 100% 50%, rgba(45, 212, 191, 0.16), transparent 55%)',
      }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0"
    />
  </div>
);

const ProductVisual = ({ data, isLeft }: { data: ProductData; isLeft: boolean }) => (
  <motion.div layout="position" className="relative group shrink-0">
    {/* Animated Rings */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      className={`absolute inset-[-20%] rounded-full border border-dashed border-white/10 ${data.colors.ring}`}
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute inset-0 rounded-full bg-gradient-to-br ${data.colors.gradient} blur-2xl opacity-40`}
    />

    {/* Image Container */}
    <div className="relative h-80 w-80 md:h-[450px] md:w-[450px] rounded-full border border-white/5 shadow-2xl flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-sm">
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={data.id}
            src={data.image}
            alt={`${data.title}`}
            variants={ANIMATIONS.image(isLeft)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full object-cover opacity-90 mix-blend-screen p-4"
            draggable={false}
          />
        </AnimatePresence>
      </motion.div>
    </div>

    {/* Status Label */}
    <motion.div
      layout="position"
      className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 bg-zinc-950/80 px-4 py-2 rounded-full border border-white/5 backdrop-blur">
        <span className={`h-1.5 w-1.5 rounded-full ${data.colors.glow} animate-pulse`} />
        {data.stats.connectionStatus}
      </div>
    </motion.div>
  </motion.div>
);

const ProductDetails = ({ data, isLeft }: { data: ProductData; isLeft: boolean }) => {
  const alignClass = isLeft ? 'items-start text-left' : 'items-end text-right';
  const flexDirClass = isLeft ? 'flex-row' : 'flex-row-reverse';
  const barColorClass = isLeft ? 'left-0 bg-blue-500' : 'right-0 bg-emerald-500';

  return (
    <motion.div
      variants={ANIMATIONS.container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col ${alignClass}`}
    >
      <motion.h2
        variants={ANIMATIONS.item}
        className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2"
      >
        {data.label}
      </motion.h2>
      <motion.h1
        variants={ANIMATIONS.item}
        className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500"
      >
        {data.title}
      </motion.h1>
      <motion.p
        variants={ANIMATIONS.item}
        className={`text-zinc-400 mb-8 max-w-sm leading-relaxed ${
          isLeft ? 'mr-auto' : 'ml-auto'
        }`}
      >
        {data.description}
      </motion.p>

      {/* Feature Grid */}
      <motion.div
        variants={ANIMATIONS.item}
        className="w-full space-y-6 bg-zinc-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm"
      >
        {data.features.map((feature, idx) => (
          <div key={feature.label} className="group">
            <div className={`flex items-center justify-between mb-3 text-sm ${flexDirClass}`}>
              <div
                className={`flex items-center gap-2 ${
                  feature.value > 50 ? 'text-zinc-200' : 'text-zinc-400'
                }`}
              >
                <feature.icon size={16} /> <span>{feature.label}</span>
              </div>
              <span className="font-mono text-xs text-zinc-500">{feature.value}%</span>
            </div>
            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feature.value}%` }}
                transition={{ duration: 1, delay: 0.4 + idx * 0.15 }}
                className={`absolute top-0 bottom-0 ${barColorClass} opacity-80`}
              />
            </div>
          </div>
        ))}

        <div className={`pt-4 flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors group"
          >
            <Sliders size={14} /> Ver detalhes
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Battery */}
      <motion.div variants={ANIMATIONS.item} className={`mt-6 flex items-center gap-3 text-zinc-500 ${flexDirClass}`}>
        <Battery size={16} />
        <span className="text-sm font-medium">{data.stats.batteryLevel}%</span>
      </motion.div>
    </motion.div>
  );
};

const Switcher = ({
  activeId,
  onToggle,
}: {
  activeId: ProductId;
  onToggle: (id: ProductId) => void;
}) => {
  const options = Object.values(PRODUCT_DATA).map((p) => ({ id: p.id, label: p.label }));

  return (
    <div className="fixed bottom-12 inset-x-0 flex justify-center z-50 pointer-events-none">
      <motion.div
        layout
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
      >
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            whileTap={{ scale: 0.96 }}
            className="relative w-24 h-12 rounded-full flex items-center justify-center text-sm font-medium focus:outline-none"
          >
            {activeId === opt.id && (
              <motion.div
                layoutId="island-surface"
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-white/5 shadow-inner"
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              />
            )}
            <span
              className={`relative z-10 transition-colors duration-300 ${
                activeId === opt.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {opt.label}
            </span>
            {activeId === opt.id && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -bottom-1 h-1 w-6 rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

// =========================================
// 4. MAIN COMPONENT
// =========================================

type SpatialProductShowcaseProps = {
  /**
   * When provided, the component becomes controlled (installer can drive the scene).
   * When omitted, it behaves like the original demo (internal state + switcher).
   */
  activeSide?: ProductId;
  onChangeActiveSide?: (id: ProductId) => void;
  /** Hide the bottom switcher (useful when used purely as a background stage). */
  showSwitcher?: boolean;
  /** Additional className for the root container (useful: pointer-events-none/opacity). */
  className?: string;
};

export default function SpatialProductShowcase({
  activeSide: activeSideProp,
  onChangeActiveSide,
  showSwitcher = true,
  className,
}: SpatialProductShowcaseProps) {
  const [internalActiveSide, setInternalActiveSide] = useState<ProductId>('auth');
  const activeSide = activeSideProp ?? internalActiveSide;

  const setActiveSide = (id: ProductId) => {
    onChangeActiveSide?.(id);
    if (activeSideProp === undefined) setInternalActiveSide(id);
  };

  const currentData = useMemo(() => PRODUCT_DATA[activeSide], [activeSide]);
  // keep original "left/right" layout behavior: treat first two scenes as "left"
  const isLeft = activeSide === 'auth' || activeSide === 'destination';

  return (
    <div
      className={`relative min-h-screen w-full bg-black text-zinc-100 overflow-hidden selection:bg-zinc-800 flex flex-col items-center justify-center ${className || ''}`}
    >
      <BackgroundGradient isLeft={isLeft} />

      <main className="relative z-10 w-full px-6 py-8 flex flex-col justify-center max-w-7xl mx-auto">
        <motion.div
          layout
          transition={{ type: 'spring', bounce: 0, duration: 0.9 }}
          className={`flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32 lg:gap-48 w-full ${
            isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
          }`}
        >
          {/* Left Column: Visuals */}
          <ProductVisual data={currentData} isLeft={isLeft} />

          {/* Right Column: Content */}
          <motion.div layout="position" className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <ProductDetails key={activeSide} data={currentData} isLeft={isLeft} />
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      {showSwitcher ? <Switcher activeId={activeSide} onToggle={setActiveSide} /> : null}
    </div>
  );
}

