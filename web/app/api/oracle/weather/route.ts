import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`
    );
    const weatherData = await weatherRes.json();

    return NextResponse.json({
      temperature: weatherData.current?.temperature_2m,
      humidity: weatherData.current?.relative_humidity_2m,
      source: "Open-Meteo Oracle",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Oracle unavailable" }, { status: 500 });
  }
}