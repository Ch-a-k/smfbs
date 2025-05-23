'use client'

import { motion } from 'framer-motion'
import { useI18n } from '@/i18n/I18nContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Hammer, 
  Users, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Shirt,
  HardHat,
  Glasses,
  Wrench
} from 'lucide-react'
import { ReactElement, useState, useMemo } from 'react'
import Link from 'next/link'
import { FloatingImages } from '@/components/FloatingImages'
import { ExtraItemsSection } from '@/components/ExtraItemsSection'
import BookingModal from './booking/BookingModal'
import { Package as BasePackage } from '@/types/booking'
import Cookies from "universal-cookie"
import useSWR from 'swr'

// Types
type Tool = 'ubranie' | 'kask' | 'rękawice'

interface Package {
  id: number
  name: string
  description: string
  items: string[]
  tools: Tool[]
  people: string
  duration: string
  price: string
  difficulty: string
  bookingUrl: string
  isBestseller?: boolean
}

// Constants
const TOOL_ICONS: Record<Tool, ReactElement> = {
  'ubranie': <Shirt className="w-4 h-4" />,
  'kask': <HardHat className="w-4 h-4" />,
  'rękawice': <Glasses className="w-4 h-4" />
}

// Animations
const sectionAnimation = {
  initial: { opacity: 0, y: -20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const cardAnimation = (index: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: index * 0.1 }
})

const itemAnimation = (index: number) => ({
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  transition: { delay: 0.2 + index * 0.1 }
})

// Components
function SectionTitle({ title }: { title: string }) {
  return (
    <div className="text-center mb-24">
      <motion.div {...sectionAnimation} className="inline-block">
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          {title}
        </h2>
        <div className="flex justify-center mt-4">
          <div className="h-1 w-12 bg-gradient-to-r from-[#f36e21] to-[#ff9f58] rounded-full" />
        </div>
      </motion.div>
    </div>
  )
}

function PackageItems({ items, isBestseller }: { items: string[], isBestseller?: boolean }) {
  const { t } = useI18n()
  
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white/60 mb-3">
        <Hammer className="w-4 h-4" />
        {t('home.pricing.toDestroy')}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <motion.li
            key={i}
            {...itemAnimation(i)}
            className="flex items-start gap-2"
          >
            <CheckCircle2 className={cn(
              "w-4 h-4 mt-1",
              isBestseller ? "text-[#f36e21]" : "text-white/40"
            )} />
            <span className="text-sm text-white/80">{item}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function Tooltip({ content, children }: { content: string, children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
        </div>
      )}
    </div>
  );
}

function PackageTools({ tools, isBestseller }: { tools: Tool[], isBestseller?: boolean }) {
  const { t } = useI18n()
  
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white/60 mb-3">
        <Wrench className="w-4 h-4" />
        {t('home.pricing.tools')}
      </div>
      <div className="flex gap-3">
        {tools.map((tool) => (
          <Tooltip 
            key={tool} 
            content={t(`home.pricing.equipment.tooltips.${tool}`)}
          >
            <div 
              className={cn(
                "p-2 rounded-lg",
                "bg-white/5 border border-white/10",
                isBestseller && "text-[#f36e21]"
              )}
            >
              {TOOL_ICONS[tool]}
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

function PackageInfo({ people, duration }: { people: string, duration: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-white/60 pt-2">
      <div className="flex items-center gap-1.5">
        <Users className="w-4 h-4" />
        {people}
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4" />
        {duration}
      </div>
    </div>
  )
}

interface PricingCardWithModalProps {
  pkg: Package;
  index: number;
}

function PricingCardWithModal({ pkg, index }: PricingCardWithModalProps) {
  const { t } = useI18n()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isBestseller = pkg.isBestseller;

  const packageData: BasePackage = useMemo(() => {
    const getDuration = (durationStr: string): number => {
      const match = durationStr.match(/\d+/);
      return match ? parseInt(match[0], 10) : 60;
    };

    const getMaxPeople = (peopleStr: string): number => {
      if (peopleStr.includes('-')) {
        const match = peopleStr.match(/(\d+)-(\d+)/);
        return match ? parseInt(match[2], 10) : 6;
      }
      const match = peopleStr.match(/\d+/);
      return match ? parseInt(match[0], 10) : 6;
    };

    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      depositAmount: 20,
      duration: getDuration(pkg.duration),
      maxPeople: getMaxPeople(pkg.people),
      isBestseller: pkg.isBestseller
    };
  }, [pkg]);

  return (
    <>
      <motion.div
        {...cardAnimation(index)}
        className={cn(
          "relative group w-full",
          isBestseller && "lg:scale-110 lg:-translate-y-4 z-10"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isBestseller && (
          <div className="absolute -inset-[2px] rounded-[20px] bg-gradient-to-r from-[#f36e21] via-[#ff9f58] to-[#f36e21] animate-border-flow" />
        )}

        <div className={cn(
          "relative rounded-[18px] p-6",
          "bg-black/40 backdrop-blur-xl",
          "border transition-all duration-300",
          "flex flex-col h-full",
          isBestseller 
            ? "border-transparent shadow-xl shadow-[#f36e21]/20" 
            : isHovered 
              ? "border-white/30" 
              : "border-white/10 hover:border-white/20"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={cn(
                "text-lg font-bold",
                isBestseller ? "text-[#f36e21]" : "text-white"
              )}>
                {pkg.name}
              </h3>
              <div className="mt-1 text-xl font-bold text-white">
                {pkg.price}
              </div>
            </div>
            {isBestseller && (
              <Badge 
                variant="destructive"
                className="flex items-center gap-1 bg-[#f36e21]/80 hover:bg-[#f36e21] text-white"
              >
                <Sparkles className="w-3 h-3" />
                {t('home.pricing.bestSeller')}
              </Badge>
            )}
          </div>

          <div className="flex-1 pt-4 space-y-4">
            <PackageItems items={pkg.items} isBestseller={isBestseller} />
            <PackageTools tools={pkg.tools} isBestseller={isBestseller} />
            <PackageInfo people={pkg.people} duration={pkg.duration} />
          </div>

          <motion.button 
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "block w-full py-3 px-4 rounded-lg text-center mt-6",
              "font-medium text-sm",
              "transform transition-all duration-200",
              isBestseller
                ? "bg-[#f36e21] text-white hover:bg-[#f36e21]/90 shadow-lg shadow-[#f36e21]/20"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
            whileHover={{ 
              scale: 1.03,
              boxShadow: isBestseller ? "0 8px 20px rgba(243, 110, 33, 0.3)" : "0 8px 16px rgba(0, 0, 0, 0.3)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {t('home.pricing.bookNow')}
          </motion.button>
        </div>
      </motion.div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageData={packageData}
      />
    </>
  );
}

export function PricingSection() {
  const { t } = useI18n()
  const cookies = new Cookies();
  const accessToken = cookies.get('access_token');

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error('Failed to fetch packages')
    }
    return res.json()
  }

  const { data: packages, error } = useSWR('http://localhost:89/api/packages', fetcher)

  if (error) return <div>Failed to load packages</div>
  if (!packages) return <div>Loading...</div>

  const transformedPackages = packages.map((pkg: any) => {
    let items: string[] = []
    let tools: Tool[] = ['ubranie', 'kask', 'rękawice']
    let people = ''
    let duration = ''
    let difficulty = ''

    if (pkg.name.toLowerCase().includes('trudny')) {
      items = t('home.pricing.packages.extreme.items', { returnObjects: true }) as string[]
      people = t('home.pricing.people.1-6')
      duration = t('home.pricing.duration.180')
      difficulty = t('home.pricing.packages.extreme.difficulty')
    } else if (pkg.name.toLowerCase().includes('średni')) {
      items = t('home.pricing.packages.hard.items', { returnObjects: true }) as string[]
      people = t('home.pricing.people.1-4')
      duration = t('home.pricing.duration.120')
      difficulty = t('home.pricing.packages.hard.difficulty')
    } else if (pkg.name.toLowerCase().includes('łatwy')) {
      items = t('home.pricing.packages.medium.items', { returnObjects: true }) as string[]
      people = t('home.pricing.people.1-2')
      duration = t('home.pricing.duration.45')
      difficulty = t('home.pricing.packages.medium.difficulty')
    } else {
      items = t('home.pricing.packages.easy.items', { returnObjects: true }) as string[]
      people = t('home.pricing.people.1-2')
      duration = t('home.pricing.duration.30')
      difficulty = t('home.pricing.packages.easy.difficulty')
    }

    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      items,
      tools,
      people,
      duration,
      price: `${pkg.price} PLN`,
      difficulty,
      bookingUrl: '',
      isBestseller: pkg.is_best_seller
    }
  })

  return (
    <section id="booking" className="relative w-full bg-[#231f20] py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#f36e21]/5 rounded-full blur-[150px]" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-[#231f20]/90 rounded-full blur-[150px]" />
      
      <FloatingImages />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <SectionTitle title={t('home.pricing.title')} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {transformedPackages.map((pkg: Package, index: number) => (
            <PricingCardWithModal key={pkg.id} pkg={pkg} index={index} />
          ))}
        </div>
      </div>
      <ExtraItemsSection />
    </section>
  )
}