import { calculateFourPillars } from "@/lib/four-pillars.mjs";
import defaults from "@/config/bazi.config.json";

export const runtime = "edge";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function calculate(input: Record<string, unknown>) {
  return calculateFourPillars({
    solarTime: input.solarTime || input.datetime || input.date,
    longitude: input.longitude == null ? undefined : Number(input.longitude),
    latitude: input.latitude == null ? undefined : Number(input.latitude),
    location: input.location,
    timezoneOffset: input.timezoneOffset == null ? undefined : Number(input.timezoneOffset),
    sex: input.sex,
    luckDirection: input.luckDirection,
  }, {
    ...defaults,
    dayBoundary: Number(input.dayBoundary || defaults.dayBoundary),
    solarTimeMode: input.solarTimeMode || defaults.solarTimeMode,
  });
}

function respond(result: ReturnType<typeof calculateFourPillars>, format: unknown) {
  if (format === "text") {
    return new Response(`四柱：${result.fourPillars.text}\n起运：${result.luckStart.startTime}\n方向：${result.luckStart.direction}\n起运年龄：${result.luckStart.startAge} 岁\n`, { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } });
  }
  return Response.json(result, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const input = Object.fromEntries(new URL(request.url).searchParams.entries());
    if (!input.solarTime && !input.datetime) return Response.json({ name: "四柱与起运计算 API", module: "four-pillars", usage: "GET /api/pillars?solarTime=1992-03-15%2014:30&longitude=113.27" }, { headers: corsHeaders });
    return respond(calculate(input), input.format);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "四柱计算失败" }, { status: 400, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    return respond(calculate(input), input.format);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "四柱计算失败" }, { status: 400, headers: corsHeaders });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
