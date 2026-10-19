import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Container, EmptyState } from '../components/ui/misc';

export default function NotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="We couldn't find that page"
        body="The link may be out of date. Head back to the floor plan to continue planning your promotion."
        action={<Button to="/plan">Go to the floor plan</Button>}
      />
    </Container>
  );
}
