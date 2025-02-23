import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SearchForm } from './businesses/SearchForm';
import { BusinessTable } from './businesses/BusinessTable';
import { BusinessInfo } from '@/types/dealership';
import { callBusiness, findBusinesses } from '@/utils/api';

export const BusinessList = () => {
  const { toast } = useToast();
  const [itemType, setItemType] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [detail, setDetail] = useState('');

  // Fetch sellers from Supabase when the component mounts
  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from('businesses')
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
        // Check if any quotes have changed
        const quotesChanged = data.some((newBusiness, index) => {
          const existingBusiness = businesses[index];
          return existingBusiness && existingBusiness.quote !== newBusiness.quote;
        });

        if (quotesChanged) {
          setBusinesses(data);
          setIsLoading(false);
        } else {
          setBusinesses(data);
        }
      }
    };

    // Initial fetch
    fetchSellers();

    // Only poll when isLoading is true
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      // Set up polling interval
      interval = setInterval(() => {
        fetchSellers();
      }, 5000);
    }

    // Clean up interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, businesses]); // Dependencies include isLoading and businesses

  const handleDeleteBusiness = (index: number) => {
    const business = businesses[index];

    const deleteBusiness = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .delete()
        .eq('url', business.url);

      if (error) {
        console.error('Error deleting business:', error);
        toast({
          title: "Error",
          description: "Failed to delete business.",
          variant: "destructive"
        });
      } else {
        console.log('Deleted business:', data);
      }
      setBusinesses(businesses.filter(b => b.url !== business.url));
      setIsLoading(false);
    };

    deleteBusiness();
  };

  const handleSubmit = async (data: any) => {
    const result = await findBusinesses({
      itemType: data.itemType,
      location: data.location
    });
    setBusinesses(result);
  };

  const handleCall = (business: BusinessInfo) => {
    setIsLoading(true);
    callBusiness({
      business_number: business.phone_number,
      business_url: business.url,
      business_name: business.name,
      service_description: itemType.length > 0 ? itemType : "Carpet cleaning",
      user_location: location.length > 0 ? location : "94105",
      detail: detail.length > 0 ? detail : "No additional details"
    });
  };

  const handleCallAllBusinesses = () => {
    const validBusinesses = businesses.filter(business => business.phone_number);
    if (validBusinesses.length === 0) {
      toast({
        title: "No businesses to call",
        description: "There are no businesses with phone numbers available.",
        variant: "destructive"
      });
      return;
    }
    console.log("Calling all businesses:", validBusinesses.map(b => b.phone_number));
    toast({
      title: "Initiating Calls",
      description: `Starting calls to ${validBusinesses.length} businesses`,
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

          <SearchForm itemType={itemType} location={location} onItemTypeChange={setItemType} onLocationChange={setLocation} onSubmit={handleSubmit} isLoading={isLoading} detail={detail} onDetailChange={setDetail} />

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
                      <p className="text-slate-600 mt-1">Website: {business.url}</p>
                      <p className="text-slate-600 mt-1">Phone: {`(${business.phone_number.toString().slice(0,3)}) ${business.phone_number.toString().slice(3,6)}-${business.phone_number.toString().slice(6)}`}</p>
                    </div>
                    <Button onClick={() => handleCall(business)} variant="outline" size="sm" className="flex items-center gap-2">
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
                <Button onClick={handleCallAllBusinesses} className="flex items-center gap-2 bg-green-600 hover:bg-green-500">
                  Call All Sellers
                </Button>
              </div>
            </div>

            <BusinessTable businesses={businesses} onDeleteBusiness={handleDeleteBusiness} onCallBusiness={handleCall} onCallAllBusinesses={handleCallAllBusinesses} />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};