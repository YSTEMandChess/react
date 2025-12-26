import { render } from "@testing-library/react";
import Lessons from "./Lessons";
import { MemoryRouter } from "react-router";

test("stub: renders Lessons component without crashing", () => {
  render(
    <MemoryRouter>
      <Lessons />
    </MemoryRouter>
  );
  expect(true).toBe(true); // Always passes
});
