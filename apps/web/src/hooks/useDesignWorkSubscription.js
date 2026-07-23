import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

export const useDesignWorkSubscription = () => {
  const [designWorks, setDesignWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[useDesignWorkSubscription] Initiating fetch for design_work and crew records...');
      
      const [records, crewRes] = await Promise.all([
        pb.collection('design_work').getFullList({
          expand: 'order_id,designer_id',
          sort: '-created',
          $autoCancel: false
        }),
        pb.collection('crew_assignments').getFullList({
          expand: 'crew_id',
          $autoCancel: false
        })
      ]);
      
      console.log(`[useDesignWorkSubscription] Successfully fetched ${records.length} design records and ${crewRes.length} crew assignments.`);
      
      // Map crew assignments to design works based on shared order_id
      const mappedRecords = records.map((record) => {
        const orderId = record.order_id;
        const assignedCrews = crewRes
          .filter(ca => ca.order_id === orderId)
          .map(ca => ca.expand?.crew_id)
          .filter(Boolean); // removes nulls if expansion fails

        return {
          ...record,
          assigned_crews: assignedCrews
        };
      });

      // Comprehensive logging of design_file_link and mapped crews
      mappedRecords.forEach((record, index) => {
        const link = record.design_file_link;
        console.log(`[useDesignWorkSubscription] Record ${index + 1}/${mappedRecords.length} (ID: ${record.id}):`);
        console.log(`  - Raw design_file_link:`, link || 'NULL/EMPTY');
        console.log(`  - Assigned Crews:`, record.assigned_crews.map(c => c.name).join(', ') || 'Unassigned');
      });
      
      setDesignWorks(mappedRecords);
      setError(null);
    } catch (err) {
      console.error('[useDesignWorkSubscription] Fetch error details:', err);
      setError(err.message || 'Failed to load design work data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    let unsubDesign, unsubOrders, unsubCrew;

    pb.collection('design_work').subscribe('*', function (e) {
      fetchData();
    }).then(u => unsubDesign = u).catch(console.error);

    pb.collection('orders').subscribe('*', function (e) {
      fetchData();
    }).then(u => unsubOrders = u).catch(console.error);

    pb.collection('crew_assignments').subscribe('*', function (e) {
      fetchData();
    }).then(u => unsubCrew = u).catch(console.error);

    return () => {
      if (unsubDesign) pb.collection('design_work').unsubscribe('*').catch(console.error);
      if (unsubOrders) pb.collection('orders').unsubscribe('*').catch(console.error);
      if (unsubCrew) pb.collection('crew_assignments').unsubscribe('*').catch(console.error);
    };
  }, [fetchData]);

  return { designWorks, loading, error, refetch: fetchData };
};