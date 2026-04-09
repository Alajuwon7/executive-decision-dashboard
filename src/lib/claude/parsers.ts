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
