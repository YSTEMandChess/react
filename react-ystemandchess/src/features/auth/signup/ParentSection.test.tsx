import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ParentSection from "./ParentSection";

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ _id: "1", username: "kiddo", firstName: "Kid" }]),
    })
  ) as jest.Mock;
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ParentSection />
    </MemoryRouter>
  );

test("lists the parent's children", async () => {
  renderPage();
  expect(await screen.findByText("Kid")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add Another Child" })).toBeInTheDocument();
});

test("enables Go to Student Page only after a child is selected", async () => {
  renderPage();

  const child = await screen.findByText("Kid");
  const goButton = screen.getByRole("button", { name: /Go to Student Page/i });
  expect(goButton).toBeDisabled();

  fireEvent.click(child);
  expect(goButton).not.toBeDisabled();
});
