import { Button, Container, Group, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

import { routes } from '../config.ts';

import buttonClasses from '../styles/buttons.module.css';
import classes from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <Container size="md" className={classes.page}>
      <meta name="robots" content="noindex" />
      <Title order={1} size="3rem" mb="md">
        404
      </Title>
      <Text size="xl" mb="xl">
        The page you&apos;re looking for doesn&apos;t exist.
      </Text>
      <Group justify="center">
        <Button component={Link} to={routes.home} className={buttonClasses.primary}>
          Back to Home
        </Button>
      </Group>
    </Container>
  );
}
