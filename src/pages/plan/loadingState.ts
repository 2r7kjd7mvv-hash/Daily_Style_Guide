import type { WorkflowStreamEvent } from '@/types';

export function getLoadingStepIndex(event: WorkflowStreamEvent, current: number) {
  return event.event === 'Message' ? Math.min(current + 1, 4) : current;
}
