import React from 'react';
import { Container, Title, Text, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Container size="md" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <Title order={1} size="3rem" mb="md">404</Title>
      <Text size="xl" mb="xl">The page you&apos;re looking for doesn&apos;t exist.</Text>
      <Group position="center">
        <Button onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Group>
    </Container>
  );
} 