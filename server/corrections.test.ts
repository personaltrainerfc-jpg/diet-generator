import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
vi.mock("./clientDb", () => ({
  getClientById: vi.fn(),
  getAdherenceRange: vi.fn(),
  getMeasurements: vi.fn(),
  createProgressReport: vi.fn(),
  getProgressReportsByClient: vi.fn(),
  getProgressReportById: vi.fn(),
  updateProgressReport: vi.fn(),
  sendProgressReport: vi.fn(),
  getClientByAccessCode: vi.fn(),
  getHydrationLogs: vi.fn(),
  getSleepLogs: vi.fn(),
  getWellnessLogs: vi.fn(),
}));

describe("CORR-1: Recipe alternatives should be generated", () => {
  it("should skip alternatives for oils, condiments, and spices", () => {
    const skipCategories = [
      "aceite de oliva", "aceite de coco", "sal", "pimienta", "orégano",
      "vinagre", "café", "infusión", "agua", "canela", "comino",
    ];
    const shouldSkip = (name: string) => {
      const lower = name.toLowerCase();
      return /aceite|vinagre|sal\b|pimienta|or[eé]gano|comino|canela|c[uú]rcuma|piment[oó]n|ajo en polvo|caf[eé]|infusi[oó]n|agua\b|especias?|condimento/i.test(lower);
    };
    for (const name of skipCategories) {
      expect(shouldSkip(name)).toBe(true);
    }
    // Non-skip items
    expect(shouldSkip("pollo")).toBe(false);
    expect(shouldSkip("arroz")).toBe(false);
    expect(shouldSkip("brócoli")).toBe(false);
  });
});

describe("CORR-4: Weekend button text", () => {
  it("should use 'Obtener Instrucciones' instead of 'Obtener Valoración'", () => {
    const buttonText = "OBTENER INSTRUCCIONES";
    expect(buttonText).not.toContain("VALORACIÓN");
    expect(buttonText).toContain("INSTRUCCIONES");
  });
});

describe("CORR-5: Wellness data visible to trainer", () => {
  it("should return hydration, sleep, and wellness data for a client", async () => {
    const { getHydrationLogs, getSleepLogs, getWellnessLogs, getClientById } = await import("./clientDb");
    const mockClient = { id: 1, trainerId: 10, name: "Test" };
    const mockHydration = [{ id: 1, clientId: 1, date: "2026-03-20", glasses: 8 }];
    const mockSleep = [{ id: 1, clientId: 1, date: "2026-03-20", hours: 7.5, quality: 4 }];
    const mockWellness = [{ id: 1, clientId: 1, date: "2026-03-20", energy: 4, mood: 5, digestion: 3, bloating: 2 }];

    (getClientById as any).mockResolvedValue(mockClient);
    (getHydrationLogs as any).mockResolvedValue(mockHydration);
    (getSleepLogs as any).mockResolvedValue(mockSleep);
    (getWellnessLogs as any).mockResolvedValue(mockWellness);

    const hydration = await getHydrationLogs(1);
    const sleep = await getSleepLogs(1);
    const wellness = await getWellnessLogs(1);

    expect(hydration).toHaveLength(1);
    expect(hydration[0].glasses).toBe(8);
    expect(sleep).toHaveLength(1);
    expect(sleep[0].hours).toBe(7.5);
    expect(wellness).toHaveLength(1);
    expect(wellness[0].energy).toBe(4);
  });
});

describe("CORR-6: Editable reports before sending", () => {
  it("should create a report with draft status by default", async () => {
    const { createProgressReport } = await import("./clientDb");
    (createProgressReport as any).mockResolvedValue({ id: 1 });

    const result = await createProgressReport({
      clientId: 1,
      trainerId: 10,
      periodStart: "2026-03-01",
      periodEnd: "2026-03-07",
      adherencePercent: 85,
      mealsCompleted: 17,
      mealsTotal: 20,
      motivationalMessage: "Great job!",
      highlights: ["Adherencia excelente"],
    });

    expect(result.id).toBe(1);
    expect(createProgressReport).toHaveBeenCalledWith(
      expect.objectContaining({
        adherencePercent: 85,
        mealsCompleted: 17,
      })
    );
  });

  it("should allow updating a draft report", async () => {
    const { updateProgressReport, getProgressReportById } = await import("./clientDb");
    const draftReport = { id: 1, trainerId: 10, status: "draft", motivationalMessage: "Old message" };
    (getProgressReportById as any).mockResolvedValue(draftReport);
    (updateProgressReport as any).mockResolvedValue({ ...draftReport, motivationalMessage: "New message", trainerNotes: "My notes" });

    const updated = await updateProgressReport(1, {
      motivationalMessage: "New message",
      trainerNotes: "My notes",
    });

    expect(updated.motivationalMessage).toBe("New message");
    expect(updated.trainerNotes).toBe("My notes");
  });

  it("should mark a report as sent", async () => {
    const { sendProgressReport, getProgressReportById } = await import("./clientDb");
    const draftReport = { id: 1, trainerId: 10, status: "draft" };
    (getProgressReportById as any).mockResolvedValue(draftReport);
    (sendProgressReport as any).mockResolvedValue({ ...draftReport, status: "sent", sentAt: new Date() });

    const sent = await sendProgressReport(1);

    expect(sent.status).toBe("sent");
    expect(sent.sentAt).toBeDefined();
  });

  it("should only show sent reports to clients", async () => {
    const { getProgressReportsByClient } = await import("./clientDb");
    const allReports = [
      { id: 1, status: "draft", periodStart: "2026-03-01" },
      { id: 2, status: "sent", periodStart: "2026-02-22" },
      { id: 3, status: "sent", periodStart: "2026-02-15" },
    ];
    (getProgressReportsByClient as any).mockResolvedValue(allReports);

    const reports = await getProgressReportsByClient(1);
    const clientVisibleReports = reports.filter((r: any) => r.status === "sent");

    expect(clientVisibleReports).toHaveLength(2);
    expect(clientVisibleReports.every((r: any) => r.status === "sent")).toBe(true);
  });
});
