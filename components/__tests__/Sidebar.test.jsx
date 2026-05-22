import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { useSession } from "next-auth/react";
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
    useSession.mockReturnValue({ data: null });
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
    useSession.mockReturnValue({
      data: {
        user: {
          name: "Alice",
          role: "qa",
          teamId: "radius",
          teamName: "Radius",
        },
      },
    });
    render(<Sidebar />);
    expect(screen.queryByText("Users")).toBeNull();
  });

  it("renders admin nav for admin user", () => {
    useSession.mockReturnValue({
      data: {
        user: {
          name: "Bob",
          role: "admin",
          teamId: "radius",
          teamName: "Radius",
        },
      },
    });
    render(<Sidebar />);
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("shows signed-in user name when session exists and sidebar is open", () => {
    useSession.mockReturnValue({
      data: {
        user: {
          name: "Charlie",
          role: "qa",
          teamId: "radius",
          teamName: "Radius",
        },
      },
    });
    render(<Sidebar />);
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Radius")).toBeInTheDocument();
  });

  it("shows Sign Out button", () => {
    render(<Sidebar />);
    expect(screen.getByTitle("Sign out")).toBeInTheDocument();
  });
});
