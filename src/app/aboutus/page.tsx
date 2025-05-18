'use client';

// src/app/aboutus/page.tsx
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const AboutUsPage = () => {
  const profileVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1, 
      y: 0,
      transition: {
        delay: index * 0.2,
        duration: 0.5
      }
    })
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div className="container mx-auto px-12 md:px-4 py-[4.5rem] pb-8 max-w-4xl">
      <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-4xl md:text-5xl font-bold text-[#E57F84] mb-16 md:mb-0 text-center font-josefin"
        >
          Povestea Balance Studio
        </motion.h1>
      
      <section className="mb-12 pb-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="text-2xl md:text-3xl font-semibold text-gray-800 font-inter mb-6"
            >
              Originile Noastre
            </motion.h2>
            <motion.p 
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="text-sm md:text-base mb-4"
            >
              Balance Studio a luat naștere din pasiunea noastră profundă pentru mișcare, echilibru și transformare personală. Am descoperit Pilates nu doar ca o metodă de antrenament, ci ca o filosofie de viață care ne conectează trupul, mintea și spiritul.
            </motion.p>
            <motion.p 
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.8 }}
              className="text-gray-700"
            >
              Fiecare instructor al nostru a trecut printr-o călătorie personală de vindecare și descoperire prin Pilates, transformând durerea și provocările fizice în putere și rezistență.
            </motion.p>
          </div>
          <div className="hidden md:block flex flex-col items-center gap-6 py-24">
            <div className="flex justify-center items-center w-full space-x-12">
              {[{ src: "/images/blank-profile-picture-973460_960_720.webp", name: "Florin-Ioan", role: "CEO & Proprietar" },
              { src: "/images/WhatsApp Image 2025-05-16 at 00.02.48_a51233fb.jpg", name: "Corina", role: "Fondator & Administrator Spațiu" }].map((profile, index) => {
              // Ensure a default image if the specific image doesn't exist
              const imageSrc = profile.src || "/images/profiles/default-profile.png";
              
              return (
                <motion.div 
                  key={index} 
                  className="text-center"
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  variants={profileVariants}
                >
                <div className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden border-4 border-[#E57F84]/30 shadow-md">
                  <Image 
                    src={imageSrc}
                    alt={`Profil ${profile.name}`}
                    width={128}
                    height={128}
                    quality={90}
                    loading="lazy"
                    className={`object-cover w-full h-full ${profile.name === 'Corina' ? 'object-top' : ''}`}
                  />
                </div>
                <p className="text-gray-800 font-inter font-semibold">{profile.name}</p>
                <p className="text-gray-600 text-sm">{profile.role}</p>
              </motion.div>
              );
            })}
            </div>
            <div className="flex justify-center items-center w-full space-x-12">
              <div className="mr-auto w-1/4"></div>
              {[{ src: "/images/KUCD8700.JPG", name: "Traian", role: "CTO & Dezvoltator Tehnologic" },
              { src: "/images/blank-profile-picture-973460_960_720.webp", name: "Theodor", role: "Instructor Principal Pilates" }].map((profile, index) => {
              // Ensure a default image if the specific image doesn't exist
              const imageSrc = profile.src || "/images/profiles/default-profile.png";
              
              return (
                <motion.div 
                  key={index} 
                  className="text-center"
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  variants={profileVariants}
                >
                <div className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden border-4 border-[#E57F84]/30 shadow-md">
                  <Image 
                    src={imageSrc}
                    alt={`Profil ${profile.name}`}
                    width={128}
                    height={128}
                    quality={90}
                    loading="lazy"
                    className={`object-cover w-full h-full ${profile.name === 'Corina' ? 'object-top' : ''}`}
                  />
                </div>
                <p className="text-gray-800 font-inter font-semibold">{profile.name}</p>
                <p className="text-gray-600 text-sm">{profile.role}</p>
              </motion.div>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-20 bg-[#E57F84]/5 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 font-inter mb-6 text-center">Joseph Pilates: Povestea din spatele Metodei</h2>
        <div className="text-gray-700 space-y-4">
          <p>
            Joseph Pilates, creatorul metodei care ne inspiră zilnic, a dezvoltat Pilates din experiențele sale personale profunde. Suferind de boli în copilărie, el a transformat slăbiciunea sa fizică într-o metodă revoluționară de antrenament care îmbină forța, flexibilitatea și controlul mental.
          </p>
          <p>
            Filosofia sa era simplă dar profundă: un corp sănătos și o minte echilibrată sunt fundamentul fericirii umane. La Balance Studio, onorăm această viziune în fiecare ședință pe care o conducem.
          </p>
        </div>
      </section>

      <section className="mb-8 md:mb-20 pb-12 pt-20">
        <h2 className="text-5xl font-bold text-[#E57F84] mb-20 text-center font-josefin">Valorile Noastre</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-8 text-center">
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#E57F84] font-inter">Transformare</h3>
            <p className="text-gray-700 mb-2">Credem în puterea transformării continue, fizice și mentale.</p>
            <p className="text-sm text-gray-600 mb-3">Schimbă-te din interior spre exterior</p>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#E57F84] font-inter">Comunitate</h3>
            <p className="text-gray-700 mb-2">Suntem mai mult decât un studio - suntem o familie care crește împreună.</p>
            <p className="text-sm text-gray-600 mb-3">Susținem și ne inspirăm reciproc</p>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#E57F84] font-inter">Autenticitate</h3>
            <p className="text-gray-700 mb-2">Fiecare corp este unic. Fiecare călătorie este personală.</p>
            <p className="text-sm text-gray-600 mb-3">Respectă-ți propriul ritm</p>
          </div>
        </div>
      </section>

      <section className="mb-8 md:mb-20 bg-[#E57F84]/5 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 font-inter mb-6 text-center">Alătură-te Călătoriei Noastre</h2>
        <div className="text-gray-700 space-y-4 mb-8">
          <p>
            Indiferent dacă ești la primul tău Pilates sau ești un practician experimentat, la Balance Studio vei găsi mai mult decât un antrenament - vei descoperi o comunitate care te susține și te inspiră.
          </p>
        </div>
        <div className="flex justify-center space-x-6">
          <a 
            href="/mat-pilates" 
            className="bg-[#E57F84] text-white px-2.5 md:px-4 py-1.5 rounded-full text-[0.75rem] md:text-base font-semibold hover:bg-[#E57F84]/90 transition-colors"
          >
            Saltea
          </a>
          <a 
            href="/reformer-pilates" 
            className="bg-[#E57F84] text-white px-2.5 md:px-4 py-1.5 rounded-full text-[0.75rem] md:text-base font-semibold hover:bg-[#E57F84]/90 transition-colors"
          >
            Reformer
          </a>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;

