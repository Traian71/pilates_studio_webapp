import Script from 'next/script';

export default function StructuredData() {
  const businessData = {
    "@context": "https://schema.org",
    "@type": "FitnessCenter",
    "name": "Balance Studio Ploiești",
    "description": "Studio de Pilates specializat în Mat Pilates și Reformer Pilates, oferind clase pentru toate nivelurile de experiență.",
    "image": "https://www.balancestudio.ro/images/middle_img_home_edited.JPG",
    "url": "https://www.balancestudio.ro",
    "telephone": "+40700000000", // Replace with actual phone number
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Strada Exemplu 123", // Replace with actual address
      "addressLocality": "Ploiești",
      "postalCode": "100000", // Replace with actual postal code
      "addressCountry": "RO"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 44.9461, // Replace with actual coordinates
      "longitude": 26.0367 // Replace with actual coordinates
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "20:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "priceRange": "$$",
    "offers": {
      "@type": "Offer",
      "description": "Abonamente și ședințe individuale de Pilates",
      "price": "50-300",
      "priceCurrency": "RON"
    }
  };

  return (
    <Script id="structured-data" type="application/ld+json">
      {JSON.stringify(businessData)}
    </Script>
  );
}
