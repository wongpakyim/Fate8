import { calculateFourPillars } from "@/lib/four-pillars.mjs";
import { calculateZiWei, formatZiWeiText } from "@/lib/zi-wei.mjs";
import defaults from "@/config/bazi.config.json";

export const runtime = "edge";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function calculate(input: Record<string, unknown>) {
  const pillars = calculateFourPillars({
    solarTime: input.solarTime || input.datetime || input.date,
    longitude: input.longitude == null ? undefined : Number(input.longitude),
    latitude: input.latitude == null ? undefined : Number(input.latitude),
    location: input.location,
    timezoneOffset: input.timezoneOffset == null ? undefined : Number(input.timezoneOffset),
    sex: input.sex,
  }, {
    ...defaults,
    dayBoundary: Number(input.dayBoundary || defaults.dayBoundary),
    solarTimeMode: input.solarTimeMode || defaults.solarTimeMode,
  });
  return calculateZiWei(pillars, { referenceYear: input.referenceYear == null ? undefined : Number(input.referenceYear) });
}

function respond(result: ReturnType<typeof calculate>, input: Record<string, unknown>) {
  if (input.format === "text" || input.format === "file") {
    const text = formatZiWeiText(result, input.decadeIndex == null ? undefined : Number(input.decadeIndex), input.year == null ? undefined : Number(input.year));
    return new Response(text + "\n", { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", ...(input.format === "file" ? { "Content-Disposition": "attachment; filename=ziwei-result.txt" } : {}) } });
  }
  return Response.json(result, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const input = Object.fromEntries(new URL(request.url).searchParams.entries());
    if (!input.solarTime && !input.datetime) return Response.json({ name: "知命紫微斗数 API", module: "zi-wei", usage: "GET /api/ziwei?solarTime=1992-03-15%2014:30&longitude=113.27&sex=male", school: "三合派", starAlgorithm: "中州派", formats: ["json", "text", "file"] }, { headers: corsHeaders });
    return respond(calculate(input), input);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "紫微排盘失败" }, { status: 400, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    return respond(calculate(input), input);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "紫微排盘失败" }, { status: 400, headers: corsHeaders });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
