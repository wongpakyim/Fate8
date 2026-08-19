import { calculateBazi, formatBaziText, reverseSearchBazi } from "@/lib/bazi.mjs";
import defaults from "@/config/bazi.config.json";

export const runtime = "edge";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function responseFor(payload: unknown, format = "json", filename = "bazi-result") {
  if (format === "text" || format === "file") {
    const content = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    return new Response(content, { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", ...(format === "file" ? { "Content-Disposition": `attachment; filename="${filename}.txt"` } : {}) } });
  }
  return Response.json(payload, { headers: corsHeaders });
}

function handle(input: Record<string, unknown>) {
  const action = String(input.action || "chart");
  const format = String(input.format || "json");
  if (action === "reverse") {
    const data = reverseSearchBazi(input.pillars, {
      ...defaults,
      startYear: input.startYear,
      endYear: input.endYear,
      maxResults: input.maxResults,
      longitude: input.longitude,
      timezoneOffset: input.timezoneOffset,
      dayBoundary: Number(input.dayBoundary || defaults.dayBoundary),
      solarTimeMode: input.solarTimeMode || defaults.solarTimeMode,
      sex: input.sex,
    });
    return responseFor(data, format, "bazi-reverse");
  }
  const result = calculateBazi({
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
  return responseFor(format === "json" ? result : formatBaziText(result), format);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = Object.fromEntries(url.searchParams.entries());
    if (!input.solarTime && !input.datetime && input.action !== "reverse") {
      return Response.json({ name: "知命排盘 API", version: "0.1.0", usage: "GET /api/bazi?solarTime=1992-03-15%2014:30&longitude=113.27", formats: ["json", "text", "file"], actions: ["chart", "reverse"] }, { headers: corsHeaders });
    }
    return handle(input);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "排盘失败" }, { status: 400, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    return handle(await request.json());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "排盘失败" }, { status: 400, headers: corsHeaders });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
