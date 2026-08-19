import { calculateFourPillars } from "@/lib/four-pillars.mjs";
import { formatQiMenText } from "@/lib/qi-men.mjs";
import { buildSimpleChart } from "@/lib/simple-chart.mjs";
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
  return buildSimpleChart(pillars, { qiMen: { method: input.method || defaults.qiMen.method } }).qiMen;
}

function respond(result: ReturnType<typeof calculate>, format: unknown) {
  if (format === "text" || format === "file") {
    return new Response(formatQiMenText(result) + "\n", { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", ...(format === "file" ? { "Content-Disposition": "attachment; filename=qimen-result.txt" } : {}) } });
  }
  return Response.json(result, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const input = Object.fromEntries(new URL(request.url).searchParams.entries());
    if (!input.solarTime && !input.datetime) return Response.json({ name: "知命拆补法奇门 API", module: "qi-men", usage: "GET /api/qimen?solarTime=1992-03-15%2014:30&longitude=113.27", method: "chai-bu", formats: ["json", "text", "file"] }, { headers: corsHeaders });
    return respond(calculate(input), input.format);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "奇门排盘失败" }, { status: 400, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    return respond(calculate(input), input.format);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "奇门排盘失败" }, { status: 400, headers: corsHeaders });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
