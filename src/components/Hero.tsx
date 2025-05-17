import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <div className="relative h-[600px]">
      {/* Desktop Header (hidden on mobile) */}
      <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="text-6xl font-bold mb-4">Balance between mind and body</h1>
        <p className="text-xl text-gray-600">Discover the perfect harmony of Pilates practice</p>
      </div>

      {/* Mobile Header (hidden on desktop) */}
      <div className="md:hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="text-4xl font-bold mb-2">Balance</h1>
        <h2 className="text-4xl mb-2">between</h2>
        <h3 className="text-3xl">mind and body</h3>
      </div>

      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/1st_image_home.jpeg"
          alt="Pilates studio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
      </div>
    </div>
  );
}
