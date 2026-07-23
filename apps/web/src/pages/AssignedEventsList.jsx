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
import { Eye, Search } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AssignedEventsList = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  const loadEvents = async () => {
    try {
      const records = await pb.collection('crew_assignments').getFullList({
        filter: `crew_id = "${currentUser.id}"`,
        expand: 'order_id,order_id.product_id',
        sort: '+order_id.event_date',
        $autoCancel: false
      });
      setEvents(records);
      setFilteredEvents(records);
    } catch (error) {
      toast.error('Failed to load assigned events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = events;
    
    if (statusFilter !== 'All') {
      result = result.filter(e => e.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(e => {
        const order = e.expand?.order_id;
        return order?.event_name?.toLowerCase().includes(lowerQuery) || 
               order?.customer_name?.toLowerCase().includes(lowerQuery);
      });
    }
    
    setFilteredEvents(result);
  }, [statusFilter, searchQuery, events]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Schedule - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Events Schedule</h1>
            <p className="text-muted-foreground mt-1">Track all your scheduled shoots and fieldwork</p>
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-white border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <CardTitle>Assigned Events</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search events..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  No events found matching your criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 whitespace-nowrap">
                      <TableRow>
                        <TableHead className="pl-6">Event Name</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Event Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead className="text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((assignment) => {
                        const order = assignment.expand?.order_id;
                        return (
                          <TableRow key={assignment.id} className="hover:bg-muted/30">
                            <TableCell className="pl-6 font-medium whitespace-nowrap">
                              {order?.event_name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{order?.customer_name}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {order?.event_date ? format(new Date(order.event_date), 'MMM dd, yyyy') : '-'}
                            </TableCell>
                            <TableCell className="truncate max-w-[200px]">{order?.event_location}</TableCell>
                            <TableCell>{order?.expand?.product_id?.package_name}</TableCell>
                            <TableCell>
                              <span className={`badge-status-${assignment.status === 'pending' ? 'waiting' : 'done'}`}>
                                {assignment.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Link to={`/event/${assignment.id}`}>
                                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Details
                                </Button>
                              </Link>
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

export default AssignedEventsList;