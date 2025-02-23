
import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export const VoiceAgent = () => {
  const conversation = useConversation({
    clientTools: {
      updatePrice: (parameters: { price: string }) => {
        console.log('New price:', parameters.price);
        return "Price updated successfully";
      }
    }
  });

  const [isNegotiating, setIsNegotiating] = useState(false);

  const startNegotiation = async () => {
    setIsNegotiating(true);
    try {
      await conversation.startSession({
        agentId: "deal-negotiator", // Replace with your actual agent ID
      });
    } catch (error) {
      console.error('Error starting negotiation:', error);
    }
  };

  const endNegotiation = async () => {
    await conversation.endSession();
    setIsNegotiating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto mt-8"
    >
      <Card className="p-6 backdrop-blur-sm bg-white/80">
        <h2 className="text-xl font-semibold mb-4">Voice Negotiation</h2>
        <div className="space-y-4">
          <Button
            onClick={isNegotiating ? endNegotiation : startNegotiation}
            className={`w-full ${
              isNegotiating ? "bg-destructive" : "bg-success"
            } hover:opacity-90`}
          >
            {isNegotiating ? "End Negotiation" : "Start Negotiation"}
          </Button>
          
          {isNegotiating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full animate-ping" />
                <span className="text-sm">Negotiating...</span>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
