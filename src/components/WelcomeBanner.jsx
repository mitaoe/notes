import { useState, useEffect } from 'react';
import { Paper, Text, Group, ActionIcon, Box, Stack, Badge } from '@mantine/core';
import { IconX, IconSchool, IconUsers, IconFileText } from '@tabler/icons-react';

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed');
    const minimized = localStorage.getItem('welcomeBannerMinimized');
    
    if (dismissed === 'true') {
      setIsVisible(false);
    } else if (minimized === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  const handleToggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    localStorage.setItem('welcomeBannerMinimized', newMinimized.toString());
  };

  if (!isVisible) return null;

  return (
    <Paper
      shadow="xs"
      p={isMinimized ? "sm" : "md"}
      mb="sm"
      sx={(theme) => ({
        backgroundColor: theme.colorScheme === 'dark' 
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
        border: `1px solid ${theme.colorScheme === 'dark' 
          ? theme.colors.dark[4]
          : theme.colors.gray[2]}`,
        transition: 'all 0.3s ease',
      })}
    >
      <Group position="apart" align="flex-start" noWrap>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!isMinimized ? (
            <Stack spacing="sm">
              <Group spacing="xs" align="center">
                <IconSchool size={20} color="#1A73E8" />
                <Text size="lg" weight={600} color="#1A73E8">
                  MITAOE Student Notes Platform
                </Text>
                <Badge size="sm" variant="light" color="blue">
                  By Students, For Students
                </Badge>
              </Group>
              
              <Text size="sm" color="dimmed" sx={{ lineHeight: 1.5 }}>
                Welcome to the student-driven academic resource hub for MIT Academy of Engineering. 
                This platform provides easy access to course materials, study notes, and educational 
                resources shared by your fellow students to help everyone succeed together.
              </Text>
              
              <Group spacing="lg" sx={{ '@media (max-width: 768px)': { spacing: 'xs' } }}>
                <Group spacing="xs" align="center">
                  <IconUsers size={16} />
                  <Text size="xs" color="dimmed">Community Driven</Text>
                </Group>
                <Group spacing="xs" align="center">
                  <IconFileText size={16} />
                  <Text size="xs" color="dimmed">Study Materials</Text>
                </Group>
                <Group spacing="xs" align="center">
                  <IconSchool size={16} />
                  <Text size="xs" color="dimmed">MITAOE Students</Text>
                </Group>
              </Group>
            </Stack>
          ) : (
            <Group spacing="xs" align="center" onClick={handleToggleMinimize} sx={{ cursor: 'pointer' }}>
              <IconSchool size={16} color="#1A73E8" />
              <Text size="sm" weight={500} color="#1A73E8">
                MITAOE Student Notes Platform
              </Text>
              <Text size="xs" color="dimmed">- Click to expand</Text>
            </Group>
          )}
        </Box>
        
        <Group spacing="xs" align="flex-start">
          {!isMinimized && (
            <ActionIcon
              size="md"
              variant="subtle"
              onClick={handleToggleMinimize}
              title="Minimize banner"
              sx={(theme) => ({
                color: theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6],
              })}
            >
              <Text size="sm">−</Text>
            </ActionIcon>
          )}
          <ActionIcon
            size="md"
            variant="subtle"
            onClick={handleDismiss}
            title="Dismiss banner"
            sx={(theme) => ({
              color: theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6],
            })}
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
