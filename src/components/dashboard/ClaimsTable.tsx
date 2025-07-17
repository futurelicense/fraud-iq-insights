
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter,
  Eye,
  Download,
  AlertTriangle
} from 'lucide-react';
import { AnalyzedClaim } from '../../types/fraud';
import { ClaimDetailModal } from './ClaimDetailModal';

interface ClaimsTableProps {
  claims: AnalyzedClaim[];
  onExport?: (claims: AnalyzedClaim[]) => void;
}

export function ClaimsTable({ claims, onExport }: ClaimsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('fraud_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedClaim, setSelectedClaim] = useState<AnalyzedClaim | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredClaims = useMemo(() => {
    let filtered = claims;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim => 
        claim.Claim_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.Employer_Name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(claim => 
        claim.analysis.fraud_label.toLowerCase() === riskFilter.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a.analysis.fraud_score;
      let bValue: any = b.analysis.fraud_score;

      if (sortField === 'claim_id') {
        aValue = a.Claim_ID;
        bValue = b.Claim_ID;
      } else if (sortField === 'name') {
        aValue = a.Name;
        bValue = b.Name;
      } else if (sortField === 'amount') {
        aValue = parseFloat(a.Claim_Amount) || 0;
        bValue = parseFloat(b.Claim_Amount) || 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [claims, searchTerm, riskFilter, sortField, sortDirection]);

  const paginatedClaims = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClaims.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClaims, currentPage]);

  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getRiskBadgeColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'severe': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <>
      <Card className="card-hover">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle>Claims Analysis Results</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onExport?.(filteredClaims)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search claims, names, or employers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="severe">Severe Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('claim_id')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Claim ID</span>
                      <SortIcon field="claim_id" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Claimant</span>
                      <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('fraud_score')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Risk Score</span>
                      <SortIcon field="fraud_score" />
                    </div>
                  </TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      <SortIcon field="amount" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClaims.map((claim) => (
                  <TableRow key={claim.Claim_ID} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{claim.Claim_ID}</TableCell>
                    <TableCell>{claim.Name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              claim.analysis.fraud_score > 0.7 ? 'bg-red-500' :
                              claim.analysis.fraud_score > 0.5 ? 'bg-orange-500' :
                              claim.analysis.fraud_score > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${claim.analysis.fraud_score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {(claim.analysis.fraud_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskBadgeColor(claim.analysis.fraud_label)}>
                        {claim.analysis.fraud_label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {claim.analysis.flags.length > 0 && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="text-sm">{claim.analysis.flags.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>${parseFloat(claim.Claim_Amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredClaims.length)} of {filteredClaims.length} claims
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          isOpen={!!selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </>
  );
}
