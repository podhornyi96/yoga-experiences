import type { Experience } from "@/data/experiences";
import {
  ClockIcon,
  ExternalLinkIcon,
  LevelIcon,
  MapPinIcon,
  UsersIcon,
} from "@/components/icons";

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof ClockIcon;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-sand py-2 last:border-0">
      <dt className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 shrink-0 text-sage-dark" />
        {label}
      </dt>
      <dd className="max-w-[55%] text-right font-medium text-ink">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-end gap-1 hover:text-clay-dark hover:underline"
          >
            <span className="truncate">{value}</span>
            <ExternalLinkIcon className="text-sage-dark/70" />
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function ExperienceDetails({ experience }: { experience: Experience }) {
  return (
    <dl className="mt-4 text-sm">
      <DetailRow
        icon={ClockIcon}
        label="Duration"
        value={experience.duration}
      />
      <DetailRow
        icon={UsersIcon}
        label="Group size"
        value={experience.groupSize}
      />
      <DetailRow
        icon={MapPinIcon}
        label="Location"
        value={experience.locationLabel}
        href={experience.locationUrl}
      />
      <DetailRow
        icon={LevelIcon}
        label="Level"
        value={experience.tags.level.replace("-", " ")}
      />
    </dl>
  );
}
