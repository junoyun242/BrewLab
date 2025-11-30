import { AppShell } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";
import Header from "../components/Header";

const Root = () => {
  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      withBorder={false}
      styles={(theme) => ({
        header: {
          backgroundColor: theme.colors.dark[7], // darker header
          borderBottom: `1px solid ${theme.colors.dark[5]}`, // subtle analog line
        },
        main: {
          backgroundColor: theme.colors.dark[8], // true dark canvas
        },
      })}
    >
      <Header />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default Root;
