import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

test("renders social media links with correct hrefs", () => {
  render(<Footer />);

  const twitter = screen.getByAltText("twitter-icon");
  const instagram = screen.getByAltText("instagram-icon");
  const facebook = screen.getByAltText("facebook-icon");
  const google = screen.getByAltText("google-icon");

  expect(twitter).toBeInTheDocument();
  expect(instagram).toBeInTheDocument();
  expect(facebook).toBeInTheDocument();
  expect(google).toBeInTheDocument();

  expect(twitter.closest("a")?.getAttribute("href")).toBe("/");
  expect(instagram.closest("a")?.getAttribute("href")).toBe(
    "https://www.instagram.com/stemwithstemy/",
  );
  expect(facebook.closest("a")?.getAttribute("href")).toBe(
    "https://www.facebook.com/YSTEMandChess/",
  );
  expect(google.closest("a")?.getAttribute("href")).toBe("/");
});

test("renders sponsor logos", () => {
  render(<Footer />);

  expect(screen.getByAltText("ventive-logo")).toBeInTheDocument();
  expect(screen.getByAltText("kount-logo")).toBeInTheDocument();
  expect(screen.getByAltText("idahoCentral-logo")).toBeInTheDocument();
  expect(screen.getByAltText("PH-logo")).toBeInTheDocument();
});

test("renders partner logos", () => {
  render(<Footer />);

  expect(screen.getByAltText("boiseRescue-logo")).toBeInTheDocument();
  expect(screen.getByAltText("boysAndGirls-logo")).toBeInTheDocument();
  expect(screen.getByAltText("possible-logo")).toBeInTheDocument();
  expect(screen.getByAltText("boiseDistrict-logo")).toBeInTheDocument();
  expect(screen.getByAltText("rotary-logo")).toBeInTheDocument();
});
