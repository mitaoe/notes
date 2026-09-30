import { Alert } from '@mantine/core';

import { IconAlertCircle } from '../icons.ts';

type ErrorAlertProps = { message: string };

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="xl" variant="filled">
      {message}
    </Alert>
  );
}
