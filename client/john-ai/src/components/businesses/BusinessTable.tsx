import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowUpDown, Phone, Trash2 } from 'lucide-react';
import { BusinessInfo } from '@/types/dealership';
interface BusinessTableProps {
  businesses: BusinessInfo[];
  onDeleteBusiness: (index: number) => void;
  onCallBusiness: (business: BusinessInfo) => void;
  onCallAllBusinesses: () => void;
}
export const BusinessTable = ({
  businesses,
  onDeleteBusiness,
  onCallBusiness,
  onCallAllBusinesses
}: BusinessTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof BusinessInfo>('quote');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const businessesPerPage = 10;
  const handleSort = (field: keyof BusinessInfo) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const sortedBusinesses = [...(businesses.length > 0 ? businesses.slice(0, 10) : [])].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (typeof a[sortField] === 'string') {
      return multiplier * (a[sortField] as string).localeCompare(b[sortField] as string);
    }
    return multiplier * ((a[sortField] as number) - (b[sortField] as number));
  });
  const totalPages = Math.ceil(sortedBusinesses.length / businessesPerPage);
  const startIndex = (currentPage - 1) * businessesPerPage;
  const endIndex = startIndex + businessesPerPage;
  const currentBusinesses = sortedBusinesses.slice(startIndex, endIndex);
  return <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Number</TableHead>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-gray-50">
                Business <ArrowUpDown className="inline ml-1" size={16} />
              </TableHead>
              <TableHead onClick={() => handleSort('quote')} className="text-right cursor-pointer hover:bg-gray-50">
                Quote <ArrowUpDown className="inline ml-1" size={16} />
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50">
                Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBusinesses.map((business, index) => <TableRow key={index}>
                <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                <TableCell>{business.name}</TableCell>
                <TableCell className="text-right">${business.quote ? business.quote.toFixed(2) : ""}</TableCell>
                <TableCell>{business.notes}</TableCell>
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