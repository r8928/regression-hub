import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { usePathname } from "next/navigation";

const NAV_LABELS = [
  "Dashboard",
  "Test Cases",
  "Applications",
  "Modules",
  "Assignments",
  "Test Runs",
  "Reports",
];

describe("Sidebar", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/dashboard");
  });

  it("renders all main nav items when open", () => {
    render(<Sidebar />);
    for (const label of NAV_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("hides nav labels and shows only icons after collapsing", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.queryByText("Dashboard")).toBeNull();
  });

  it("expands again when QA button is clicked while collapsed", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("marks the active nav item based on pathname", () => {
    usePathname.mockReturnValue("/test-cases");
    render(<Sidebar />);
    const link = screen.getByText("Test Cases").closest("a");
    expect(link.className).toContain("active");
  });

  it("does not render admin nav for non-admin user", () => {
    render(
      <Sidebar
        user={{ name: "Alice", role: "qa", teamId: "radius", teamName: "Radius" }}
      />
    );
    expect(screen.queryByText("Users")).toBeNull();
  });

  it("renders admin nav for admin user", () => {
    render(
      <Sidebar
        user={{ name: "Bob", role: "admin", teamId: "radius", teamName: "Radius" }}
      />
    );
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("shows signed-in user name when session exists and sidebar is open", () => {
    render(
      <Sidebar
        user={{ name: "Charlie", role: "qa", teamId: "radius", teamName: "Radius" }}
      />
    );
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Radius")).toBeInTheDocument();
  });

  it("shows Sign Out button", () => {
    render(<Sidebar />);
    expect(screen.getByTitle("Sign out")).toBeInTheDocument();
  });

  it("renders 'Import Test Cases' nav item for admin user", () => {
    render(
      <Sidebar
        user={{ name: "Bob", role: "admin", teamId: "radius", teamName: "Radius" }}
      />
    );
    expect(screen.getByText("Import Test Cases")).toBeInTheDocument();
  });

  it("does not render 'Import Test Cases' for non-admin user", () => {
    render(
      <Sidebar
        user={{ name: "Alice", role: "qa", teamId: "radius", teamName: "Radius" }}
      />
    );
    expect(screen.queryByText("Import Test Cases")).toBeNull();
  });
});
