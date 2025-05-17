"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [chevronOpacity, setChevronOpacity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  
  useEffect(() => {
    // Only show notification for non-logged in users
    if (!user) {
      setShowNotification(true);
      
      // Hide notification after 10 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const fadeStartScroll = 50; // Start fading after 50px of scroll
      const fadeEndScroll = 200;  // Fully faded after 200px of scroll
      const currentScrollY = window.scrollY;
      let newOpacity = 1;

      if (currentScrollY <= fadeStartScroll) {
        newOpacity = 1;
      } else if (currentScrollY >= fadeEndScroll) {
        newOpacity = 0;
      } else {
        // Linear fade
        newOpacity = 1 - (currentScrollY - fadeStartScroll) / (fadeEndScroll - fadeStartScroll);
      }
      setChevronOpacity(newOpacity);
      ticking = false; // Reset the flag
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleans up on unmount

  return (
    <main className="flex flex-col text-gray-800 bg-[#EBCECE] relative">
      {/* Notification Banner */}
      {showNotification && !user && (
        <div className="fixed top-20 left-0 right-0 z-50 mx-auto max-w-md bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-500 transform animate-fade-in">
          <div className="p-4 bg-gradient-to-r from-[#E57F84]/20 to-[#E57F84]/5 border-l-4 border-[#E57F84]">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-[#E57F84]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 w-full relative">
                <div className="absolute right-0 top-0">
                  <button 
                    onClick={() => setShowNotification(false)} 
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-800 font-medium text-center mb-2">Cum să începi:</p>
                <div className="flex items-center justify-center mt-1">
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-[#E57F84] text-center">Fă-ți cont</span>
                    </div>
                    <span>→</span>
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-[#E57F84] text-center">Selectează un abonament</span>
                    </div>
                    <span>→</span>
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-[#E57F84] text-center">Programează-te la ședințe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="w-full text-center min-h-screen flex flex-col justify-start items-center pt-16">
        <div className="container mx-auto px-4 pb-16 md:pb-24">
          {/* Desktop Header (hidden on mobile) */}
          <h1 className="hidden md:block text-5xl md:text-7xl font-title-specific text-black mb-16 animate-fade-in">
            Balance Between <br /> Mind and Body
          </h1>

          {/* Mobile Header (hidden on desktop) */}
          <div className="md:hidden mb-8">
            <h1 className="text-6xl md:text-8xl font-title-specific font-medium mb-0.5 animate-slide-up">Balance</h1>
            <h2 className="text-6xl md:text-8xl font-title-specific font-medium mb-0.5 animate-slide-up delay-100">between</h2>
            <h3 className="text-[2.25rem] font-title-specific font-medium mb-0.5 animate-slide-up delay-200">mind and body</h3>
          </div>

          <div className="flex justify-center relative"> 
            <Image 
              src="/images/middle_img_home_edited.JPG" 
              alt="Instructor demonstrând poziții de Pilates la Balance Studio Ploiești - echilibru și armonie în mișcare" 
              title="Pilates pentru echilibru între minte și corp la Balance Studio Ploiești"
              width={800} 
              height={480} 
              className="rounded-tl-[60px] rounded-br-[60px] rounded-tr-[20px] rounded-bl-[20px] shadow-xl object-cover animate-fade-in-scale delay-1000 md:w-[800px] md:h-[480px] w-[75vw] h-auto"
              priority
              quality={90}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQIGAwAAAAAAAAAAAAABAgMABAUGESExQVFhcf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmzHMVs7y9gtrZEeOEKpkfU5JGpwOgNt6VRQCf//Z"
            />
            <div
          className="absolute bottom-40 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-300"
          style={{ opacity: chevronOpacity }}
        >
          <ChevronDown className="hidden md:block w-10 h-10 text-white animate-bounce" />
        </div>
          </div>
          <p className="md:hidden text-base text-[#444444] mt-12 font-sans animate-slide-up delay-300">
            Descoperă arta echilibrului și a puterii <br />
            interioare la Balance Studios!
          </p>
          <p className="hidden md:block text-2xl text-[#444444] mt-12 font-sans animate-slide-up delay-300">
            Descoperă arta echilibrului și a puterii interioare <br />
            la Balance Studios!
          </p>
        </div>
      </section>

      {/* Romanian Introductory Section - Alternating Layout */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-24 bg-white">
        <div className="container mx-auto px-8 space-y-16 md:space-y-24">
          <div className="text-center"> {/* Container for button and line */}
            <p className="text-2xl md:text-3xl text-black font-inter font-semibold mb-6">{user ? 'Alege forma potrivită' : 'Începe de azi'}</p>
            {!user ? (
              <>

                <Link href="/login" passHref>
                  <Button size="sm" className="bg-black text-white hover:bg-black/90 font-sans mb-3">
                    Înscrie-te
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 justify-center items-center pt-4 md:pt-6">
                {/* Mat Pilates Card */}
                <FadeInOnScroll delay={0.2}>
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer w-[70vw] md:w-[400px] md:h-[260px] flex flex-col p-6 text-lg">
                    <h3 className="text-3xl font-title-specific text-[#E57F84] font-bold mb-4">Mat Pilates</h3>
                    <div className="flex-1 flex flex-col justify-between">
                      <p className="text-base font-medium text-foreground mb-4 md:mb-8">
                        O experiență clasică Pilates care te conectează cu esența mișcării. Perfect pentru toți, de la începători la avansați, oferind o bază solidă de tonifiere și conștientizare corporală.
                      </p>
                      <Link href="/select-mat" passHref>
                        <Button 
                          className="w-full bg-[#E57F84] text-white hover:bg-[#E57F84]/90 font-inter"
                        >
                          Selectează un Plan
                        </Button>
                      </Link>
                    </div>
                  </div>
                </FadeInOnScroll>
                {/* Reformer Pilates Card */}
                <FadeInOnScroll delay={0.3}>
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer w-[70vw] md:w-[400px] md:h-[260px] flex flex-col p-6 text-lg">
                    <h3 className="text-3xl font-title-specific text-[#E57F84] font-bold mb-4">Reformer Pilates</h3>
                    <div className="flex-1 flex flex-col justify-between">
                      <p className="text-base font-medium text-foreground mb-4 md:mb-8">
                        O tehnică Pilates avansată care utilizează echipament specializat. Oferă o experiență dinamică și personalizată, pentru a aprofunda mișcarea și a obține rezultate precise.
                      </p>
                      <Link href="/select-reformer" passHref>
                        <Button 
                          className="w-full bg-[#E57F84] text-white hover:bg-[#E57F84]/90 font-inter"
                        >
                          Selectează un Plan
                        </Button>
                      </Link>
                    </div>
                  </div>
                </FadeInOnScroll>
              </div>
            )}
            <div className="w-[85%] mx-auto border-t-2 border-[#EBCECE] mt-8 md:mt-16 mb-16"></div>
          </div>
          {/* Armonie Section: Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
            <FadeInOnScroll delay={0.2}>
              <div className="relative w-[80%] md:w-3/4 mx-auto h-80 md:h-96 rounded-[20px] overflow-hidden shadow-xl">
                <Image 
                  src="/images/1st_image_home.jpeg" 
                  alt="Instructor de Pilates demonstrând exerciții de armonie și echilibru la Balance Studio Ploiești" 
                  title="Exerciții de armonie și echilibru la Balance Studio Ploiești"
                  fill
                  sizes="(max-width: 768px) 80vw, 50vw"
                  className="rounded-[20px] object-cover"
                  quality={85}
                  loading="lazy"
                />
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.4}>
              <div className="w-3/4 mx-auto text-center md:text-left">
                <h2 className="hidden md:block text-4xl md:text-5xl font-inter font-bold text-black mb-4">Armonie</h2>
                <p className="hidden md:block font-inter font-medium text-[#888888] leading-relaxed text-2xl">
                  Transformăm exercițiile de Pilates într-o experiență revitalizantă. Cu un mediu prietenos și instructori calificați, îți oferim ocazia de a-ți tonifia corpul și echilibra mintea.
                </p>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.4}>
              <div className="w-3/4 mx-auto text-left">
                <h2 className="block md:hidden text-3xl md:text-4xl font-inter font-bold text-black mb-3">Armonie</h2>
                <p className="block md:hidden font-inter font-medium text-[#888888] leading-relaxed text-base">
                  Transformăm exercițiile de Pilates într-o experiență revitalizantă. Cu un mediu prietenos și instructori calificați, îți oferim ocazia de a-ți tonifia corpul și echilibra mintea.
                </p>
              </div>
            </FadeInOnScroll>
          </div>

          {/* Fluid Section: Text Left, Image Right */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
            <FadeInOnScroll delay={0.2}>
              <div className="w-3/4 mx-auto text-center md:text-left">
                <h2 className="hidden md:block text-4xl md:text-5xl font-inter font-bold text-black mb-4">Fluid</h2>
                <p className="hidden md:block font-inter font-medium text-[#888888] leading-relaxed text-2xl">
                  Indiferent dacă ești la început de drum sau un practician experimentat, fiecare curs este personalizat pentru a se potrivi nevoilor tale. Te invităm să explorezi mișcările fluide care îmbunătățesc flexibilitatea, postura și tonusul muscular, totodată îmbunătățind încrederea de sine.
                </p>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.4}>
              <div className="relative w-[80%] md:w-3/4 mx-auto h-80 md:h-96 rounded-[20px] overflow-hidden shadow-xl">
                <Image 
                  src="/images/2nd_image_home.jpeg" 
                  alt="Mișcări fluide și dinamice de Pilates pentru tonifiere musculară la Balance Studio Ploiești" 
                  title="Exerciții de Pilates pentru fluiditate în mișcare la Balance Studio Ploiești"
                  fill
                  sizes="(max-width: 768px) 80vw, 50vw"
                  className="rounded-[20px] object-cover object-[50%_30%]"
                  quality={85}
                  loading="lazy"
                />
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.2}>
              <div className="w-3/4 mx-auto text-left">
                <h2 className="block md:hidden text-3xl md:text-4xl font-inter font-bold text-black mb-3 mt-2">Fluid</h2>
                <p className="block md:hidden font-inter font-medium text-[#888888] leading-relaxed text-base">
                  Indiferent dacă ești la început de drum sau un practician experimentat, fiecare curs este personalizat pentru a se potrivi nevoilor tale. Te invităm să explorezi mișcările fluide care îmbunătățesc flexibilitatea, postura și tonusul muscular, totodată îmbunătățind încrederea de sine.
                </p>
              </div>
            </FadeInOnScroll>
          </div>

          {/* Mindset Section: Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
            <FadeInOnScroll delay={0.2}>
              <div className="relative w-[80%] md:w-3/4 mx-auto h-80 md:h-96 rounded-[20px] overflow-hidden shadow-xl">
                <Image 
                  src="/images/3rd_image_home.jpeg" 
                  alt="Antrenament pentru echilibrarea minții și corpului prin Pilates la Balance Studio Ploiești" 
                  title="Dezvoltarea unui mindset echilibrat prin Pilates la Balance Studio Ploiești"
                  fill
                  sizes="(max-width: 768px) 80vw, 50vw"
                  className="rounded-[20px] object-cover object-[50%_70%]"
                  quality={85}
                  loading="lazy"
                />
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.4}>
              <div className="w-3/4 mx-auto text-center md:text-left">
                <h2 className="hidden md:block text-4xl md:text-5xl font-inter font-bold text-black mb-4">Mindset</h2>
                <p className="hidden md:block font-inter font-medium text-[#888888] leading-relaxed text-2xl">
                  Aici, fiecare respirație contează, iar fiecare mișcare te aduce mai aproape de o stare de bine! Alătură-te comunității noastre și începe-ți călătoria către un tonus echilibrat și o minte&nbsp;mai&nbsp;clară.
                </p>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.4}>
              <div className="w-3/4 mx-auto text-left">
                <h2 className="block md:hidden text-3xl md:text-4xl font-inter font-bold text-black mb-3">Mindset</h2>
                <p className="block md:hidden font-inter font-medium text-[#888888] leading-relaxed text-base">
                  Aici, fiecare respirație contează, iar fiecare mișcare te aduce mai aproape de o stare de bine! Alătură-te comunității noastre și începe-ți călătoria către un tonus echilibrat și o minte&nbsp;mai&nbsp;clară.
                </p>
              </div>
            </FadeInOnScroll>
          </div>
          

        </div>
      </section>

      {/* Location Section with Google Maps */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-inter font-bold text-black mb-12 text-center">Unde ne găsiți</h2>
          <div className="w-[70%] mx-auto rounded-2xl overflow-hidden shadow-xl aspect-[4/3] md:aspect-[16/9]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2824.0176928485125!2d26.039576776074988!3d44.943308271070194!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b24b866556b451%3A0xcde82178370c7273!2sBalance%20Studio%20Pilates!5e0!3m2!1sro!2sro!4v1747158095415!5m2!1sro!2sro" 
              width="100%" 
              style={{ border: 0, height: '100%' }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#EBCECE] py-8 md:py-10">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h3 className="text-xl md:text-2xl font-inter font-semibold tracking-wide text-gray-800 mb-6">Contact și Informații</h3>
          
          {/* Contact Information */}
          <div className="mb-6 space-y-2">
            <a 
              href="mailto:fitnet.studio.ploiesti@gmail.com" 
              className="font-inter text-gray-700 hover:text-white transition-all duration-300 block text-base md:text-lg tracking-wide"
            >
              fitnet.studio.ploiesti@gmail.com
            </a>
            
            <p className="font-inter text-gray-700 text-base md:text-lg tracking-wide">
              Str. Pielari, nr. 57, Ploiești
            </p>
            
            <a 
              href="tel:0730012791" 
              className="font-inter text-gray-700 hover:text-white transition-all duration-300 block text-base md:text-lg tracking-wide"
            >
              Nr. tel 0730012791
            </a>
            
            <a 
              href="https://www.instagram.com/balance.studio.ploiesti" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-inter text-gray-700 hover:text-white transition-all duration-300 block text-base md:text-lg tracking-wide"
            >
              @balance.studio.ploiesti
            </a>
          </div>

          {/* Legal Links */}
          <div className="mb-6 space-y-2">
            <Link 
              href="/terms" 
              className="font-inter text-gray-700 hover:text-white transition-all duration-300 block text-base md:text-lg tracking-wide"
            >
              Termeni și Condiții
            </Link>
            
            <Link 
              href="/privacy" 
              className="font-inter text-gray-700 hover:text-white transition-all duration-300 block text-base md:text-lg tracking-wide"
            >
              Politica de Confidențialitate
            </Link>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t border-[#e5b4b4]">
            <p className="font-inter text-gray-700 text-sm md:text-base tracking-wider mb-0.5">
              2025 BALANCE STUDIO | WEBSITE
            </p>
            <p className="font-inter text-gray-700 text-sm md:text-base tracking-wider">
              by @traian71
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}
