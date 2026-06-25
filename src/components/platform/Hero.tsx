import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon } from "@/icons";

interface HeroProps {
  liveCount: number;
  totalCount: number;
}

export function Hero({ liveCount, totalCount }: HeroProps) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-4 pt-14 sm:px-8 sm:pt-20">
      <div className="max-w-3xl animate-fadeUp">
        <Badge tone="brand" variant="soft" className="mb-5">
          Bajaj Life · Marketing AI
        </Badge>

        <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-6xl">
          Your AI agents,
          <br />
          <span className="text-brand">one place.</span>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
          The platform home for Bajaj Life&rsquo;s marketing AI — regulatory compliance, SEO
          intelligence and the shared data backbone, behind one secure door.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button href="#agents" variant="primary" size="md">
            Explore agents
            <ArrowRightIcon width={18} height={18} />
          </Button>
          <Button href="/compliance" variant="secondary" size="md">
            Open Compliance
          </Button>
        </div>

        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
          <Stat value={`${liveCount}/${totalCount}`} label="agents live" />
          <Stat value="1" label="secure VM" />
          <Stat value="nginx" label="single gateway" />
        </dl>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <dt className="order-2 text-sm text-ink-subtle">{label}</dt>
      <dd className="order-1 text-2xl font-bold tracking-tight text-navy">{value}</dd>
    </div>
  );
}
