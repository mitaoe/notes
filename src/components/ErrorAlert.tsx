import { Alert } from '@mantine/core';

import { IconAlertCircle } from '../icons.ts';

const DISMISS_LABEL = 'Dismiss error';

type ErrorAlertProps = { message: string; onClose: (() => void) | null };

export function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      title="Error"
      color="red"
      mb="xl"
      variant="filled"
      withCloseButton={onClose !== null}
      closeButtonLabel={DISMISS_LABEL}
      onClose={onClose ?? undefined}
    >
      {message}
    </Alert>
  );
}
