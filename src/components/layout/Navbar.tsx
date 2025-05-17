'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import AnimatedHamburgerIcon from '@/components/ui/AnimatedHamburgerIcon';
import { motion, AnimatePresence } from 'framer-motion'; // Added Framer Motion imports
import { useAuth } from '@/contexts/AuthContext'; // Standardized import path
import { supabase } from '@/lib/supabaseClient'; // Added for role checking
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react'; // Import ChevronDown
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user, signOut, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [profileLink, setProfileLink] = useState('/profile');

  // Determine background style based on path
  const navBackgroundClass = "bg-navbar-bg animate-slide-down"; // Set background to navbar-bg for all pages with slide-down animation

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };


  useEffect(() => {
    if (user) {
      const checkUserRole = async () => {
        // Check if user is an instructor
        const { data: instructor, error: instructorError } = await supabase
          .from('instructors')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (instructorError) {
          console.error('Error checking instructor role:', instructorError);
        }

        if (instructor) {
          setProfileLink('/instructor_profile');
        } else {
          // Check if user is an admin by querying the 'admins' table
          const { data: admin, error: adminError } = await supabase
            .from('admins') // Query the 'admins' table
            .select('id')     // Select any column to check for existence, 'id' is common
            .eq('id', user.id) // Assuming admin table's PK is also user.id
            .maybeSingle();

          if (adminError) {
            console.error('Error checking admin role:', adminError);
          }

          if (admin) {
            setProfileLink('/admin_profile');
          } else {
            setProfileLink('/profile'); // Default to client profile
          }
        }
      };
      checkUserRole();
    } else {
      setProfileLink('/profile'); // Default for logged-out users or if user object is null
    }
  }, [user]);

  return (
    <nav 
      className={cn(
          "sticky top-0 z-50 w-full border-b border-gray-200/70 shadow-sm", 
          "bg-navbar-bg animate-slide-down" // Added animation class
      )}
    >
      <div className="container mx-auto px-6 py-1 md:flex md:justify-between md:items-center">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-xl font-bold text-soft-peach hover:opacity-80" onClick={handleLinkClick}>
            <Image 
              src="/images/logo.png" 
              alt="Balance Studio Logo" 
              width={50}
              height={50}
              priority
              quality={100}
              className="w-auto h-auto"
            />
            <span className="ml-3 text-[23px] font-normal text-black">Balance Studio</span>
          </Link>

          {/* Icons/Buttons on the right for mobile */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Mobile menu button (Burger) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="toggle menu"
              className="text-[#444444] flex items-center justify-center" // Add flex centering
            >
              <AnimatedHamburgerIcon isOpen={isOpen} />
            </Button>
          </div>
        </div>

        {/* Mobile Menu: Animated with Framer Motion */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -50 }} // Start off-screen and invisible
              animate={{ opacity: 1, y: 0 }}    // Animate to visible and in position
              exit={{ opacity: 0, y: -50 }}      // Animate out to off-screen and invisible
              transition={{ type: "spring", stiffness: 600, damping: 40, mass: 1 }}
              className={cn(
                "absolute inset-x-0 z-20 w-full px-6 pt-8 pb-24 bg-navbar-bg md:hidden" // Changed pb-12 to pb-24
              )}
            >
              {/* Main Nav Links */}
              <div className="flex flex-col items-start w-full px-4"> 
                {/* User Section */}
                <span className="font-semibold text-black/40 pt-2 pb-0 text-[10px] uppercase tracking-wider px-2">User</span>
                {isLoading ? (
                  <div className="h-auto py-3 px-2 w-full justify-start">
                    <div className="h-8 w-16 animate-pulse bg-gray-700 rounded"></div>
                  </div>
                ) : user ? (
                  <>
                    <Link href={profileLink} passHref onClick={handleLinkClick} className="w-full">
                      <Button variant="ghost" className="h-auto py-3 px-2 w-full justify-start">
                        <span className="text-[#444444] text-[15px]">Profile</span>
                      </Button>
                    </Link>
                    <div className="h-0.5 bg-white w-full my-0"></div> {/* Separator */}
                    <Button 
                      variant="ghost" 
                      className="font-medium text-vibrant-coral text-[15px] h-auto py-3 px-2 w-full justify-start hover:text-white hover:bg-vibrant-coral"
                      onClick={() => { signOut(); handleLinkClick(); }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" passHref onClick={handleLinkClick} className="w-full">
                      <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                        Login
                      </Button>
                    </Link>
                    <div className="h-0.5 bg-white w-full my-0"></div> {/* Separator */}
                    <Link href="/signup" passHref onClick={handleLinkClick} className="w-full">
                      <Button 
                        variant="ghost"
                        className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start hover:text-vibrant-coral"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
                
                {/* Pilates Section */}
                <span className="font-semibold text-black/40 pt-6 pb-0 text-[10px] uppercase tracking-wider px-2">Pilates</span>
                <Link href="/mat-pilates" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Saltea
                  </Button>
                </Link>
                <div className="h-[1px] bg-white w-full my-0"></div> {/* Separator */}
                <Link href="/reformer-pilates" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Reformer
                  </Button>
                </Link>
                <div className="h-[1px] bg-white w-full my-0"></div> {/* Separator */}
                <Link href="/booking" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Booking
                  </Button>
                </Link>
                <div className="h-[1px] bg-white w-full my-0"></div> {/* Separator */}
                <Link href="/prices" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Prețuri
                  </Button>
                </Link>

                {/* Comunitate Section */}
                <span className="font-semibold text-black/40 pt-6 pb-0 text-[10px] uppercase tracking-wider px-2">Comunitate</span>
                <Link href="/aboutus" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Cine suntem?
                  </Button>
                </Link>
                <div className="h-[1px] bg-white w-full my-0"></div> {/* Separator */}
                <Link href="/terms" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Termeni și Condiții
                  </Button>
                </Link>


                {/* Staff Section */}
                <span className="font-semibold text-black/40 pt-6 pb-0 text-[10px] uppercase tracking-wider px-2">Staff</span>
                <Link href="/instructor_auth" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Instructor
                  </Button>
                </Link>
                <div className="h-[1px] bg-white w-full my-0"></div> {/* Separator */}
                <Link href="/admin_auth" passHref onClick={handleLinkClick} className="w-full">
                  <Button variant="ghost" className="font-medium text-[#444444] text-[15px] h-auto py-3 px-2 w-full justify-start">
                    Admin
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Menu - no animation needed here, separate div */}
        <div
          className={cn(
            "hidden md:flex md:items-center md:gap-x-6" // Kept desktop specific classes
          )}
        >
          {/* Main Nav Links */}
          <div className="flex flex-col md:flex-row items-center md:gap-x-4"> {/* Removed md:mx-3, Added md:gap-x-4 */}
            {/* ... (Services, Booking, Who are we, Staff Dropdowns/Links remain here) ... */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium text-nav-text md:px-2">
                  <span className="flex items-center gap-1">
                    Pilates
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/mat-pilates" onClick={handleLinkClick}>Saltea</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/reformer-pilates" onClick={handleLinkClick}>Reformer</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/booking" passHref onClick={handleLinkClick}>
              <Button variant="ghost" className="font-medium text-nav-text my-1 md:my-0 md:px-2">
                Booking
              </Button>
            </Link>
            <Link href="/prices" passHref onClick={handleLinkClick}>
              <Button variant="ghost" className="font-medium text-nav-text my-1 md:my-0 md:px-2">
                Prețuri
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium text-nav-text md:px-2">
                  <span className="flex items-center gap-1">
                    Comunitate
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/aboutus" onClick={handleLinkClick}>Cine suntem?</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/terms" onClick={handleLinkClick}>Termeni și Condiții</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium text-nav-text md:px-2">
                   <span className="flex items-center gap-1">
                     Staff
                   </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/instructor_auth" onClick={handleLinkClick}>Instructor</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin_auth" onClick={handleLinkClick}>Admin</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Separator & User Section (Desktop) */}
          <div className="hidden md:flex items-center md:gap-x-3"> {/* Changed space-x-2 to md:gap-x-3 */}
            {/* Vertical Separator Bar */} 
            <div className="h-8 w-[1.5px] bg-white hidden md:block md:mr-4"></div> {/* Changed md:mr-2 to md:mr-4 */} {/* Changed md:mr-1 to md:mr-2 */} {/* Added md:mr-1 */} {/* Removed ml-2 mr-3 */} {/* Adjusted height and width */} {/* Adjusted height and width */} {/* Adjusted height and width */}

            {/* Loading Skeleton */}
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse bg-gray-700 rounded md:mx-2"></div> 
            ) : user ? (
              <>
                <span className="text-nav-text mr-3">
                  Hi, {user.user_metadata?.first_name || user.email?.split('@')[0]}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <FaUserCircle size={24} className="text-nav-text hover:text-gray-600" /> {/* Changed color */}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white text-nav-text border"> {/* Changed background, text, border */}
                    <DropdownMenuItem className="cursor-pointer"> {/* Removed hover/focus */}
                      <Link href={profileLink} onClick={handleLinkClick}>Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { signOut(); handleLinkClick(); }} className="text-vibrant-coral cursor-pointer"> {/* Removed hover/focus */}
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login" passHref onClick={handleLinkClick}>
                  <Button variant="ghost" className="font-medium text-[#444444] hover:text-[#666666] md:mx-2">Login</Button>
                </Link>
                <Link href="/signup" passHref onClick={handleLinkClick}>
                  <Button 
                    variant="default"
                    className="font-medium text-[#444444] hover:bg-vibrant-coral hover:text-white md:mx-2"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

