import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Eye, Search, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { designWorkService } from '@/services/designWorkService.js';
import { productService } from '@/services/productService.js';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DesignWorkList = () => {
  const { currentUser } = useAuth();
  const [workList, setWorkList] = useState([]);
  const [filteredWork, setFilteredWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadDesignWork();
    }
  }, [currentUser]);

  const loadDesignWork = async () => {
    try {
      const [records, products] = await Promise.all([
        designWorkService.listAll({ designerId: currentUser.id }),
        productService.listAll(),
      ]);
      const productMap = new Map(products.map((p) => [p.id, p]));
      const enriched = records.map((r) => ({
        ...r,
        order: r.order
          ? { ...r.order, product: productMap.get(r.order.product_id) || null }
          : null,
      }));
      enriched.sort((a, b) => new Date(a.order?.event_date || 0) - new Date(b.order?.event_date || 0));
      setWorkList(enriched);
      setFilteredWork(enriched);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = workList;
    
    if (statusFilter !== 'All') {
      result = result.filter(w => w.status === statusFilter);
    }
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(w => {
        const order = w.order;
        return order?.event_name?.toLowerCase().includes(lowerQuery) || 
               order?.customer_name?.toLowerCase().includes(lowerQuery);
      });
    }
    
    setFilteredWork(result);
  }, [statusFilter, searchQuery, workList]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', classes: 'bg-muted text-muted-foreground' },
      'in_progress': { label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
      'revision': { label: 'Revision', classes: 'bg-orange-100 text-orange-800' },
      'completed': { label: 'Completed', classes: 'bg-green-100 text-green-800' }
    };
    const mapped = statusMap[status] || statusMap['pending'];

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${mapped.classes}`}>
        {mapped.label}
      </span>
    );
  };

  // The order itself (Pending/Confirmed/In Progress/Completed/Cancelled) has
  // a separate lifecycle from this designer's own design work status — shown
  // side by side so it's never ambiguous which one a badge refers to.
  const getOrderStatusBadge = (status) => {
    const statusMap = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-emerald-100 text-emerald-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      Completed: 'bg-blue-100 text-blue-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusMap[status] || 'bg-muted text-muted-foreground'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>My Projects - Thenarsis Designer</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance">My Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and track your assigned design tasks.</p>
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-card border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-4">
              <CardTitle>Assigned Projects</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search events or clients..."
                    className="pl-9 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 bg-background">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredWork.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium text-foreground">No projects found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 whitespace-nowrap">
                      <TableRow>
                        <TableHead className="pl-6 font-semibold">Event Name</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Event Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Package</TableHead>
                        <TableHead className="font-semibold">Order Status</TableHead>
                        <TableHead className="font-semibold">Design Status</TableHead>
                        <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWork.map((work) => {
                        const order = work.order;
                        return (
                          <TableRow key={work.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="pl-6 font-medium whitespace-nowrap text-foreground">
                              {order?.event_name || 'N/A'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{order?.customer_name || 'N/A'}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {order?.event_date ? format(new Date(order.event_date), 'MMM dd, yyyy') : '-'}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={order?.event_location}>
                              {order?.event_location || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {order?.product?.package_name || 'Custom'}
                            </TableCell>
                            <TableCell>
                              {getOrderStatusBadge(order?.status)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(work.status)}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary transition-colors">
                                <Link to={`/designer/project/${work.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DesignWorkList;