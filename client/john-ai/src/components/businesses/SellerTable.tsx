import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowUpDown, Phone, Trash2 } from 'lucide-react';
import { BusinessInfo, SellerInfo } from '@/types/dealership';
interface SellerTableProps {
  sellers: BusinessInfo[];
  onDeleteSeller: (index: number) => void;
  onCallSeller: (phone: string) => void;
  onCallAllSellers: () => void;
}
export const SellerTable = ({
  sellers,
  onDeleteSeller,
  onCallSeller,
  onCallAllSellers
}: SellerTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof SellerInfo>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const sellersPerPage = 5;
  const handleSort = (field: keyof SellerInfo) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const placeholderSellers = Array(10).fill(null).map((_, index) => ({
    name: `Example Seller ${index + 1}`,
    distance: 0.0,
    productName: "Sample Product",
    productDetails: "Enter search details above",
    quote: 0.00,
    notes: "Notes here",
    phone: "555-0000"
  }));
  const sortedSellers = [...(sellers.length > 0 ? sellers.slice(0, 10) : placeholderSellers)].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (typeof a[sortField] === 'string') {
      return multiplier * (a[sortField] as string).localeCompare(b[sortField] as string);
    }
    return multiplier * ((a[sortField] as number) - (b[sortField] as number));
  });
  const totalPages = Math.ceil(sortedSellers.length / sellersPerPage);
  const startIndex = (currentPage - 1) * sellersPerPage;
  const endIndex = startIndex + sellersPerPage;
  const currentSellers = sortedSellers.slice(startIndex, endIndex);
  return <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Rank</TableHead>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-gray-50">
                Seller <ArrowUpDown className="inline ml-1" size={16} />
              </TableHead>
              <TableHead onClick={() => handleSort('notes')} className="cursor-pointer hover:bg-gray-50">
                Notes <ArrowUpDown className="inline ml-1" size={16} />
              </TableHead>
              <TableHead>Details</TableHead>
              <TableHead onClick={() => handleSort('price')} className="text-right cursor-pointer hover:bg-gray-50">
                Quote <ArrowUpDown className="inline ml-1" size={16} />
              </TableHead>
              <TableHead onClick={() => handleSort('phone')} className="cursor-pointer hover:bg-gray-50">
                Phone <ArrowUpDown className="inline ml-1" size={16} />
              </TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSellers.map((seller, index) => <TableRow key={index}>
                <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                <TableCell>{seller.name}</TableCell>
                <TableCell>{seller.notes}</TableCell>
                <TableCell className="text-right">${seller.quote ? seller.quote.toFixed(2) : ""}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => seller.phone ? onCallSeller(seller.phone) : null} className={`h-8 px-2 ${seller.phone ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400'}`}>
                    {seller.phone || 'N/A'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteSeller(startIndex + index)} className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(page => Math.max(1, page - 1))} className="cursor-pointer" />
            </PaginationItem>
            
            {Array.from({
            length: totalPages
          }, (_, i) => i + 1).map(page => <PaginationItem key={page}>
                <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                  {page}
                </PaginationLink>
              </PaginationItem>)}

            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} className="cursor-pointer" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="flex justify-center">
          
        </div>
      </div>
    </div>;
};