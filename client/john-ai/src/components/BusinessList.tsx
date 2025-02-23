import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SearchForm } from './businesses/SearchForm';
import { SellerTable } from './businesses/SellerTable';
import { BusinessInfo, SellerInfo } from '@/types/dealership';

export const BusinessList = () => {
  const { toast } = useToast();
  const [itemType, setItemType] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [sellers, setSellers] = useState<SellerInfo[]>([]);

  // Fetch sellers from Supabase when the component mounts
  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('businesses') // Replace with your actual table name
        .select('*');

      if (error) {
        console.error('Error fetching sellers:', error);
        toast({
          title: "Error",
          description: "Failed to load sellers.",
          variant: "destructive"
        });
      } else {
        console.log('Fetched sellers:', data);
        setBusinesses(data);
      }
      setIsLoading(false);
    };

    fetchSellers();
  }, []); // Empty dependency array means this runs once when the component mounts

  const handleDeleteSeller = (index: number) => {
    const updatedSellers = [...sellers];
    updatedSellers.splice(index, 1);
    setSellers(updatedSellers);
    toast({
      title: "Seller Deleted",
      description: "The seller has been removed from the list",
      duration: 3000
    });
  };

  const handleSubmit = (data: any) => {
    console.log(data);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleCallAllSellers = () => {
    const validSellers = sellers.filter(seller => seller.phone);
    if (validSellers.length === 0) {
      toast({
        title: "No sellers to call",
        description: "There are no sellers with phone numbers available.",
        variant: "destructive"
      });
      return;
    }
    console.log("Calling all sellers:", validSellers.map(s => s.phone));
    toast({
      title: "Initiating Calls",
      description: `Starting calls to ${validSellers.length} sellers`,
      duration: 3000
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full">
      <Card className="p-6 backdrop-blur-sm bg-white/80 w-full">
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-medium text-slate-950">Find Sellers</h2>
            <p className="text-slate-600">Enter your search details below</p>
          </div>

          <SearchForm itemType={itemType} location={location} onItemTypeChange={setItemType} onLocationChange={setLocation} onSubmit={handleSubmit} isLoading={isLoading} />

          {businesses.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-medium text-slate-950">Found Businesses</h3>
                <p className="text-slate-600">Available sellers in your area</p>
              </div>
              {businesses.map((business, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="p-4 rounded-lg bg-white shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-medium text-slate-950">{business.name}</h4>
                      <p className="text-slate-600 mt-1">{business.address}</p>
                      <p className="text-slate-600 mt-1">{business.phone}</p>
                    </div>
                    <Button onClick={() => handleCall(business.phone)} variant="outline" size="sm" className="flex items-center gap-2">
                      Call
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h3 className="text-2xl font-medium text-slate-950">Seller Rankings</h3>
                <p className="text-slate-600">Compare and contact sellers</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCallAllSellers} className="flex items-center gap-2 bg-green-600 hover:bg-green-500">
                  Call All Sellers
                </Button>
              </div>
            </div>

            <SellerTable sellers={businesses} onDeleteSeller={handleDeleteSeller} onCallSeller={handleCall} onCallAllSellers={handleCallAllSellers} />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};