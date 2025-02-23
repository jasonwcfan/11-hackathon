
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface Price {
  dealership: string;
  price: number;
  negotiated: boolean;
}

interface PriceComparisonProps {
  prices: Price[];
}

export const PriceComparison = ({ prices }: PriceComparisonProps) => {
  const lowestPrice = Math.min(...prices.map(p => p.price));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <Card className="p-6 backdrop-blur-sm bg-white/80">
        <h2 className="text-xl font-semibold mb-4">Price Comparison</h2>
        <div className="space-y-4">
          {prices.map((price, index) => (
            <motion.div
              key={price.dealership}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg ${
                price.price === lowestPrice ? 'bg-success/10' : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{price.dealership}</h3>
                  <p className="text-sm text-gray-500">
                    {price.negotiated ? 'Negotiated Price' : 'Listed Price'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    ${price.price.toLocaleString()}
                  </p>
                  {price.price === lowestPrice && (
                    <span className="text-sm text-success">Best Price</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
