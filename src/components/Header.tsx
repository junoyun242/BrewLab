import { useState } from "react";
import {
  AppShell,
  Container,
  Group,
  Title,
  ActionIcon,
  Button,
  Drawer,
  Stack,
  Divider,
  Text,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import {
  IconCoffee,
  IconMenu2,
  IconHome2,
  IconNotebook,
  IconPlus,
} from "@tabler/icons-react";
import { useMantineTheme } from "@mantine/core";

const Header = () => {
  const theme = useMantineTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppShell.Header>
        <Container size="xs" h="100%">
          <Group h="100%" justify="space-between" align="center">
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                size="lg"
                aria-label="Open navigation"
                onClick={() => setOpen(true)}
              >
                <IconMenu2 size={20} />
              </ActionIcon>

              <Link to="/" style={{ textDecoration: "none" }}>
                <Group gap={8} style={{ cursor: "pointer" }}>
                  <IconCoffee size={18} />
                  <Title order={4} fw={700}>
                    BrewLab
                  </Title>
                </Group>
              </Link>
            </Group>

            <Button
              leftSection={<IconPlus size={16} />}
              variant="outline"
              color="yellow"
              radius="md"
              size="sm"
              component={Link}
              to="/new-recipe"
            >
              New
            </Button>
          </Group>
        </Container>
      </AppShell.Header>

      <Drawer
        opened={open}
        onClose={() => setOpen(false)}
        title="Menu"
        size="xs"
        padding="md"
        overlayProps={{ opacity: 0.5, blur: 2 }}
        styles={{
          content: { backgroundColor: theme.colors.dark[8] },
          header: {
            backgroundColor: theme.colors.dark[7],
            borderBottom: `1px solid ${theme.colors.dark[5]}`,
          },
          title: { color: theme.black === "#000" ? theme.white : theme.white }, // or just set a fixed color
        }}
      >
        <Stack gap="xs">
          <Button
            variant="subtle"
            leftSection={<IconHome2 size={16} />}
            component={Link}
            to="/"
            onClick={() => setOpen(false)}
          >
            Home
          </Button>
          <Button
            variant="subtle"
            leftSection={<IconNotebook size={16} />}
            component={Link}
            to="/new-recipe"
            onClick={() => setOpen(false)}
          >
            New
          </Button>
          <Divider />
          <Text size="xs" c="dimmed">
            Brew better. Stay analog.
          </Text>
        </Stack>
      </Drawer>
    </>
  );
};

export default Header;
