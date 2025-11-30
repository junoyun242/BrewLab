import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import Home from "./routes/Home";
import Root from "./routes/Root";
import NewRecipe from "./routes/NewRecipe";
import BrewPage from "./routes/Brew";

const theme = createTheme({
  defaultRadius: "lg",
  primaryColor: "yellow",
});

const rootRoute = createRootRoute({ component: Root });
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const newRecipeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-recipe",
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id as string | undefined,
  }),
  component: NewRecipe,
});

const brewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/brew/$id",
  component: BrewPage,
});

const routeTree = rootRoute.addChildren([homeRoute, newRecipeRoute, brewRoute]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const App = () => {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <RouterProvider router={router} />
    </MantineProvider>
  );
};

export default App;
