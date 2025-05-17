'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  session_count: number;
  validity_days: number | null;
}

export default function PricesPage() {
  const { user } = useAuth();
  const [matPlans, setMatPlans] = useState<Plan[]>([]);
  const [reformerPlans, setReformerPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch Mat Plans
        const { data: matData, error: matError } = await supabase
          .from('plans_mat')
          .select('*')
          .order('price');

        if (matError) throw new Error(`Error fetching Mat plans: ${matError.message}`);
        
        // Fetch Reformer Plans
        const { data: reformerData, error: reformerError } = await supabase
          .from('plans_reformer')
          .select('*')
          .order('price');

        if (reformerError) throw new Error(`Error fetching Reformer plans: ${reformerError.message}`);

        setMatPlans(matData || []);
        setReformerPlans(reformerData || []);
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1, 
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5
      }
    })
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: 'easeOut'
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const renderPlanCard = (plan: Plan, index: number, type: 'mat' | 'reformer') => {
    const selectPath = type === 'mat' ? '/select-mat' : '/select-reformer';
    const redirectPath = user ? selectPath : `/login?redirect=${selectPath}`;
    
    return (
      <motion.div
        key={plan.id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[#E57F84]/20"
      >
        <h3 className="text-xl font-semibold text-[#E57F84] mb-3 font-inter">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-800">{formatPrice(plan.price)}</span>
        </div>
        <div className="mb-6 text-gray-700">
          <p className="mb-2">{plan.description}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-medium">Ședințe:</span> {plan.session_count}</p>
            <p><span className="font-medium">Valabilitate:</span> {plan.validity_days ? `${plan.validity_days} zile` : 'Nelimitat'}</p>
          </div>
        </div>
        <Link href={redirectPath}>
          <Button className="w-full bg-[#E57F84] hover:bg-[#E57F84]/90 text-white font-medium">
            Alege Abonament
          </Button>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <motion.h1
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="text-4xl md:text-5xl font-bold text-[#E57F84] mb-16 pb-4 text-center font-josefin"
      >
        Preturi si Abonamente
      </motion.h1>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E57F84]"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8">
          <p>{error}</p>
          <p className="text-sm mt-2">Vă rugăm să încercați din nou mai târziu sau contactați-ne pentru asistență.</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <section className="mb-16">
            <FadeInOnScroll>
              <div className="bg-[#E57F84]/5 p-8 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 font-inter mb-6 text-center">Pilates Reformer</h2>
                <p className="text-gray-700 mb-6 text-center">
                  Experimentează antrenamente avansate pe aparatul Reformer pentru rezultate rapide și eficiente.
                  Ideal pentru tonifiere, recuperare și îmbunătățirea posturii.
                </p>
              </div>
            </FadeInOnScroll>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reformerPlans.length > 0 ? (
                reformerPlans.map((plan, index) => (
                  <FadeInOnScroll key={plan.id} delay={index * 0.1}>
                    {renderPlanCard(plan, index, 'reformer')}
                  </FadeInOnScroll>
                ))
              ) : (
                <p className="text-gray-500 col-span-full text-center py-8">Nu există abonamente disponibile momentan.</p>
              )}
            </div>
          </section>

          <section className="mb-16">
            <FadeInOnScroll>
              <div className="bg-[#E57F84]/5 p-8 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 font-inter mb-6 text-center">Pilates pe Saltea</h2>
                <p className="text-gray-700 mb-6 text-center">
                  Antrenamente complete pentru corp și minte, perfecte pentru toate nivelurile de experiență.
                  Dezvoltă-ți forța, flexibilitatea și echilibrul cu exerciții adaptate nevoilor tale.
                </p>
              </div>
            </FadeInOnScroll>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matPlans.length > 0 ? (
                matPlans.map((plan, index) => (
                  <FadeInOnScroll key={plan.id} delay={index * 0.1}>
                    {renderPlanCard(plan, index, 'mat')}
                  </FadeInOnScroll>
                ))
              ) : (
                <p className="text-gray-500 col-span-full text-center py-8">Nu există abonamente disponibile momentan.</p>
              )}
            </div>
          </section>

          <section className="mb-8 bg-[#E57F84]/5 p-8 rounded-lg shadow-md">
            <FadeInOnScroll>
              <h2 className="text-2xl font-semibold text-gray-800 font-inter mb-6 text-center">Întrebări Frecvente</h2>
              <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-[#E57F84] mb-2">Cum pot achiziționa un abonament?</h3>
                <p className="text-gray-700">
                  Pentru a achiziționa un abonament, selectați opțiunea dorită și urmați pașii de înregistrare. Plata se poate efectua online sau la recepția studioului nostru.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#E57F84] mb-2">Care este diferența între Pilates pe Saltea și Reformer?</h3>
                <p className="text-gray-700">
                  Pilates pe Saltea folosește greutatea corpului și accesorii simple, fiind ideal pentru începători. Reformer oferă rezistență ajustabilă prin intermediul aparatului special, permițând exerciții mai intense și variate.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#E57F84] mb-2">Pot să-mi prelungesc abonamentul?</h3>
                <p className="text-gray-700">
                  Da, abonamentele pot fi prelungite oricând. Vă recomandăm să faceți acest lucru înainte de expirarea celui curent pentru a beneficia de continuitate.
                </p>
              </div>
              </div>
            </FadeInOnScroll>
          </section>
        </>
      )}
    </div>
  );
}
