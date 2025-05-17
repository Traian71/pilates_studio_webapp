'use client';

import Image from 'next/image';
import Link from 'next/link'; 
import { Button } from '@/components/ui/button'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ChevronDown } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext';
import { useRef } from 'react';
import { CarouselArrows } from '@/components/ui/CarouselArrows';

export default function ReformerPilatesPage() { 
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -350,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 350,
        behavior: 'smooth'
      });
    }
  };
  // Updated benefits for Reformer Pilates
  const benefits = [
    {
      title: "Rezistență controlată",
      description: "Reformer-ul adaugă o rezistență suplimentară care intensifică antrenamentele și ajută la întărirea musculaturii.",
    },
    {
      title: "Postură perfectă",
      description: "Exercițiile sunt concepute pentru a corecta alinierea corpului, reducând riscurile de disconfort sau dureri musculare.",
    },
    {
      title: "Flexibilitate avansată",
      description: "Lucrează pe grupuri musculare mai adânci, îmbunătățind mobilitatea și elasticitatea.",
    },
    {
      title: "Tonifiere profundă",
      description: "Reformer-ul îți permite să te concentrezi pe detalii, dezvoltând un tonus muscular mai puternic și mai echilibrat.",
    },
    {
      title: "Recuperare eficientă",
      description: "Ideal pentru cei care doresc o recuperare activă, cu un impact redus asupra articulațiilor, perfect pentru o practică constantă.",
    },
  ];

  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section with Background Image */}
      {/* TODO: Replace with Reformer-specific image */}
      <div className="relative h-[70vh] min-h-[600px] w-full animate-fade-in">
        <Image
          src="/images/AdobeStock_593071379.jpeg" 
          alt="Antrenament specializat pe aparatul Reformer la Balance Studio Ploiești - exerciții pentru forță și flexibilitate" 
          title="Pilates Reformer pentru tonifiere și flexibilitate la Balance Studio Ploiești"
          fill
          sizes="100vw"
          priority
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQIGAwAAAAAAAAAAAAABAgMABAUGESExQVFhcf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmzHMVs7y9gtrZEeOEKpkfU5JGpwOgNt6VRQCf//Z"
          className="brightness-50 object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-8 -mt-16 bg-black bg-opacity-30">
          <h1 className="text-2xl md:text-6xl font-bold mb-4 font-josefin animate-slide-up delay-200">
            Reformer Pilates 
          </h1>
          <p className="text-sm md:text-xl max-w-3xl font-inter animate-slide-up delay-400">
            Antrenamentul pe reformer este perfect pentru cei care doresc să intensifice practica lor Pilates, oferind o rezistență suplimentară care ajută la întărirea musculaturii și îmbunătățirea flexibilității. Acest tip de antrenament este ideal pentru recuperare și pentru a dezvolta un tonus muscular mai puternic.
          </p>
          <p className="text-sm md:text-xl max-w-3xl font-inter animate-slide-up delay-600">
          Experiența Reformer îți propune un antrenament mai avansat și personalizat, cu un aparat special conceput pentru activare musculară profundă. Cu ghidarea instructorilor, vei lucra controlat, eficient și adaptat nivelului tău — pentru un corp mai echilibrat și rezultate clare.
          </p>
          {user ? (
            <Button className="mt-6 bg-vibrant-coral hover:bg-vibrant-coral/90 text-white font-bold py-3 px-6 rounded-lg animate-slide-up delay-800">
              <Link href="/select-reformer">Alege Abonamentul</Link>
            </Button>
          ) : (
            <Button className="mt-6 bg-vibrant-coral hover:bg-vibrant-coral/90 text-white font-bold py-3 px-6 rounded-lg animate-slide-up delay-800">
              <Link href="/login?redirect=/select-reformer">Conectează-te pentru a alege un abonament</Link>
            </Button>
          )}
        </div>
        {/* Scroll Down Arrow */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-8 h-8 text-white animate-bounce" />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 pt-20 pb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-20 text-[#242424] font-josefin">
          Beneficiile Reformer Pilates 
        </h2>
        <div className="relative">
          <CarouselArrows onPrev={scrollLeft} onNext={scrollRight} className="z-10" />
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-6 pb-8 no-scrollbar scroll-smooth relative" 
            style={{scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch'}}
          >
          {benefits.map((benefit, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gray-50 border border-gray-200 flex-shrink-0 w-[350px] min-w-[350px] mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-[#242424] font-inter">
                  <CheckCircle className="w-6 h-6 mr-3 text-vibrant-coral" />
                  {benefit.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 font-inter">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Fade out effect for edges */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
      </div>

    </div>
  );
}
