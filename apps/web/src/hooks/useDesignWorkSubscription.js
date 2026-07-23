import { useState, useEffect, useCallback, useRef } from 'react';
import { designWorkService } from '@/services/designWorkService.js';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';

const POLL_INTERVAL_MS = 30000;

export const useDesignWorkSubscription = () => {
  const [designWorks, setDesignWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      if (isFirstLoad.current) setLoading(true);

      const [records, crewRes] = await Promise.all([
        designWorkService.listAll({ sort: 'created_at', order: 'desc' }),
        crewAssignmentService.listAll(),
      ]);

      // Map crew assignments to design works based on shared order_id
      const mappedRecords = records.map((record) => {
        const orderId = record.order_id;
        const assignedCrews = crewRes
          .filter((ca) => ca.order_id === orderId)
          .map((ca) => ca.crew)
          .filter(Boolean); // removes nulls if expansion fails

        return {
          ...record,
          assigned_crews: assignedCrews,
        };
      });

      setDesignWorks(mappedRecords);
      setError(null);
    } catch (err) {
      console.error('[useDesignWorkSubscription] Fetch error details:', err);
      setError(err.message || 'Failed to load design work data.');
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

  return { designWorks, loading, error, refetch: fetchData };
};
