import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters
    const title = searchParams.get("title") || "MagicBox Knowledge Model";
    const description = searchParams.get("description") || "No-code AI modeling tool";
    const creator = searchParams.get("creator") || "A MagicBox Creator";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
              `,
            }}
          />
          
          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "40px",
              maxWidth: "900px",
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "40px",
              }}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: "20px" }}
              >
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="M12 22V12"></path>
              </svg>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                MagicBox
              </span>
            </div>
            
            {/* Title */}
            <h1
              style={{
                fontSize: "56px",
                fontWeight: "bold",
                color: "white",
                marginBottom: "20px",
                lineHeight: 1.2,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              }}
            >
              {title}
            </h1>
            
            {/* Description */}
            {description && (
              <p
                style={{
                  fontSize: "24px",
                  color: "rgba(255, 255, 255, 0.9)",
                  marginBottom: "30px",
                  maxWidth: "700px",
                  lineHeight: 1.4,
                }}
              >
                {description}
              </p>
            )}
            
            {/* Creator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "20px",
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  marginRight: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {creator.charAt(3).toUpperCase()}
              </div>
              Knowledge shared {creator}
            </div>
          </div>
          
          {/* Bottom badge */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "40px",
              background: "rgba(255, 255, 255, 0.2)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "16px",
              color: "white",
              backdropFilter: "blur(10px)",
            }}
          >
            No-Code AI Modeling
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}