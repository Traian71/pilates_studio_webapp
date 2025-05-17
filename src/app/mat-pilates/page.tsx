'use client';

import Image from 'next/image';
import Link from 'next/link'; // Added Link import
import { Button } from '@/components/ui/button'; // Added Button import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ChevronDown } from 'lucide-react'; // Using an icon for list items
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"; // Added Carousel imports
import { useAuth } from '@/contexts/AuthContext';

export default function MatPilatesPage() {
  const { user } = useAuth();
  const benefits = [
    {
      title: "Tonifiere musculară",
      description: "Întărește întregul corp, în special zona centrală.",
    },
    {
      title: "Postură corectă",
      description: "Exercițiile ajută la îmbunătățirea aliniamentului corpului și la reducerea durerilor de spate.",
    },
    {
      title: "Flexibilitate",
      description: "Îmbunătățește mobilitatea și elasticitatea musculaturii.",
    },
    {
      title: "Reducerea stresului",
      description: "Mișcările fluide și respirația controlată contribuie la relaxare și echilibru mental.",
    },
    {
      title: "Accesibilitate",
      description: "Potrivit pentru toate nivelurile de experiență, cu ajustări personalizate.",
    },

  ];

  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section with Background Image */}
      <div className="relative h-[70vh] min-h-[600px] w-full">
        <Image
          src="/images/AdobeStock_1312635319.jpeg"
          alt="Femeie executând exerciții de Pilates pe saltea la Balance Studio Ploiești - tehnică corectă pentru începători"
          title="Pilates de bază pe saltea pentru începători la Balance Studio Ploiești"
          fill
          sizes="100vw"
          priority
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQIGAwAAAAAAAAAAAAABAgMABAUGESExQVFhcf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmzHMVs7y9gtrZEeOEKpkfU5JGpwOgNt6VRQCf//Z"
          className="brightness-75 animate-fade-in object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-8 -mt-16 bg-black bg-opacity-30">
          <h1 className="text-3xl md:text-6xl font-bold mb-4 font-josefin animate-slide-up delay-200">
            Mat Pilates
          </h1>
          <p className="text-base md:text-xl max-w-3xl font-inter animate-slide-up delay-400">
            Pentru cei care doresc să înceapă sau să își mențină o practică echilibrată, Pilates de bază este o opțiune excelentă pentru dezvoltarea tonusului muscular și îmbunătățirea flexibilității. Acest tip de antrenament pe saltea se concentrează pe exerciții fundamentale, accesibile oricui, indiferent de nivelul de experiență. Instructorii noștri te vor ghida pas cu pas, ajutându-te să înveți tehnici esențiale pentru a îmbunătăți postura și a reduce tensiunile din corp.
          </p>
          {user ? (
            <Button className="mt-6 bg-vibrant-coral hover:bg-vibrant-coral/90 text-white font-bold py-3 px-6 rounded-lg animate-slide-up delay-600">
              <Link href="/select-mat">Alege Abonamentul</Link>
            </Button>
          ) : (
            <Button className="mt-6 bg-vibrant-coral hover:bg-vibrant-coral/90 text-white font-bold py-3 px-6 rounded-lg animate-slide-up delay-600">
              <Link href="/login?redirect=/select-mat">Conectează-te pentru a alege un abonament</Link>
            </Button>
          )}
        </div>
        {/* Scroll Down Arrow */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-8 h-8 text-white animate-bounce" />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-8 pt-20 pb-24"> {/* Increased bottom padding */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-20 text-[#242424] font-josefin"> {/* Changed color & margin */}
          Beneficiile Mat Pilates
        </h2>
        {/* Benefits Section Grid (Desktop) */}
        <div className="relative">
          <div className="flex overflow-x-auto space-x-6 pb-8 no-scrollbar scroll-smooth" style={{scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch'}}>
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-gray-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-[350px] min-w-[350px] mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-[#242424] font-inter"> {/* Changed title color */}
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

