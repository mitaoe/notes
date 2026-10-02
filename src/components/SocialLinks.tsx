import { ActionIcon } from '@mantine/core';

import { site } from '../config.ts';
import { IconBrandGithub, IconMessage } from '../icons.ts';

type SocialLinksProps = { size: 'lg' | 'xl'; variant: 'subtle' | 'light'; iconSize: number };

export function SocialLinks({ size, variant, iconSize }: SocialLinksProps) {
  return (
    <>
      <ActionIcon
        component="a"
        href={site.githubUrl}
        target="_blank"
        size={size}
        variant={variant}
        color="gray"
        aria-label="GitHub"
      >
        <IconBrandGithub size={iconSize} />
      </ActionIcon>
      <ActionIcon
        component="a"
        href={site.contactUrl}
        target="_blank"
        size={size}
        variant={variant}
        color="gray"
        aria-label="Contact"
      >
        <IconMessage size={iconSize} />
      </ActionIcon>
    </>
  );
}
