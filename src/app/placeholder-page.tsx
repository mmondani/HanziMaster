import { PageHeader } from '@/components/layout/page-header';
import { TopBar } from '@/components/layout/top-bar';

/** Pantalla provisoria hasta que cada sección se implemente (pasos 4 a 10 del plan). */
export function PlaceholderPage({ title, child }: { title: string; child?: boolean }) {
  return (
    <>
      {child ? <TopBar title={title} /> : null}
      <div className="page">
        {child ? null : <PageHeader title={title} />}
        <p className="muted">Próximamente.</p>
      </div>
    </>
  );
}
