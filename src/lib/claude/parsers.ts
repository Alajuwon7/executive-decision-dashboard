export function parseOrientResponse(raw: string): Record<string, any> {
  try {
    // Try to extract JSON from the response (in case Claude adds any wrapper text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Failed to parse Orient analysis response");
  }
}

export function parseDecideResponse(raw: string): { options: any[]; summary: string } {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      options: parsed.options ?? [],
      summary: parsed.summary ?? "",
    };
  } catch {
    throw new Error("Failed to parse Decide options response");
  }
}

export function parseWWITResponse(raw: string): { cards: any[]; summary: string } {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    const cards = (parsed.cards ?? []).map((c: any, i: number) => ({
      id: c.id ?? `wwit-${i}`,
      title: c.title ?? "",
      description: c.description ?? "",
      category: c.category ?? "restructure",
      monthlySavingsOrRevenue: Number(c.monthlySavingsOrRevenue ?? 0),
      implementationSteps: Array.isArray(c.implementationSteps) ? c.implementationSteps : [],
      timeToImpact: c.timeToImpact ?? "",
      difficulty: c.difficulty ?? "medium",
      newProjectedDate: c.newProjectedDate ?? null,
    }));
    return { cards, summary: parsed.summary ?? "" };
  } catch {
    throw new Error("Failed to parse What Would It Take response");
  }
}

export function parsePatternAnalysisResponse(raw: string): {
  insights: any[];
  overallHealth: string;
  healthSummary: string;
} {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      insights: parsed.insights ?? [],
      overallHealth: parsed.overallHealth ?? "stable",
      healthSummary: parsed.healthSummary ?? "",
    };
  } catch {
    throw new Error("Failed to parse Pattern Analysis response");
  }
}
