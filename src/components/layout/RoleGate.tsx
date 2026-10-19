import type { ReactNode } from 'react';
import { Building2, ShieldCheck } from 'lucide-react';
import type { Role } from '../../types';
import { useStore } from '../../store/StoreProvider';
import { Button } from '../ui/Button';
import { Container, EmptyState } from '../ui/misc';

/** Demo-only guard: shows a friendly "switch role" prompt instead of the page. */
export function RoleGate({ need, children }: { need: Role; children: ReactNode }) {
  const { role, setRole } = useStore();
  if (role === need) return <>{children}</>;
  const admin = need === 'admin';
  return (
    <Container className="py-20">
      <EmptyState
        icon={admin ? <ShieldCheck className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
        title={admin ? 'This area is for AICL admins' : 'This area is for business users'}
        body={`You're currently viewing as ${admin ? 'a Business' : 'AICL Admin'}. Use the "View as" switch in the header — or the button below — to continue the demo.`}
        action={
          <Button onClick={() => setRole(need)} icon={admin ? <ShieldCheck className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}>
            Switch to {admin ? 'AICL Admin' : 'Business'}
          </Button>
        }
      />
    </Container>
  );
}
