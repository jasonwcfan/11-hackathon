import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface SearchFormProps {
  itemType: string;
  location: string;
  onItemTypeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}
export const SearchForm = ({
  itemType,
  location,
  onItemTypeChange,
  onLocationChange,
  onSubmit,
  isLoading
}: SearchFormProps) => {
  return <form onSubmit={onSubmit} className="space-y-6 w-full">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-lg text-slate-950 font-medium">
            What are you looking to buy?
          </label>
          <Input type="text" value={itemType} onChange={e => onItemTypeChange(e.target.value)} placeholder="e.g., Car, Home service, Wholesale goods" className="text-lg h-12" required />
        </div>
        <div className="space-y-2">
          <label className="text-lg text-slate-950 font-medium">Postal Code</label>
          <Input type="text" value={location} onChange={e => onLocationChange(e.target.value)} placeholder="e.g., 94105" className="text-lg h-12" required />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full text-lg h-12 bg-green-600 hover:bg-green-500">
        {isLoading ? "Searching..." : "Find Sellers"}
      </Button>
    </form>;
};