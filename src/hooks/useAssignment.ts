import type { AssignmentResult } from '../types';

/** Stub – no backend exists, so the API always returns nothing. */
export function useAssignment() {
  return {
    assignment:          null as AssignmentResult | null,
    isLoading:           false,
    error:               null as unknown,
    isConfirmed:         false,
    confirmAssignment:   async (): Promise<AssignmentResult> => { throw new Error('No API'); },
    resetAssignment:     async (): Promise<AssignmentResult> => { throw new Error('No API'); },
    mutate:              async () => {},
  };
}
