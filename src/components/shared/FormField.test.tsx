// @vitest-environment jsdom
import { zodResolver } from "@hookform/resolvers/zod";
import { act, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { FormField } from "./FormField";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.email("Bad email"),
  bio: z.string(),
  pick: z.string(),
});

function useHarnessForm() {
  return useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", bio: "", pick: "a" },
  });
}

function Harness({ onReady }: { onReady?: (form: ReturnType<typeof useHarnessForm>) => void }) {
  const form = useHarnessForm();
  onReady?.(form);
  return (
    <form>
      <FormField form={form} name="name" label="Name" hint="Shown to the grove" />
      <FormField form={form} name="email" kind="email" label="Email" />
      <FormField
        form={form}
        name="bio"
        kind="textarea"
        label="About you"
        counterMax={10}
        optional
      />
      <FormField
        form={form}
        name="pick"
        kind="select"
        label="Pick"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />
    </form>
  );
}

describe("FormField", () => {
  it("links label, hint and error, and passes axe", async () => {
    let form: ReturnType<typeof useHarnessForm> | undefined;
    const { container } = render(<Harness onReady={(f) => (form = f)} />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    await act(async () => {
      form?.setError("name", { message: "That name is already taken." });
    });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    const texts = describedBy.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toContain("That name is already taken.");
    expect(screen.getByRole("alert").textContent).toBe("That name is already taken.");
    const results = await axe.run(container, {
      rules: { region: { enabled: false }, "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("writes typed values into the form, with the counter and the optional marker", () => {
    let form: ReturnType<typeof useHarnessForm> | undefined;
    render(<Harness onReady={(f) => (form = f)} />);
    fireEvent.change(screen.getByRole("textbox", { name: /About you/ }), {
      target: { value: "hello" },
    });
    expect(form?.getValues("bio")).toBe("hello");
    expect(screen.getByText("5 / 10")).toBeTruthy();
    expect(screen.getByText("(optional)")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Pick" }), { target: { value: "b" } });
    expect(form?.getValues("pick")).toBe("b");
  });

  it("renders hostile input as inert text", async () => {
    let form: ReturnType<typeof useHarnessForm> | undefined;
    render(<Harness onReady={(f) => (form = f)} />);
    await act(async () => {
      form?.setError("name", { message: "<img src=x onerror=alert(1)> 🧨 مرحبا" });
    });
    expect(screen.getByText("<img src=x onerror=alert(1)> 🧨 مرحبا")).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });
});
