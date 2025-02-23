
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessList } from '@/components/BusinessList';
import { TwitterIcon, InstagramIcon, GlobeIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

const Index = () => {
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const services = ["Car Purchase", "Home Services", "Wholesale Goods"];

  useEffect(() => {
    const serviceInterval = setInterval(() => {
      setCurrentServiceIndex(prevIndex => (prevIndex + 1) % services.length);
    }, 2500);

    return () => {
      clearInterval(serviceInterval);
    };
  }, []);

  return <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans w-full" style={{
    backgroundImage: "url('/lovable-uploads/John bg.jpeg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  }}>
      {/* Add a semi-transparent overlay to ensure content visibility */}
      <div className="absolute inset-0 bg-white/80 -z-10"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          {/* Left Column with Profile */}
          <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5
        }} className="w-full lg:w-[300px] flex flex-col items-center lg:items-start">
            <div className="relative w-40 h-40 mb-6">
              {/* Background circles */}
              <div className="absolute -left-6 -top-6 w-48 h-48 border-[1.5px] border-gray-200 rounded-full"></div>
              <div className="absolute -left-3 -top-3 w-44 h-44 border-[1.5px] border-gray-200 rounded-full"></div>
              {/* Profile image */}
              <div className="absolute inset-0 bg-gray-900 rounded-full overflow-hidden">
                <img alt="Profile" src="/lovable-uploads/4f9386dd-a4c9-44e3-8ef8-be3df48e84ab.png" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">John</h2>
            <p className="text-gray-600 mb-4">Price negotiation assistant</p>
            
            <div className="flex gap-4 text-gray-600">
              <TwitterIcon className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
              <InstagramIcon className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
              <GlobeIcon className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eef9ee] text-[#2cb42c]">
              <span className="w-2 h-2 rounded-full bg-[#2cb42c]"></span>
              <span className="text-sm">Available Now</span>
            </div>
          </motion.div>

          {/* Right Column with Main Content */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }} className="flex-1 w-full">
            <div className="flex items-center flex-wrap gap-3 mb-6">
              <h1 className="text-4xl sm:text-5xl leading-tight text-slate-950 font-medium flex flex-wrap gap-2 whitespace-nowrap">
                <span>Hi! I am John, your</span>
                <motion.span initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} className="px-4 py-2 bg-green-700 rounded-full text-slate-50 text-2xl font-light">
                  Price Negotiator
                </motion.span>
                <span>for</span>
                <AnimatePresence mode="wait">
                  <motion.span key={services[currentServiceIndex]} initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  y: -20
                }} transition={{
                  duration: 0.3
                }} className="px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-2xl text-green-600">
                    {services[currentServiceIndex]}
                  </motion.span>
                </AnimatePresence>
              </h1>
            </div>
            
            <p className="text-4xl leading-tight text-slate-950 sm:text-3xl font-light text-left">Negotiate like a pro, your voice for every deal</p>

            <div className="w-full mt-12">
              <BusinessList />
            </div>
          </motion.div>
        </div>
      </div>
    </div>;
};

export default Index;
